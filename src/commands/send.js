const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, MessageFlags } = require('discord.js');
const GuildConfig = require('../schemas/GuildConfig');
const { isAuthorized } = require('../utilities/helpers');
require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('send')
    .setDescription('Kirim panel tiket di channel ini'),

  async execute(interaction) {
    // Check if user is Access_ID
    if (!isAuthorized(interaction.user.id)) {
      return await interaction.reply({ 
        content: '❌ Hanya staff yang berwenang yang dapat menggunakan perintah ini.', 
        flags: MessageFlags.Ephemeral 
      });
    }

    const guildId = interaction.guild.id;

    try {
      const config = await GuildConfig.getConfig(guildId);

      if (config.feeLimits.length === 0) {
        return await interaction.reply({ 
          content: '❌ Silakan konfigurasi batas biaya terlebih dahulu menggunakan `/configure add-fee`', 
          flags: MessageFlags.Ephemeral 
        });
      }

      // Create the ticket panel embed
      const embed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle('🎫 Layanan Rekber - Buat Tiket')
        .setDescription(
          '**Selamat datang di Layanan Rekber kami!**\n\n' +
          'Untuk membuat tiket, silakan pilih rentang jumlah transaksi dari dropdown di bawah.\n\n' +
          '**Struktur Biaya Kami:**\n' +
          config.feeLimits.map(limit => {
            const feeText = limit.percentage 
              ? `${limit.percentage}% flat` 
              : `Rp ${limit.fee.toLocaleString('id-ID')}`;
            return `• ${limit.label} → **${feeText}**`;
          }).join('\n')
        )
        .setFooter({ text: 'Pilih rentang transaksi Anda untuk memulai' })
        .setTimestamp();

      // Create dropdown with fee options
      const options = config.feeLimits.map((limit, index) => ({
        label: limit.label,
        description: `Fee: ${limit.percentage ? `${limit.percentage}%` : `Rp ${limit.fee.toLocaleString('id-ID')}`}`,
        value: `fee_${index}`
      }));

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('ticket_fee_select')
        .setPlaceholder('Pilih rentang jumlah transaksi')
        .addOptions(options);

      const row = new ActionRowBuilder().addComponents(selectMenu);

      await interaction.channel.send({ embeds: [embed], components: [row] });
      
      await interaction.reply({ 
        content: '✅ Panel tiket berhasil dikirim!', 
        flags: MessageFlags.Ephemeral 
      });

    } catch (error) {
      console.error('Error in send command:', error);
      await interaction.reply({ 
        content: '❌ Terjadi kesalahan saat mengirim panel tiket.', 
        flags: MessageFlags.Ephemeral 
      });
    }
  }
};
