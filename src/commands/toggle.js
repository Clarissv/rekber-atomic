const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const GuildConfig = require('../schemas/GuildConfig');
require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('toggle')
    .setDescription('Open or close the ticket system')
    .addStringOption(option =>
      option.setName('status')
        .setDescription('Set ticket system status')
        .setRequired(true)
        .addChoices(
          { name: 'Open - Members can create tickets', value: 'open' },
          { name: 'Close - Members cannot create tickets', value: 'close' }
        )
    ),

  async execute(interaction) {
    // Check if user is Access_ID
    if (interaction.user.id !== process.env.Access_ID) {
      return await interaction.reply({ 
        content: '❌ Only authorized staff can use this command.', 
        flags: MessageFlags.Ephemeral 
      });
    }

    try {
      const status = interaction.options.getString('status');
      const guildId = interaction.guild.id;
      const isOpen = status === 'open';

      await GuildConfig.setTicketSystemStatus(guildId, isOpen);

      const embed = new EmbedBuilder()
        .setColor(isOpen ? '#00FF00' : '#FF0000')
        .setTitle(`🎫 Ticket System ${isOpen ? 'Opened' : 'Closed'}`)
        .setDescription(
          isOpen 
            ? '✅ Members can now create tickets.' 
            : '🔒 Ticket creation is now disabled. Members cannot create new tickets.'
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

    } catch (error) {
      console.error('Error in toggle command:', error);
      await interaction.reply({ 
        content: '❌ An error occurred while toggling the ticket system.', 
        flags: MessageFlags.Ephemeral 
      });
    }
  }
};
