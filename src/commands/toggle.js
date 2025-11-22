const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const GuildConfig = require('../schemas/GuildConfig');
const { isAuthorized } = require('../utilities/helpers');
require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('toggle')
    .setDescription('Buka atau tutup sistem tiket')
    .addStringOption(option =>
      option.setName('status')
        .setDescription('Atur status sistem tiket')
        .setRequired(true)
        .addChoices(
          { name: 'Buka - Member dapat membuat tiket', value: 'open' },
          { name: 'Tutup - Member tidak dapat membuat tiket', value: 'close' }
        )
    ),

  async execute(interaction) {
    // Check if user is Access_ID
    if (!isAuthorized(interaction.user.id)) {
      return await interaction.reply({ 
        content: '❌ Hanya staff yang berwenang yang dapat menggunakan perintah ini.', 
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
        .setTitle(`🎫 Sistem Tiket ${isOpen ? 'Dibuka' : 'Ditutup'}`)
        .setDescription(
          isOpen 
            ? '✅ Member sekarang dapat membuat tiket.' 
            : '🔒 Pembuatan tiket sekarang dinonaktifkan. Member tidak dapat membuat tiket baru.'
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });

    } catch (error) {
      console.error('Error in toggle command:', error);
      await interaction.reply({ 
        content: '❌ Terjadi kesalahan saat mengubah status sistem tiket.', 
        flags: MessageFlags.Ephemeral 
      });
    }
  }
};
