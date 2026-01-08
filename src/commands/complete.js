const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const Ticket = require('../schemas/Ticket');
const GuildConfig = require('../schemas/GuildConfig');
const { isAuthorized } = require('../utilities/helpers');

// Google Apps Script Web App URL for Google Sheets
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxKQ12wmDV8_NUoDw9xQwKllEaEfAzFpiHrUwIZj08WP9L-icbd-ObWef8rgIe0baw/exec';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('complete')
    .setDescription('Mark transaction as completed and send success log')
    .addIntegerOption(option =>
      option.setName('nominal')
        .setDescription('Nominal transaksi (dalam Rupiah)')
        .setRequired(true)
        .setMinValue(1)
    )
    .addIntegerOption(option =>
      option.setName('biaya_admin')
        .setDescription('Biaya admin middleman (dalam Rupiah)')
        .setRequired(true)
        .setMinValue(0)
    )
    .addIntegerOption(option =>
      option.setName('biaya_transfer')
        .setDescription('Biaya admin transfer (dalam Rupiah)')
        .setRequired(true)
        .setMinValue(0)
    )
    .addStringOption(option =>
      option.setName('penerima')
        .setDescription('Penerima fee')
        .setRequired(true)
        .addChoices(
          { name: 'Claris', value: 'Claris' },
          { name: 'Moltres', value: 'Moltres' }
        )
    ),

  async execute(interaction) {
    // Check if user is Access_ID
    if (!isAuthorized(interaction.user.id)) {
      return await interaction.reply({ 
        content: '❌ Hanya staff yang berwenang yang dapat menggunakan command ini.', 
        flags: MessageFlags.Ephemeral 
      });
    }

    try {
      // Check if we're in a thread
      if (!interaction.channel.isThread()) {
        return await interaction.reply({ 
          content: '❌ Command ini hanya dapat digunakan di thread tiket.', 
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

      await interaction.deferReply({ flags: MessageFlags.Ephemeral });

      // Get command options
      const nominal = interaction.options.getInteger('nominal');
      const biayaAdmin = interaction.options.getInteger('biaya_admin');
      const biayaTransfer = interaction.options.getInteger('biaya_transfer');
      const penerima = interaction.options.getString('penerima');

      try {

        const labaBersih = biayaAdmin - biayaTransfer;
        
        const sheetData = {
          'Pembeli/Penjual 1': ticket.creatorId,
          'Pembeli/Penjual 2': ticket.otherPartyId,
          'Nominal Transaksi': nominal,
          'Biaya Admin Midman': biayaAdmin,
          'Biaya Admin Transfer': biayaTransfer,
          'Laba Bersih': labaBersih,
          'Penerima': penerima
        };

        const response = await fetch(GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(sheetData)
        });

        const responseData = await response.json();
        if (responseData.success) {
          console.log('✅ Data sent to Google Sheets successfully');
          console.log('📊 Sent data:', JSON.stringify(sheetData));
        } else {
          console.error('Google Sheets error:', responseData.message);
        }
      } catch (sheetError) {
        console.error('Failed to send data to Google Sheets:', sheetError);
      }

      const config = await GuildConfig.getConfig(interaction.guild.id);

      if (config.completedLogChannel) {
        const logChannel = await interaction.guild.channels.fetch(config.completedLogChannel);
        
        const completedEmbed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('✅ Transaksi Berhasil')
          .setDescription(
            '**Detail Transaksi:**'
          )
          .addFields(
            { name: '👤 Pembeli/Penjual 1', value: `<@${ticket.creatorId}>`, inline: true },
            { name: '👤 Pembeli/Penjual 2', value: `<@${ticket.otherPartyId}>`, inline: true },
            { name: '💰 Rentang Nominal', value: ticket.feeRange, inline: true },
            { name: '💵 Fee Middleman', value: ticket.fee, inline: true },
            { name: '📅 Tanggal', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
          )
          .setFooter({ text: 'Terima kasih telah menggunakan jasa middleman kami! 🙏' })
          .setTimestamp();

        await logChannel.send({ embeds: [completedEmbed] });
      }

      await interaction.editReply({ 
        content: '✅ Transaksi telah ditandai sebagai selesai dan log telah dikirim!' 
      });

    } catch (error) {
      console.error('Error in complete command:', error);
      const reply = { content: '❌ Terjadi kesalahan saat memproses command.' };
      if (interaction.deferred) {
        await interaction.editReply(reply);
      } else {
        await interaction.reply({ ...reply, flags: MessageFlags.Ephemeral });
      }
    }
  }
};
