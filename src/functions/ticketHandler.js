const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, UserSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType, MessageFlags } = require('discord.js');
const GuildConfig = require('../schemas/GuildConfig');
const Ticket = require('../schemas/Ticket');
const { isAuthorized, getAuthorizedIds } = require('../utilities/helpers');

async function handleFeeSelection(interaction) {
  try {
    const feeIndex = parseInt(interaction.values[0].split('_')[1]);
    const guildId = interaction.guild.id;
    const config = await GuildConfig.getConfig(guildId);
    
    // Check if ticket system is open
    if (config.ticketSystemOpen === false) {
      return await interaction.reply({
        content: '❌ Sistem tiket saat ini sedang ditutup. Silakan coba lagi nanti.',
        flags: MessageFlags.Ephemeral
      });
    }
    
    const selectedFee = config.feeLimits[feeIndex];

    const embed = new EmbedBuilder()
      .setColor('#0099FF')
      .setTitle('👥 Pilih Partner Trading')
      .setDescription(
        `**Rentang Transaksi:** ${selectedFee.label}\n` +
        `**Fee:** ${selectedFee.percentage ? `${selectedFee.percentage}%` : `Rp ${selectedFee.fee.toLocaleString('id-ID')}`}\n\n` +
        'Silakan pilih orang yang akan trading dengan Anda dari dropdown di bawah.'
      );

    // Use UserSelectMenuBuilder for searchable user selection
    const userSelect = new UserSelectMenuBuilder()
      .setCustomId(`member_select_${feeIndex}`)
      .setPlaceholder('Pilih pihak lain')
      .setMinValues(1)
      .setMaxValues(1);

    const row = new ActionRowBuilder().addComponents(userSelect);

    await interaction.reply({ 
      embeds: [embed], 
      components: [row], 
      flags: MessageFlags.Ephemeral 
    });

  } catch (error) {
    console.error('Error in handleFeeSelection:', error);
    const reply = { 
      content: '❌ Terjadi kesalahan saat memproses pilihan Anda.', 
      flags: MessageFlags.Ephemeral 
    };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
}

async function handleMemberSelection(interaction) {
  try {
    const feeIndex = parseInt(interaction.customId.split('_')[2]);
    const otherPartyId = interaction.values[0]; // UserSelectMenu returns array of user IDs
    const guildId = interaction.guild.id;
    const config = await GuildConfig.getConfig(guildId);
    const selectedFee = config.feeLimits[feeIndex];

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // Create private thread
    const threadName = `ticket-${interaction.user.username}-${Date.now()}`;
    const thread = await interaction.channel.threads.create({
      name: threadName,
      type: ChannelType.PrivateThread,
      invitable: false,
      reason: `Ticket created by ${interaction.user.tag}`
    });

    // Join the thread first (bot must be in thread to add others)
    await thread.join();

    // Track which members were successfully added
    const addedMembers = [];
    const failedMembers = [];

    // Add members to thread with proper error handling
    const membersToAdd = [
      interaction.user.id,
      otherPartyId
    ];
    
    // Add all authorized staff members
    const authorizedIds = getAuthorizedIds();
    authorizedIds.forEach(id => {
      if (id !== interaction.client.user.id && !membersToAdd.includes(id)) {
        membersToAdd.push(id);
      }
    });

    for (const memberId of membersToAdd) {
      try {
        await thread.members.add(memberId);
        console.log(`✅ Added member ${memberId} to thread ${thread.id}`);
        addedMembers.push(memberId);
      } catch (memberError) {
        console.error(`❌ Error adding member ${memberId}:`, memberError.message);
        failedMembers.push(memberId);
      }
    }

    // If the other party couldn't be added, send them a message to join manually
    if (failedMembers.includes(otherPartyId)) {
      try {
        const otherUser = await interaction.guild.members.fetch(otherPartyId);
        await otherUser.send({
          content: `🎫 You've been invited to a ticket!\n\nPlease join this thread: https://discord.com/channels/${interaction.guild.id}/${thread.id}\n\n**Ticket created by:** <@${interaction.user.id}>`
        });
      } catch (dmError) {
        console.log('Could not DM user, they will see the mention in thread');
      }
    }

    // Create ticket in database
    await Ticket.createTicket({
      guildId,
      threadId: thread.id,
      channelId: interaction.channel.id,
      creatorId: interaction.user.id,
      otherPartyId,
      feeRange: selectedFee.label,
      fee: selectedFee.percentage ? `${selectedFee.percentage}%` : `Rp ${selectedFee.fee.toLocaleString('id-ID')}`,
      members: [interaction.user.id, otherPartyId, ...getAuthorizedIds()]
    });

    // Send welcome message with payment info
    const staffMentions = getAuthorizedIds().map(id => `<@${id}>`).join(' ');
    const welcomeEmbed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('🎫 Tiket Dibuat')
      .setDescription(
        `Halo <@${interaction.user.id}> dan <@${otherPartyId}>!\n\n` +
        `**Rentang Transaksi:** ${selectedFee.label}\n` +
        `**Fee Middleman:** ${selectedFee.percentage ? `${selectedFee.percentage}%` : `Rp ${selectedFee.fee.toLocaleString('id-ID')}`}\n\n` +
        `Staff ${staffMentions} telah ditambahkan untuk membantu Anda.\n` +
        (failedMembers.includes(otherPartyId) ? `\n⚠️ <@${otherPartyId}> - Silakan cek DM Anda atau klik thread ini untuk bergabung!\n\n` : '') +
        `Silakan lanjutkan dengan detail transaksi Anda.`
      )
      .setTimestamp();

    await thread.send({ content: `<@${interaction.user.id}> <@${otherPartyId}> ${staffMentions}`, embeds: [welcomeEmbed] });

    // Send payment method if QRIS is configured
    if (config.qrisImageUrl) {
      const paymentEmbed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('💳 Metode Pembayaran')
        .setDescription(
          'Silakan gunakan salah satu metode pembayaran berikut:\n\n' +
          '**QRIS:**\n' +
          'Scan kode QR di bawah ini\n\n' +
          '**E-Wallet / Rekening Bank:**\n' +
          '```\n' +
          '• GoPay: 08158843876\n' +
          '• OVO: 08158843876\n' +
          '• DANA: 08158843876\n' +
          '• Bank BCA: 7611612552 a.n. Konrad\n' +
          '```\n'
        )
        .setImage(config.qrisImageUrl)
        .setTimestamp();

      await thread.send({ embeds: [paymentEmbed] });
    }

    // Send close button (pinned)
    const closeButton = new ButtonBuilder()
      .setCustomId('close_ticket')
      .setLabel('Tutup Tiket')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🔒');

    const closeRow = new ActionRowBuilder().addComponents(closeButton);

    const closeEmbed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('🔒 Tutup Tiket')
      .setDescription('Ketika transaksi selesai, klik tombol di bawah untuk menutup tiket ini.\n\n**Catatan:** Hanya staff yang berwenang yang dapat menutup tiket.');

    const closeMessage = await thread.send({ embeds: [closeEmbed], components: [closeRow] });
    await closeMessage.pin();

    // Send audit log
    if (config.auditLogChannel) {
      const auditChannel = await interaction.guild.channels.fetch(config.auditLogChannel);
      const auditEmbed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle('📋 Tiket Dibuat')
        .addFields(
          { name: 'Tiket', value: `${thread}`, inline: true },
          { name: 'Pembuat', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Pihak Lain', value: `<@${otherPartyId}>`, inline: true },
          { name: 'Rentang Fee', value: selectedFee.label, inline: true },
          { name: 'Fee', value: selectedFee.percentage ? `${selectedFee.percentage}%` : `Rp ${selectedFee.fee.toLocaleString('id-ID')}`, inline: true },
          { name: 'Dibuat Pada', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
        )
        .setTimestamp();

      await auditChannel.send({ embeds: [auditEmbed] });
    }

    await interaction.editReply({ 
      content: `✅ Tiket berhasil dibuat! Silakan cek ${thread}` 
    });

  } catch (error) {
    console.error('Error in handleMemberSelection:', error);
    const reply = { content: '❌ Terjadi kesalahan saat membuat tiket. Silakan cek permission bot.' };
    if (interaction.deferred) {
      await interaction.editReply(reply);
    } else {
      await interaction.reply({ ...reply, flags: MessageFlags.Ephemeral });
    }
  }
}

async function handleCloseTicket(interaction) {
  try {
    // Check if user is authorized (Access_ID)
    if (!isAuthorized(interaction.user.id)) {
      return await interaction.reply({ 
        content: '❌ Hanya staff yang berwenang yang dapat menutup tiket.', 
        flags: MessageFlags.Ephemeral 
      });
    }

    await interaction.deferReply();

    const thread = interaction.channel;
    const ticket = await Ticket.getTicket(thread.id);

    if (!ticket) {
      return await interaction.editReply({ 
        content: '❌ Ini bukan thread tiket yang valid.' 
      });
    }

    // Close ticket in database
    await Ticket.closeTicket(thread.id, interaction.user.id);

    // Get config for ticket log channel
    const config = await GuildConfig.getConfig(interaction.guild.id);

    // Create ticket summary
    const summaryEmbed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('🔒 Tiket Ditutup')
      .setDescription(`Tiket ini telah ditutup oleh <@${interaction.user.id}>`)
      .addFields(
        { name: 'Pembuat', value: `<@${ticket.creatorId}>`, inline: true },
        { name: 'Pihak Lain', value: `<@${ticket.otherPartyId}>`, inline: true },
        { name: 'Rentang Fee', value: ticket.feeRange, inline: true },
        { name: 'Fee', value: ticket.fee, inline: true },
        { name: 'Dibuat', value: `<t:${Math.floor(new Date(ticket.createdAt).getTime() / 1000)}:F>`, inline: true },
        { name: 'Ditutup', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [summaryEmbed] });

    // Send to ticket log channel with read button
    if (config.ticketLogChannel) {
      const logChannel = await interaction.guild.channels.fetch(config.ticketLogChannel);
      
      const viewButton = new ButtonBuilder()
        .setLabel('Lihat Thread')
        .setStyle(ButtonStyle.Link)
        .setURL(`https://discord.com/channels/${interaction.guild.id}/${thread.id}`);

      const buttonRow = new ActionRowBuilder().addComponents(viewButton);

      const logEmbed = new EmbedBuilder()
        .setColor('#FF6B6B')
        .setTitle('🎫 Tiket Ditutup')
        .addFields(
          { name: 'ID Tiket', value: thread.id, inline: true },
          { name: 'Nama Tiket', value: thread.name, inline: true },
          { name: 'Ditutup Oleh', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Pembuat', value: `<@${ticket.creatorId}>`, inline: true },
          { name: 'Pihak Lain', value: `<@${ticket.otherPartyId}>`, inline: true },
          { name: 'Fee', value: ticket.fee, inline: true }
        )
        .setTimestamp();

      await logChannel.send({ embeds: [logEmbed], components: [buttonRow] });
    }

    // Send audit log
    if (config.auditLogChannel) {
      const auditChannel = await interaction.guild.channels.fetch(config.auditLogChannel);
      const auditEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('🔒 Tiket Ditutup')
        .addFields(
          { name: 'Tiket', value: `${thread}`, inline: true },
          { name: 'Ditutup Oleh', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Pembuat', value: `<@${ticket.creatorId}>`, inline: true },
          { name: 'Durasi', value: calculateDuration(ticket.createdAt), inline: true }
        )
        .setTimestamp();

      await auditChannel.send({ embeds: [auditEmbed] });
    }

    // Lock and archive the thread after a delay (lock first, then archive)
    setTimeout(async () => {
      try {
        await thread.setLocked(true);
        await thread.setArchived(true);
      } catch (archiveError) {
        console.error('Error archiving thread:', archiveError.message);
      }
    }, 5000);

  } catch (error) {
    console.error('Error in handleCloseTicket:', error);
    await interaction.editReply({ 
      content: '❌ An error occurred while closing the ticket.' 
    });
  }
}

function calculateDuration(startDate) {
  const duration = Date.now() - new Date(startDate).getTime();
  const hours = Math.floor(duration / (1000 * 60 * 60));
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

module.exports = {
  handleFeeSelection,
  handleMemberSelection,
  handleCloseTicket
};
