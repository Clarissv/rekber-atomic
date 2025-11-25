const { SlashCommandBuilder, EmbedBuilder, ChannelType, MessageFlags } = require('discord.js');
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
        .setName('set-timeout')
        .setDescription('Atur durasi timeout dalam jam')
        .addIntegerOption(option =>
          option.setName('hours')
            .setDescription('Durasi timeout (1-672 jam / 28 hari max)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(672)
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

        case 'set-timeout': {
          const hours = interaction.options.getInteger('hours');
          await AutoMod.setTimeoutDuration(guildId, hours);
          
          return await interaction.reply({ 
            content: `✅ Durasi timeout diatur ke **${hours} jam**.`, 
            flags: MessageFlags.Ephemeral 
          });
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
                name: 'Durasi Timeout', 
                value: `${config.timeoutDuration} jam`, 
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
