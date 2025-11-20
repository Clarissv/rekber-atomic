const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const { connectToDatabase } = require('./src/utilities/database');
const { handleFeeSelection, handleMemberSelection, handleCloseTicket } = require('./src/functions/ticketHandler');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ],
  partials: ['CHANNEL'] // Required for thread access
});

client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'src', 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    console.log(`✅ Loaded command: ${command.data.name}`);
  } else {
    console.log(`⚠️ Warning: ${file} is missing required "data" or "execute" property.`);
  }
}

// Ready event
client.once(Events.ClientReady, async (c) => {
  console.log(`🤖 Bot is ready! Logged in as ${c.user.tag}`);
  
  // Connect to database
  try {
    await connectToDatabase();
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }

  // Register slash commands
  try {
    console.log('📝 Registering slash commands...');
    const commands = client.commands.map(cmd => cmd.data.toJSON());
    
    // Register commands globally (you can also register per guild for testing)
    await client.application.commands.set(commands);
    console.log('✅ Slash commands registered successfully!');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
});

// Interaction handler
client.on(Events.InteractionCreate, async (interaction) => {
  // Handle slash commands
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(`Error executing ${interaction.commandName}:`, error);
      const errorMessage = { content: '❌ There was an error executing this command!', ephemeral: true };
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  }

  // Handle select menus
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'ticket_fee_select') {
      await handleFeeSelection(interaction);
    }
  }

  // Handle user select menus
  if (interaction.isUserSelectMenu()) {
    if (interaction.customId.startsWith('member_select_')) {
      await handleMemberSelection(interaction);
    }
  }

  // Handle buttons
  if (interaction.isButton()) {
    if (interaction.customId === 'close_ticket') {
      await handleCloseTicket(interaction);
    }
  }
});

// Error handling
client.on(Events.Error, (error) => {
  console.error('Client error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

// Login
client.login(process.env.BOT_TOKEN);
