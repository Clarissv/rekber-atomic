const { EmbedBuilder, ChannelType } = require('discord.js');
const AutoMod = require('../schemas/AutoMod');

async function handleAutoMod(message) {
  // Ignore bots
  if (message.author.bot) return;
  
  // Ignore DMs
  if (!message.guild) return;

  try {
    const config = await AutoMod.getConfig(message.guild.id);

    // Check if auto-mod is enabled
    if (!config.enabled) return;

    // Check if message is in a monitored channel OR in a thread from monitored forum
    const isMonitoredChannel = config.monitoredChannels && config.monitoredChannels.includes(message.channel.id);
    const isMonitoredForum = message.channel.isThread() && 
      message.channel.parent && 
      config.monitoredForums && 
      config.monitoredForums.includes(message.channel.parent.id);

    if (!isMonitoredChannel && !isMonitoredForum) return;


    // Check if message contains any banned keywords
    const messageContent = message.content.toLowerCase();
    const foundKeywords = config.keywords.filter(keyword => 
      messageContent.includes(keyword.toLowerCase())
    );

    if (foundKeywords.length === 0) return;

    // Save channel info before potential deletion
    const channelInfo = {
      name: message.channel.name,
      parent: message.channel.parent ? `<#${message.channel.parent.id}>` : 'Unknown Forum',
      parentName: message.channel.parent ? message.channel.parent.name : 'Unknown',
      mention: `${message.channel}`,
      id: message.channel.id
    };
    const messageContentBackup = message.content;

    // Check if mute role is configured
    if (!config.muteRoleId) {
      console.error('Auto-mod: Mute role not configured for guild', message.guild.id);
      return;
    }

    // If it's a forum post (first message in thread), delete the entire thread
    let deletedThread = false;
    if (isMonitoredForum && message.channel.isThread()) {
      try {
        const thread = message.channel;
        const starterMessage = await thread.fetchStarterMessage();
        
        // Check if this is the starter message
        if (starterMessage && starterMessage.id === message.id) {
          await thread.delete();
          deletedThread = true;
        } else {
          // Just delete the message if it's not the starter
          await message.delete();
        }
      } catch (deleteError) {
        console.error('Failed to delete thread/message:', deleteError.message);
        return;
      }
    } else {
      // Delete the message normally
      try {
        await message.delete();
      } catch (deleteError) {
        console.error('Failed to delete message:', deleteError.message);
        return;
      }
    }

    // Mute the user by adding mute role
    const muteDuration = (config.muteDuration || config.timeoutDuration || 1) * 60 * 60 * 1000; // Convert hours to milliseconds
    const muteUntil = new Date(Date.now() + muteDuration);

    try {
      await message.member.roles.add(config.muteRoleId, `Auto-mod: Menggunakan keyword terlarang (${foundKeywords.join(', ')})`);
      
      // Schedule auto-unmute
      setTimeout(async () => {
        try {
          // Re-fetch member to ensure we have latest data
          const member = await message.guild.members.fetch(message.author.id);
          if (member.roles.cache.has(config.muteRoleId)) {
            await member.roles.remove(config.muteRoleId, 'Auto-mod: Mute duration expired');
            console.log(`Auto-unmuted ${message.author.tag} after ${config.muteDuration || config.timeoutDuration || 1} hours`);
          }
        } catch (unmuteError) {
          console.error('Failed to auto-unmute user:', unmuteError.message);
        }
      }, muteDuration);
      
    } catch (muteError) {
      console.error('Failed to mute user:', muteError.message);
    }

    // Send log to log channel
    if (config.logChannel) {
      try {
        const logChannel = await message.guild.channels.fetch(config.logChannel);
        const muteDurationHours = config.muteDuration || config.timeoutDuration || 1;
        
        const logEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('🛡️ Auto-Mod Action')
          .setDescription(
            deletedThread 
              ? 'Forum post yang mengandung keyword terlarang telah dihapus.' 
              : 'Pesan yang mengandung keyword terlarang telah dihapus.'
          )
          .addFields(
            { name: 'User', value: `${message.author} (${message.author.tag})`, inline: true },
            { 
              name: deletedThread ? 'Forum' : 'Channel', 
              value: deletedThread 
                ? `${channelInfo.parent} (Thread dihapus)` 
                : channelInfo.mention, 
              inline: true 
            },
            { name: 'Mute Durasi', value: `${muteDurationHours} jam`, inline: true },
            { name: 'Keyword Terdeteksi', value: `\`${foundKeywords.join('`, `')}\``, inline: false },
            { name: deletedThread ? 'Judul Thread' : 'Pesan Asli', value: deletedThread ? channelInfo.name : (messageContentBackup.length > 1024 ? messageContentBackup.substring(0, 1021) + '...' : messageContentBackup), inline: false },
            { name: 'Mute Hingga', value: `<t:${Math.floor(muteUntil.getTime() / 1000)}:F>`, inline: false }
          )
          .setFooter({ text: `User ID: ${message.author.id}` })
          .setTimestamp();

        await logChannel.send({ embeds: [logEmbed] });
      } catch (logError) {
        console.error('Failed to send log:', logError.message);
      }
    }

    // Try to DM the user
    try {
      const muteDurationHours = config.muteDuration || config.timeoutDuration || 1;
      const dmEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('⚠️ Auto-Moderation Warning')
        .setDescription(
          `${deletedThread ? 'Forum post' : 'Pesan'} Anda di **${message.guild.name}** telah dihapus karena mengandung keyword yang dilarang.\n\n` +
          `**${deletedThread ? 'Forum' : 'Channel'}:** ${deletedThread ? channelInfo.parent : channelInfo.mention}\n` +
          (deletedThread ? `**Judul Thread:** ${channelInfo.name}\n` : '') +
          `**Keyword Terdeteksi:** \`${foundKeywords.join('`, `')}\`\n` +
          `**Mute Durasi:** ${muteDurationHours} jam\n` +
          `**Mute Hingga:** <t:${Math.floor(muteUntil.getTime() / 1000)}:F>\n\n` +
          `Anda hanya di-mute dari channel yang dimonitor. Harap patuhi peraturan server di masa mendatang.`
        )
        .setTimestamp();

      await message.author.send({ embeds: [dmEmbed] });
    } catch (dmError) {
      console.log('Could not DM user about auto-mod action');
    }

  } catch (error) {
    console.error('Error in auto-mod handler:', error);
  }
}

module.exports = { handleAutoMod };
