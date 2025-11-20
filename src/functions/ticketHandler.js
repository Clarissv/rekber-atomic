const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
const GuildConfig = require('../schemas/GuildConfig');
const Ticket = require('../schemas/Ticket');

async function handleFeeSelection(interaction) {
  try {
    const feeIndex = parseInt(interaction.values[0].split('_')[1]);
    const guildId = interaction.guild.id;
    const config = await GuildConfig.getConfig(guildId);
    const selectedFee = config.feeLimits[feeIndex];

    // Create member selection dropdown
    const members = await interaction.guild.members.fetch();
    const memberOptions = members
      .filter(member => !member.user.bot && member.id !== interaction.user.id)
      .map(member => ({
        label: member.user.username,
        description: member.user.tag,
        value: member.id
      }))
      .slice(0, 25); // Discord limit

    if (memberOptions.length === 0) {
      return await interaction.reply({ 
        content: '❌ No other members found in the server.', 
        ephemeral: true 
      });
    }

    const embed = new EmbedBuilder()
      .setColor('#0099FF')
      .setTitle('👥 Select Trading Partner')
      .setDescription(
        `**Transaction Range:** ${selectedFee.label}\n` +
        `**Fee:** ${selectedFee.percentage ? `${selectedFee.percentage}%` : `Rp ${selectedFee.fee.toLocaleString('id-ID')}`}\n\n` +
        'Please select the person you are trading with from the dropdown below.'
      );

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`member_select_${feeIndex}`)
      .setPlaceholder('Select the other party')
      .addOptions(memberOptions);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

  } catch (error) {
    console.error('Error in handleFeeSelection:', error);
    await interaction.reply({ 
      content: '❌ An error occurred while processing your selection.', 
      ephemeral: true 
    });
  }
}

