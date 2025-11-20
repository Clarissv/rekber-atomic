const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const Ticket = require('../schemas/Ticket');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add')
    .setDescription('Add a member to the current ticket thread')
    .addUser('user', option =>
      option.setName('user')
        .setDescription('The user to add to the ticket')
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      // Check if we're in a thread
      if (!interaction.channel.isThread()) {
        return await interaction.reply({ 
          content: '❌ This command can only be used in a ticket thread.', 
          ephemeral: true 
        });
      }

      const ticket = await Ticket.getTicket(interaction.channel.id);
      
      if (!ticket) {
        return await interaction.reply({ 
          content: '❌ This is not a valid ticket thread.', 
          ephemeral: true 
        });
      }

      const userToAdd = interaction.options.getUser('user');
      
      // Add the member to the thread
      await interaction.channel.members.add(userToAdd.id);
      
      // Update database
      await Ticket.addMember(interaction.channel.id, userToAdd.id);

      await interaction.reply({ 
        content: `✅ ${userToAdd} has been added to this ticket.` 
      });

    } catch (error) {
      console.error('Error in add command:', error);
      await interaction.reply({ 
        content: '❌ An error occurred while adding the member.', 
        ephemeral: true 
      });
    }
  }
};
