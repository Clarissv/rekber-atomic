const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rules')
    .setDescription('Kirim embed peraturan marketplace'),

  async execute(interaction) {
    // Check if user is Access_ID
    if (interaction.user.id !== process.env.Access_ID) {
      return await interaction.reply({ 
        content: '❌ Hanya staff yang berwenang yang dapat menggunakan command ini.', 
        flags: MessageFlags.Ephemeral 
      });
    }

    try {
      const rulesEmbed = new EmbedBuilder()
        .setColor('#FF6B6B')
        .setTitle('📜 PERATURAN MARKETPLACE')
        .setDescription(
          '**Harap dibaca dengan teliti sebelum bertransaksi!**\n\n' +
          '> Dengan melakukan transaksi di marketplace ini, Anda dianggap telah membaca dan menyetujui seluruh peraturan yang berlaku.'
        )
        .addFields(
          { 
            name: '1️⃣ Larangan Scam', 
            value: '• Dilarang keras melakukan penipuan dalam bentuk apapun\n• Pelaku scam akan di-ban permanen dari server',
            inline: false
          },
          { 
            name: '2️⃣ Jasa Middleman', 
            value: '• Gunakan jasa middleman untuk transaksi yang aman\n• Fee middleman sesuai dengan nominal transaksi\n• Middleman tidak bertanggung jawab atas kesalahan pembeli/penjual',
            inline: false
          },
          { 
            name: '3️⃣ Etika Bertransaksi', 
            value: '• Bersikaplah sopan dan profesional\n• Komunikasikan dengan jelas detail transaksi\n• Jangan spam atau mengirim pesan berulang',
            inline: false
          },
          { 
            name: '4️⃣ Tanggung Jawab', 
            value: '• Pastikan barang/jasa sesuai deskripsi\n• Cek dengan teliti sebelum melakukan pembayaran\n• Simpan bukti transaksi untuk keamanan\n• Laporkan masalah kepada staff',
            inline: false
          },
          { 
            name: '5️⃣ Pembayaran', 
            value: '• Gunakan metode pembayaran yang aman\n• Jangan transfer ke rekening selain yang ditentukan\n• Konfirmasi pembayaran dengan bukti yang jelas',
            inline: false
          }
        )
        .setFooter({ text: 'Terima kasih atas kepercayaan Anda! | Tetap waspada dan hati-hati' })
        .setTimestamp();

      await interaction.channel.send({ embeds: [rulesEmbed] });
      
      await interaction.reply({ 
        content: '✅ Peraturan marketplace berhasil dikirim!', 
        flags: MessageFlags.Ephemeral 
      });

    } catch (error) {
      console.error('Error in rules command:', error);
      await interaction.reply({ 
        content: '❌ Terjadi kesalahan saat mengirim peraturan.', 
        flags: MessageFlags.Ephemeral 
      });
    }
  }
};