const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const GuildConfig = require('../schemas/GuildConfig');
require('dotenv').config();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('configure')
    .setDescription('Configure the ticket bot settings')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add-fee')
        .setDescription('Add a fee limit range')
        .addInteger('min', option => 
          option.setName('min')
            .setDescription('Minimum amount (in Rupiah)')
            .setRequired(true)
        )
        .addInteger('max', option =>
          option.setName('max')
            .setDescription('Maximum amount (in Rupiah, use 0 for unlimited)')
            .setRequired(true)
        )
        .addInteger('fee', option =>
          option.setName('fee')
            .setDescription('Fee amount (in Rupiah, use 0 for percentage)')
            .setRequired(true)
        )
        .addNumber('percentage', option =>
          option.setName('percentage')
            .setDescription('Fee percentage (if using percentage instead of fixed fee)')
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove-fee')
        .setDescription('Remove a fee limit range')
        .addInteger('index', option =>
          option.setName('index')
            .setDescription('Index of the fee limit to remove (use /configure list-fees to see)')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list-fees')
        .setDescription('List all configured fee limits')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('qris')
        .setDescription('Set the QRIS payment image URL')
        .addString('url', option =>
          option.setName('url')
            .setDescription('Direct image URL for QRIS payment method')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('audit-channel')
        .setDescription('Set the audit log channel')
        .addChannel('channel', option =>
          option.setName('channel')
            .setDescription('Channel for audit logs')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('ticket-log-channel')
        .setDescription('Set the ticket log channel')
        .addChannel('channel', option =>
          option.setName('channel')
            .setDescription('Channel for ticket logs with read buttons')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View current configuration')
    ),

  async execute(interaction) {
    // Check if user is Access_ID
    if (interaction.user.id !== process.env.Access_ID) {
      return await interaction.reply({ 
        content: '❌ Only authorized staff can use this command.', 
        ephemeral: true 
      });
    }

    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    try {
      switch (subcommand) {
        case 'add-fee': {
          const min = interaction.options.getInteger('min');
          const max = interaction.options.getInteger('max');
          const fee = interaction.options.getInteger('fee');
          const percentage = interaction.options.getNumber('percentage');

          const config = await GuildConfig.getConfig(guildId);
          const newFeeLimit = {
            min,
            max: max === 0 ? null : max,
            fee: percentage ? null : fee,
            percentage: percentage || null,
            label: this.generateFeeLabel(min, max, fee, percentage)
          };

          config.feeLimits.push(newFeeLimit);
          // Sort fee limits by minimum amount
          config.feeLimits.sort((a, b) => a.min - b.min);
          
          await GuildConfig.setFeeLimits(guildId, config.feeLimits);

          const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ Fee Limit Added')
            .setDescription(`**Range:** ${newFeeLimit.label}\n**Fee:** ${percentage ? `${percentage}%` : `Rp ${fee.toLocaleString('id-ID')}`}`)
            .setTimestamp();

          await interaction.reply({ embeds: [embed], ephemeral: true });
          break;
        }

        case 'remove-fee': {
          const index = interaction.options.getInteger('index');
          const config = await GuildConfig.getConfig(guildId);

          if (index < 1 || index > config.feeLimits.length) {
            return await interaction.reply({ 
              content: `❌ Invalid index. Please use a number between 1 and ${config.feeLimits.length}`, 
              ephemeral: true 
            });
          }

          const removed = config.feeLimits.splice(index - 1, 1)[0];
          await GuildConfig.setFeeLimits(guildId, config.feeLimits);

          const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('✅ Fee Limit Removed')
            .setDescription(`**Removed:** ${removed.label}`)
            .setTimestamp();

          await interaction.reply({ embeds: [embed], ephemeral: true });
          break;
        }

        case 'list-fees': {
          const config = await GuildConfig.getConfig(guildId);

          if (config.feeLimits.length === 0) {
            return await interaction.reply({ 
              content: '❌ No fee limits configured yet. Use `/configure add-fee` to add one.', 
              ephemeral: true 
            });
          }

          const feeList = config.feeLimits.map((limit, index) => {
            const feeText = limit.percentage 
              ? `${limit.percentage}%` 
              : `Rp ${limit.fee.toLocaleString('id-ID')}`;
            return `**${index + 1}.** ${limit.label} → ${feeText}`;
          }).join('\n');

          const embed = new EmbedBuilder()
            .setColor('#0099FF')
            .setTitle('📋 Configured Fee Limits')
            .setDescription(feeList)
            .setTimestamp();

          await interaction.reply({ embeds: [embed], ephemeral: true });
          break;
        }

        case 'qris': {
          const url = interaction.options.getString('url');
          await GuildConfig.setQrisImageUrl(guildId, url);

          const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ QRIS Image Updated')
            .setDescription(`Payment method image has been set.`)
            .setImage(url)
            .setTimestamp();

          await interaction.reply({ embeds: [embed], ephemeral: true });
          break;
        }

        case 'audit-channel': {
          const channel = interaction.options.getChannel('channel');
          await GuildConfig.setAuditLogChannel(guildId, channel.id);

          const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ Audit Log Channel Set')
            .setDescription(`Audit logs will be sent to ${channel}`)
            .setTimestamp();

          await interaction.reply({ embeds: [embed], ephemeral: true });
          break;
        }

        case 'ticket-log-channel': {
          const channel = interaction.options.getChannel('channel');
          await GuildConfig.setTicketLogChannel(guildId, channel.id);

          const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ Ticket Log Channel Set')
            .setDescription(`Ticket logs will be sent to ${channel}`)
            .setTimestamp();

          await interaction.reply({ embeds: [embed], ephemeral: true });
          break;
        }

        case 'view': {
          const config = await GuildConfig.getConfig(guildId);

          const embed = new EmbedBuilder()
            .setColor('#0099FF')
            .setTitle('⚙️ Current Configuration')
            .addFields(
              { 
                name: '📊 Fee Limits', 
                value: config.feeLimits.length > 0 
                  ? config.feeLimits.map((l, i) => `${i + 1}. ${l.label}`).join('\n')
                  : 'None configured',
                inline: false
              },
              { 
                name: '💳 QRIS Image', 
                value: config.qrisImageUrl ? '✅ Set' : '❌ Not set',
                inline: true
              },
              { 
                name: '📝 Audit Log Channel', 
                value: config.auditLogChannel ? `<#${config.auditLogChannel}>` : '❌ Not set',
                inline: true
              },
              { 
                name: '🎫 Ticket Log Channel', 
                value: config.ticketLogChannel ? `<#${config.ticketLogChannel}>` : '❌ Not set',
                inline: true
              }
            )
            .setTimestamp();

          if (config.qrisImageUrl) {
            embed.setThumbnail(config.qrisImageUrl);
          }

          await interaction.reply({ embeds: [embed], ephemeral: true });
          break;
        }
      }
    } catch (error) {
      console.error('Error in configure command:', error);
      await interaction.reply({ 
        content: '❌ An error occurred while processing your request.', 
        ephemeral: true 
      });
    }
  },

  generateFeeLabel(min, max, fee, percentage) {
    const formatRupiah = (num) => `Rp ${num.toLocaleString('id-ID')}`;
    
    if (max === null || max === 0) {
      return `≥ ${formatRupiah(min)}`;
    }
    
    return `${formatRupiah(min)} - ${formatRupiah(max)}`;
  }
};