async function handleMemberSelection(interaction) {
  try {
    const feeIndex = parseInt(interaction.customId.split('_')[2]);
    const otherPartyId = interaction.values[0];
    const guildId = interaction.guild.id;
    const config = await GuildConfig.getConfig(guildId);
    const selectedFee = config.feeLimits[feeIndex];

    await interaction.deferReply({ ephemeral: true });

    // Create private thread
    const threadName = `ticket-${interaction.user.username}-${Date.now()}`;
    const thread = await interaction.channel.threads.create({
      name: threadName,
      type: ChannelType.PrivateThread,
      reason: `Ticket created by ${interaction.user.tag}`
    });

    // Add members to thread
    await thread.members.add(interaction.user.id);
    await thread.members.add(otherPartyId);
    await thread.members.add(process.env.Access_ID);

    // Create ticket in database
    await Ticket.createTicket({
      guildId,
      threadId: thread.id,
      channelId: interaction.channel.id,
      creatorId: interaction.user.id,
      otherPartyId,
      feeRange: selectedFee.label,
      fee: selectedFee.percentage ? `${selectedFee.percentage}%` : `Rp ${selectedFee.fee.toLocaleString('id-ID')}`,
      members: [interaction.user.id, otherPartyId, process.env.Access_ID]
    });

    // Send welcome message with payment info
    const welcomeEmbed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('🎫 Ticket Created')
      .setDescription(
        `Hello <@${interaction.user.id}> and <@${otherPartyId}>!\n\n` +
        `**Transaction Range:** ${selectedFee.label}\n` +
        `**Middleman Fee:** ${selectedFee.percentage ? `${selectedFee.percentage}%` : `Rp ${selectedFee.fee.toLocaleString('id-ID')}`}\n\n` +
        `A staff member <@${process.env.Access_ID}> has been added to assist you.\n` +
        `Please proceed with your transaction details.`
      )
      .setTimestamp();

    await thread.send({ content: `<@${interaction.user.id}> <@${otherPartyId}> <@${process.env.Access_ID}>`, embeds: [welcomeEmbed] });

    // Send payment method if QRIS is configured
    if (config.qrisImageUrl) {
      const paymentEmbed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('💳 Payment Method')
        .setDescription('Please use the following QRIS code for payment:')
        .setImage(config.qrisImageUrl)
        .setTimestamp();

      await thread.send({ embeds: [paymentEmbed] });
    }

    // Send close button (pinned)
    const closeButton = new ButtonBuilder()
      .setCustomId('close_ticket')
      .setLabel('Close Ticket')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🔒');

    const closeRow = new ActionRowBuilder().addComponents(closeButton);

    const closeEmbed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('🔒 Close Ticket')
      .setDescription('When the transaction is complete, click the button below to close this ticket.\n\n**Note:** Only authorized staff can close tickets.');

    const closeMessage = await thread.send({ embeds: [closeEmbed], components: [closeRow] });
    await closeMessage.pin();

    // Send audit log
    if (config.auditLogChannel) {
      const auditChannel = await interaction.guild.channels.fetch(config.auditLogChannel);
      const auditEmbed = new EmbedBuilder()
        .setColor('#0099FF')
        .setTitle('📋 Ticket Created')
        .addFields(
          { name: 'Ticket', value: `${thread}`, inline: true },
          { name: 'Creator', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Other Party', value: `<@${otherPartyId}>`, inline: true },
          { name: 'Fee Range', value: selectedFee.label, inline: true },
          { name: 'Fee', value: selectedFee.percentage ? `${selectedFee.percentage}%` : `Rp ${selectedFee.fee.toLocaleString('id-ID')}`, inline: true },
          { name: 'Created At', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
        )
        .setTimestamp();

      await auditChannel.send({ embeds: [auditEmbed] });
    }

    await interaction.editReply({ 
      content: `✅ Ticket created! Please check ${thread}` 
    });

  } catch (error) {
    console.error('Error in handleMemberSelection:', error);
    await interaction.editReply({ 
      content: '❌ An error occurred while creating the ticket.' 
    });
  }
}

async function handleCloseTicket(interaction) {
  try {
    // Check if user is authorized (Access_ID)
    if (interaction.user.id !== process.env.Access_ID) {
      return await interaction.reply({ 
        content: '❌ Only authorized staff can close tickets.', 
        ephemeral: true 
      });
    }

    await interaction.deferReply();

    const thread = interaction.channel;
    const ticket = await Ticket.getTicket(thread.id);

    if (!ticket) {
      return await interaction.editReply({ 
        content: '❌ This is not a valid ticket thread.' 
      });
    }

    // Close ticket in database
    await Ticket.closeTicket(thread.id, interaction.user.id);

    // Get config for ticket log channel
    const config = await GuildConfig.getConfig(interaction.guild.id);

    // Create ticket summary
    const summaryEmbed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('🔒 Ticket Closed')
      .setDescription(`This ticket has been closed by <@${interaction.user.id}>`)
      .addFields(
        { name: 'Creator', value: `<@${ticket.creatorId}>`, inline: true },
        { name: 'Other Party', value: `<@${ticket.otherPartyId}>`, inline: true },
        { name: 'Fee Range', value: ticket.feeRange, inline: true },
        { name: 'Fee', value: ticket.fee, inline: true },
        { name: 'Created', value: `<t:${Math.floor(new Date(ticket.createdAt).getTime() / 1000)}:F>`, inline: true },
        { name: 'Closed', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [summaryEmbed] });

    // Send to ticket log channel with read button
    if (config.ticketLogChannel) {
      const logChannel = await interaction.guild.channels.fetch(config.ticketLogChannel);
      
      const viewButton = new ButtonBuilder()
        .setLabel('View Thread')
        .setStyle(ButtonStyle.Link)
        .setURL(`https://discord.com/channels/${interaction.guild.id}/${thread.id}`);

      const buttonRow = new ActionRowBuilder().addComponents(viewButton);

      const logEmbed = new EmbedBuilder()
        .setColor('#FF6B6B')
        .setTitle('🎫 Ticket Closed')
        .addFields(
          { name: 'Ticket ID', value: thread.id, inline: true },
          { name: 'Ticket Name', value: thread.name, inline: true },
          { name: 'Closed By', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Creator', value: `<@${ticket.creatorId}>`, inline: true },
          { name: 'Other Party', value: `<@${ticket.otherPartyId}>`, inline: true },
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
        .setTitle('🔒 Ticket Closed')
        .addFields(
          { name: 'Ticket', value: `${thread}`, inline: true },
          { name: 'Closed By', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Creator', value: `<@${ticket.creatorId}>`, inline: true },
          { name: 'Duration', value: this.calculateDuration(ticket.createdAt), inline: true }
        )
        .setTimestamp();

      await auditChannel.send({ embeds: [auditEmbed] });
    }

    // Archive and lock the thread after a delay
    setTimeout(async () => {
      await thread.setArchived(true);
      await thread.setLocked(true);
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
