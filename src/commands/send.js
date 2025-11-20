const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, MessageFlags } = require('discord.js');
const GuildConfig = require('../schemas/GuildConfig');
require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('send')
    .setDescription('Send the ticket panel in the current channel'),

  async execute(interaction) {
    // Check if user is Access_ID
    if (interaction.user.id !== process.env.Access_ID) {
      return await interaction.reply({ 
        content: '❌ Only authorized staff can use this command.', 
        flags: MessageFlags.Ephemeral 
      });
    }

    const guildId = interaction.guild.id;

    try {
      const config = await GuildConfig.getConfig(guildId);

      if (config.feeLimits.length === 0) {
        return await interaction.reply({ 
          content: '❌ Please configure fee limits first using `/configure add-fee`', 
          flags: MessageFlags.Ephemeral 
        });
      }

      // Create the ticket panel embed
      const embed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle('🎫 Middleman Service - Create Ticket')
        .setDescription(
          '**Welcome to our Middleman Service!**\n\n' +
          'To create a ticket, please select the transaction amount range from the dropdown below.\n\n' +
          '**Our Fee Structure:**\n' +
          config.feeLimits.map(limit => {
            const feeText = limit.percentage 
              ? `${limit.percentage}% flat` 
              : `Rp ${limit.fee.toLocaleString('id-ID')}`;
            return `• ${limit.label} → **${feeText}**`;
          }).join('\n')
        )
        .setFooter({ text: 'Select your transaction range to get started' })
        .setTimestamp();

      // Create dropdown with fee options
      const options = config.feeLimits.map((limit, index) => ({
        label: limit.label,
        description: `Fee: ${limit.percentage ? `${limit.percentage}%` : `Rp ${limit.fee.toLocaleString('id-ID')}`}`,
        value: `fee_${index}`
      }));

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('ticket_fee_select')
        .setPlaceholder('Select transaction amount range')
        .addOptions(options);

      const row = new ActionRowBuilder().addComponents(selectMenu);

      await interaction.channel.send({ embeds: [embed], components: [row] });
      
      await interaction.reply({ 
        content: '✅ Ticket panel sent successfully!', 
        flags: MessageFlags.Ephemeral 
      });

    } catch (error) {
      console.error('Error in send command:', error);
      await interaction.reply({ 
        content: '❌ An error occurred while sending the ticket panel.', 
        ephemeral: true 
      });
    }
  }
};
