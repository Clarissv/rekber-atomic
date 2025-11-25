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

    // Timeout the user
    const timeoutDuration = config.timeoutDuration * 60 * 60 * 1000; // Convert hours to milliseconds
    const timeoutUntil = new Date(Date.now() + timeoutDuration);

    try {
      await message.member.timeout(timeoutDuration, `Auto-mod: Menggunakan keyword terlarang (${foundKeywords.join(', ')})`);
    } catch (timeoutError) {
      console.error('Failed to timeout user:', timeoutError.message);
    }

    // Send log to log channel
    if (config.logChannel) {
      try {
        const logChannel = await message.guild.channels.fetch(config.logChannel);
        
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
                ? `${message.channel.parent} (Thread dihapus)` 
                : `${message.channel}`, 
              inline: true 
            },
            { name: 'Timeout Durasi', value: `${config.timeoutDuration} jam`, inline: true },
            { name: 'Keyword Terdeteksi', value: `\`${foundKeywords.join('`, `')}\``, inline: false },
            { name: deletedThread ? 'Judul Thread' : 'Pesan Asli', value: deletedThread ? message.channel.name : (message.content.length > 1024 ? message.content.substring(0, 1021) + '...' : message.content), inline: false },
            { name: 'Timeout Hingga', value: `<t:${Math.floor(timeoutUntil.getTime() / 1000)}:F>`, inline: false }
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
      const dmEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('⚠️ Auto-Moderation Warning')
        .setDescription(
          `${deletedThread ? 'Forum post' : 'Pesan'} Anda di **${message.guild.name}** telah dihapus karena mengandung keyword yang dilarang.\n\n` +
          `**${deletedThread ? 'Forum' : 'Channel'}:** ${deletedThread ? message.channel.parent : message.channel}\n` +
          (deletedThread ? `**Judul Thread:** ${message.channel.name}\n` : '') +
          `**Keyword Terdeteksi:** \`${foundKeywords.join('`, `')}\`\n` +
          `**Timeout Durasi:** ${config.timeoutDuration} jam\n` +
          `**Timeout Hingga:** <t:${Math.floor(timeoutUntil.getTime() / 1000)}:F>\n\n` +
          `Harap patuhi peraturan server di masa mendatang.`
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
