const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const Ticket = require('../schemas/Ticket');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove a member from the current ticket thread')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to remove from the ticket')
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      // Check if we're in a thread
      if (!interaction.channel.isThread()) {
        return await interaction.reply({ 
          content: '❌ This command can only be used in a ticket thread.', 
          flags: MessageFlags.Ephemeral 
        });
      }

      const ticket = await Ticket.getTicket(interaction.channel.id);
      
      if (!ticket) {
        return await interaction.reply({ 
          content: '❌ This is not a valid ticket thread.', 
          flags: MessageFlags.Ephemeral 
        });
      }

      const userToRemove = interaction.options.getUser('user');

      // Prevent removing the ticket creator or the other party
      if (userToRemove.id === ticket.creatorId || userToRemove.id === ticket.otherPartyId) {
        return await interaction.reply({ 
          content: '❌ You cannot remove the ticket creator or the other party from the ticket.', 
          flags: MessageFlags.Ephemeral 
        });
      }
      
      // Remove the member from the thread
      await interaction.channel.members.remove(userToRemove.id);
      
      // Update database
      await Ticket.removeMember(interaction.channel.id, userToRemove.id);

      await interaction.reply({ 
        content: `✅ ${userToRemove} has been removed from this ticket.` 
      });

    } catch (error) {
      console.error('Error in remove command:', error);
      await interaction.reply({ 
        content: '❌ An error occurred while removing the member.', 
        ephemeral: true 
      });
    }
  }
};
