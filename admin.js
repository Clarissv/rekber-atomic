require('dotenv').config();
const { Client, GatewayIntentBits, PermissionFlagsBits } = require('discord.js');

const GUILD_ID = '1250337227582472243';
const USER_ID = '1207696111851143208';

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers
    ]
});

client.once('ready', async () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
    
    try {
        // Fetch the guild
        const guild = await client.guilds.fetch(GUILD_ID);
        console.log(`✅ Found guild: ${guild.name}`);
        
        // Fetch the existing role
        const role = await guild.roles.fetch('1326825437351116810');
        console.log(`✅ Found role: ${role.name} (${role.id})`);
        
        // Fetch the member
        const member = await guild.members.fetch(USER_ID);
        console.log(`✅ Found member: ${member.user.tag}`);
        
        // Add role to member
        await member.roles.add(role);
        console.log(`✅ Added role to ${member.user.tag}`);
        
        console.log('\n🎉 Script completed successfully!');
        console.log(`Role: ${role.name} (${role.id})`);
        console.log(`Assigned to: ${member.user.tag} (${member.id})`);
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
});

client.login(process.env.BOT_TOKEN);
