const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const Ticket = require('../schemas/Ticket');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add')
    .setDescription('Tambahkan member ke thread tiket ini')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User yang akan ditambahkan ke tiket')
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      // Check if we're in a thread
      if (!interaction.channel.isThread()) {
        return await interaction.reply({ 
          content: '❌ Perintah ini hanya dapat digunakan di thread tiket.', 
          flags: MessageFlags.Ephemeral 
        });
      }

      const ticket = await Ticket.getTicket(interaction.channel.id);
      
      if (!ticket) {
        return await interaction.reply({ 
          content: '❌ Ini bukan thread tiket yang valid.', 
          flags: MessageFlags.Ephemeral 
        });
      }

      const userToAdd = interaction.options.getUser('user');
      
      // Add the member to the thread
      await interaction.channel.members.add(userToAdd.id);
      
      // Update database
      await Ticket.addMember(interaction.channel.id, userToAdd.id);

      await interaction.reply({ 
        content: `✅ ${userToAdd} telah ditambahkan ke tiket ini.` 
      });

    } catch (error) {
      console.error('Error in add command:', error);
      await interaction.reply({ 
        content: '❌ Terjadi kesalahan saat menambahkan member.', 
        flags: MessageFlags.Ephemeral 
      });
    }
  }
};
