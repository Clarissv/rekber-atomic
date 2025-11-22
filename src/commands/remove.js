const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const Ticket = require('../schemas/Ticket');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Hapus member dari thread tiket ini')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User yang akan dihapus dari tiket')
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

      const userToRemove = interaction.options.getUser('user');

      // Prevent removing the ticket creator or the other party
      if (userToRemove.id === ticket.creatorId || userToRemove.id === ticket.otherPartyId) {
        return await interaction.reply({ 
          content: '❌ Anda tidak dapat menghapus pembuat tiket atau pihak lain dari tiket.', 
          flags: MessageFlags.Ephemeral 
        });
      }
      
      // Remove the member from the thread
      await interaction.channel.members.remove(userToRemove.id);
      
      // Update database
      await Ticket.removeMember(interaction.channel.id, userToRemove.id);

      await interaction.reply({ 
        content: `✅ ${userToRemove} telah dihapus dari tiket ini.` 
      });

    } catch (error) {
      console.error('Error in remove command:', error);
      await interaction.reply({ 
        content: '❌ Terjadi kesalahan saat menghapus member.', 
        flags: MessageFlags.Ephemeral 
      });
    }
  }
};
