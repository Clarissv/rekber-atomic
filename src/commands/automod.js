const { SlashCommandBuilder, EmbedBuilder, ChannelType, MessageFlags, PermissionFlagsBits } = require('discord.js');
const AutoMod = require('../schemas/AutoMod');
const { isAuthorized } = require('../utilities/helpers');
require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('automod')
    .setDescription('Konfigurasi sistem auto-moderation')
    .addSubcommand(subcommand =>
      subcommand
        .setName('toggle')
        .setDescription('Aktifkan atau nonaktifkan auto-mod')
        .addBooleanOption(option =>
          option.setName('enabled')
            .setDescription('Aktifkan (true) atau nonaktifkan (false)')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('add-channel')
        .setDescription('Tambahkan channel untuk dimonitor')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('Channel yang akan dimonitor')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove-channel')
        .setDescription('Hapus channel dari monitoring')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('Channel yang akan dihapus')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('add-forum')
        .setDescription('Tambahkan forum untuk dimonitor')
        .addChannelOption(option =>
          option.setName('forum')
            .setDescription('Forum channel yang akan dimonitor')
            .addChannelTypes(ChannelType.GuildForum)
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove-forum')
        .setDescription('Hapus forum dari monitoring')
        .addChannelOption(option =>
          option.setName('forum')
            .setDescription('Forum yang akan dihapus')
            .addChannelTypes(ChannelType.GuildForum)
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('add-keyword')
        .setDescription('Tambahkan keyword yang dilarang')
        .addStringOption(option =>
          option.setName('keyword')
            .setDescription('Keyword yang akan dilarang (case-insensitive)')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove-keyword')
        .setDescription('Hapus keyword dari daftar larangan')
        .addStringOption(option =>
          option.setName('keyword')
            .setDescription('Keyword yang akan dihapus')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('create-mute-role')
        .setDescription('Buat mute role baru untuk auto-mod (auto-set permission di monitored channels)')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('set-mute-role')
        .setDescription('Set mute role yang sudah ada untuk auto-mod')
        .addRoleOption(option =>
          option.setName('role')
            .setDescription('Role yang akan digunakan sebagai mute role')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('set-mute-duration')
        .setDescription('Atur durasi mute dalam jam')
        .addIntegerOption(option =>
          option.setName('hours')
            .setDescription('Durasi mute (1-672 jam / 28 hari max)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(672)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('unmute')
        .setDescription('Unmute user secara manual')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('User yang akan di-unmute')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('set-log-channel')
        .setDescription('Atur channel untuk log auto-mod')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('Channel untuk log')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('Lihat konfigurasi auto-mod saat ini')
    ),

  async execute(interaction) {
    // Check if user is Access_ID
    if (!isAuthorized(interaction.user.id)) {
      return await interaction.reply({ 
        content: '❌ Hanya staff yang berwenang yang dapat menggunakan command ini.', 
        flags: MessageFlags.Ephemeral 
      });
    }

    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    try {
      switch (subcommand) {
        case 'toggle': {
          const enabled = interaction.options.getBoolean('enabled');
          await AutoMod.setEnabled(guildId, enabled);
          
          const embed = new EmbedBuilder()
            .setColor(enabled ? '#00FF00' : '#FF0000')
            .setTitle(`🛡️ Auto-Mod ${enabled ? 'Diaktifkan' : 'Dinonaktifkan'}`)
            .setDescription(
              enabled 
                ? '✅ Sistem auto-moderation sekarang aktif!' 
                : '❌ Sistem auto-moderation dinonaktifkan.'
            )
            .setTimestamp();

          return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }

        case 'add-channel': {
          const channel = interaction.options.getChannel('channel');
          await AutoMod.addChannel(guildId, channel.id);
          
          return await interaction.reply({ 
            content: `✅ Channel ${channel} berhasil ditambahkan ke monitoring auto-mod.`, 
            flags: MessageFlags.Ephemeral 
          });
        }

        case 'remove-channel': {
          const channel = interaction.options.getChannel('channel');
          await AutoMod.removeChannel(guildId, channel.id);
          
          return await interaction.reply({ 
            content: `✅ Channel ${channel} berhasil dihapus dari monitoring auto-mod.`, 
            flags: MessageFlags.Ephemeral 
          });
        }

        case 'add-forum': {
          const forum = interaction.options.getChannel('forum');
          await AutoMod.addForum(guildId, forum.id);
          
          return await interaction.reply({ 
            content: `✅ Forum ${forum} berhasil ditambahkan ke monitoring auto-mod.`, 
            flags: MessageFlags.Ephemeral 
          });
        }

        case 'remove-forum': {
          const forum = interaction.options.getChannel('forum');
          await AutoMod.removeForum(guildId, forum.id);
          
          return await interaction.reply({ 
            content: `✅ Forum ${forum} berhasil dihapus dari monitoring auto-mod.`, 
            flags: MessageFlags.Ephemeral 
          });
        }

        case 'add-keyword': {
          const keyword = interaction.options.getString('keyword');
          await AutoMod.addKeyword(guildId, keyword);
          
          return await interaction.reply({ 
            content: `✅ Keyword \`${keyword}\` berhasil ditambahkan ke daftar larangan.`, 
            flags: MessageFlags.Ephemeral 
          });
        }

        case 'remove-keyword': {
          const keyword = interaction.options.getString('keyword');
          await AutoMod.removeKeyword(guildId, keyword);
          
          return await interaction.reply({ 
            content: `✅ Keyword \`${keyword}\` berhasil dihapus dari daftar larangan.`, 
            flags: MessageFlags.Ephemeral 
          });
        }

        case 'create-mute-role': {
          await interaction.deferReply({ flags: MessageFlags.Ephemeral });
          
          // Create the mute role
          const muteRole = await interaction.guild.roles.create({
            name: 'AutoMod Muted',
            color: '#808080',
            reason: 'Auto-mod mute role created by automod system',
            permissions: []
          });

          // Save to database
          await AutoMod.setMuteRole(guildId, muteRole.id);

          // Get current config to set permissions on monitored channels
          const config = await AutoMod.getConfig(guildId);
          const updatedChannels = [];
          const updatedForums = [];

          // Set permissions on monitored channels
          for (const channelId of config.monitoredChannels || []) {
            try {
              const channel = await interaction.guild.channels.fetch(channelId);
              await channel.permissionOverwrites.create(muteRole, {
                SendMessages: false,
                AddReactions: false,
                CreatePublicThreads: false,
                CreatePrivateThreads: false,
                SendMessagesInThreads: false
              });
              updatedChannels.push(channelId);
            } catch (e) {
              console.error(`Failed to set permission for channel ${channelId}:`, e.message);
            }
          }

          // Set permissions on monitored forums
          for (const forumId of config.monitoredForums || []) {
            try {
              const forum = await interaction.guild.channels.fetch(forumId);
              await forum.permissionOverwrites.create(muteRole, {
                SendMessages: false,
                SendMessagesInThreads: false,
                CreatePublicThreads: false,
                AddReactions: false
              });
              updatedForums.push(forumId);
            } catch (e) {
              console.error(`Failed to set permission for forum ${forumId}:`, e.message);
            }
          }

          const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ Mute Role Dibuat')
            .setDescription(`Role ${muteRole} berhasil dibuat dan dikonfigurasi!`)
            .addFields(
              { name: 'Channel Diupdate', value: updatedChannels.length > 0 ? updatedChannels.map(id => `<#${id}>`).join(', ') : 'Tidak ada', inline: false },
              { name: 'Forum Diupdate', value: updatedForums.length > 0 ? updatedForums.map(id => `<#${id}>`).join(', ') : 'Tidak ada', inline: false }
            )
            .setFooter({ text: 'User dengan role ini tidak bisa chat di monitored channels' })
            .setTimestamp();

          return await interaction.editReply({ embeds: [embed] });
        }

        case 'set-mute-role': {
          const role = interaction.options.getRole('role');
          await AutoMod.setMuteRole(guildId, role.id);
          
          return await interaction.reply({ 
            content: `✅ Mute role diatur ke ${role}. **Pastikan role ini memiliki permission "Send Messages: Deny" di channel yang dimonitor!**`, 
            flags: MessageFlags.Ephemeral 
          });
        }

        case 'set-mute-duration': {
          const hours = interaction.options.getInteger('hours');
          await AutoMod.setMuteDuration(guildId, hours);
          
          return await interaction.reply({ 
            content: `✅ Durasi mute diatur ke **${hours} jam**.`, 
            flags: MessageFlags.Ephemeral 
          });
        }

        case 'unmute': {
          const user = interaction.options.getUser('user');
          const config = await AutoMod.getConfig(guildId);
          
          if (!config.muteRoleId) {
            return await interaction.reply({ 
              content: '❌ Mute role belum dikonfigurasi. Gunakan `/automod create-mute-role` terlebih dahulu.', 
              flags: MessageFlags.Ephemeral 
            });
          }

          try {
            const member = await interaction.guild.members.fetch(user.id);
            
            if (!member.roles.cache.has(config.muteRoleId)) {
              return await interaction.reply({ 
                content: `❌ ${user} tidak sedang di-mute.`, 
                flags: MessageFlags.Ephemeral 
              });
            }

            await member.roles.remove(config.muteRoleId, 'Manual unmute by staff');
            
            return await interaction.reply({ 
              content: `✅ ${user} berhasil di-unmute.`, 
              flags: MessageFlags.Ephemeral 
            });
          } catch (e) {
            return await interaction.reply({ 
              content: `❌ Gagal unmute user: ${e.message}`, 
              flags: MessageFlags.Ephemeral 
            });
          }
        }

        case 'set-log-channel': {
          const channel = interaction.options.getChannel('channel');
          await AutoMod.setLogChannel(guildId, channel.id);
          
          return await interaction.reply({ 
            content: `✅ Log channel auto-mod diatur ke ${channel}.`, 
            flags: MessageFlags.Ephemeral 
          });
        }

        case 'view': {
          const config = await AutoMod.getConfig(guildId);
          
          const embed = new EmbedBuilder()
            .setColor('#0099FF')
            .setTitle('🛡️ Konfigurasi Auto-Moderation')
            .addFields(
              { 
                name: 'Status', 
                value: config.enabled ? '✅ Aktif' : '❌ Nonaktif', 
                inline: true 
              },
              { 
                name: 'Mute Role', 
                value: config.muteRoleId ? `<@&${config.muteRoleId}>` : '❌ Belum diatur', 
                inline: true 
              },
              { 
                name: 'Durasi Mute', 
                value: `${config.muteDuration || config.timeoutDuration || 1} jam`, 
                inline: true 
              },
              { 
                name: 'Log Channel', 
                value: config.logChannel ? `<#${config.logChannel}>` : 'Belum diatur', 
                inline: true 
              },
              { 
                name: `Channel yang Dimonitor (${config.monitoredChannels.length})`, 
                value: config.monitoredChannels.length > 0 
                  ? config.monitoredChannels.map(id => `<#${id}>`).join(', ')
                  : 'Belum ada channel',
                inline: false
              },
              { 
                name: `Forum yang Dimonitor (${config.monitoredForums?.length || 0})`, 
                value: config.monitoredForums && config.monitoredForums.length > 0 
                  ? config.monitoredForums.map(id => `<#${id}>`).join(', ')
                  : 'Belum ada forum',
                inline: false
              },
              { 
                name: `Keyword yang Dilarang (${config.keywords.length})`, 
                value: config.keywords.length > 0 
                  ? '`' + config.keywords.join('`, `') + '`'
                  : 'Belum ada keyword',
                inline: false
              }
            )
            .setFooter({ text: 'Gunakan /automod untuk mengubah konfigurasi' })
            .setTimestamp();

          return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
      }
    } catch (error) {
      console.error('Error in automod command:', error);
      return await interaction.reply({ 
        content: '❌ Terjadi kesalahan saat memproses command.', 
        flags: MessageFlags.Ephemeral 
      });
    }
  }
};
