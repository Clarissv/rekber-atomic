const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const Ticket = require('../schemas/Ticket');
const GuildConfig = require('../schemas/GuildConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('complete')
    .setDescription('Mark transaction as completed and send success log'),

  async execute(interaction) {
    // Check if user is Access_ID
    if (interaction.user.id !== process.env.Access_ID) {
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

      const config = await GuildConfig.getConfig(interaction.guild.id);

      // Send to completed log channel (public)
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
