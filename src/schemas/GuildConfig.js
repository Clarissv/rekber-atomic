const { getDatabase } = require('../utilities/database');

class GuildConfig {
  static collection = null;

  static getCollection() {
    if (!this.collection) {
      const db = getDatabase();
      this.collection = db.collection('guildConfigs');
    }
    return this.collection;
  }

  static async getConfig(guildId) {
    const collection = this.getCollection();
    let config = await collection.findOne({ guildId });
    
    if (!config) {
      config = {
        guildId,
        feeLimits: [],
        qrisImageUrl: null,
        auditLogChannel: null,
        ticketLogChannel: null,
        ticketSystemOpen: true,
        completedLogChannel: null
      };
      await collection.insertOne(config);
    }
    
    return config;
  }

  static async setFeeLimits(guildId, feeLimits) {
    const collection = this.getCollection();
    await collection.updateOne(
      { guildId },
      { $set: { feeLimits } },
      { upsert: true }
    );
  }

  static async setQrisImageUrl(guildId, url) {
    const collection = this.getCollection();
    await collection.updateOne(
      { guildId },
      { $set: { qrisImageUrl: url } },
      { upsert: true }
    );
  }

  static async setAuditLogChannel(guildId, channelId) {
    const collection = this.getCollection();
    await collection.updateOne(
      { guildId },
      { $set: { auditLogChannel: channelId } },
      { upsert: true }
    );
  }

  static async setTicketLogChannel(guildId, channelId) {
    const collection = this.getCollection();
    await collection.updateOne(
      { guildId },
      { $set: { ticketLogChannel: channelId } },
      { upsert: true }
    );
  }

  static async setTicketSystemStatus(guildId, isOpen) {
    const collection = this.getCollection();
    await collection.updateOne(
      { guildId },
      { $set: { ticketSystemOpen: isOpen } },
      { upsert: true }
    );
  }

  static async setCompletedLogChannel(guildId, channelId) {
    const collection = this.getCollection();
    await collection.updateOne(
      { guildId },
      { $set: { completedLogChannel: channelId } },
      { upsert: true }
    );
  }
}

module.exports = GuildConfig;
