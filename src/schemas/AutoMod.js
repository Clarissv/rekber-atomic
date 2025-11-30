const { getDatabase } = require('../utilities/database');

class AutoMod {
  static async getConfig(guildId) {
    const db = getDatabase();
    const autoModConfigs = db.collection('autoModConfigs');
    
    let config = await autoModConfigs.findOne({ guildId });
    
    if (!config) {
      config = {
        guildId,
        enabled: false,
        monitoredChannels: [], // Array of channel IDs
        monitoredForums: [], // Array of forum channel IDs
        keywords: [], // Array of banned keywords (case-insensitive)
        muteDuration: 1, // Duration in hours for mute
        muteRoleId: null, // Role ID for muted users
        logChannel: null // Channel to log auto-mod actions
      };
      await autoModConfigs.insertOne(config);
    }
    
    return config;
  }

  static async setEnabled(guildId, enabled) {
    const db = getDatabase();
    const autoModConfigs = db.collection('autoModConfigs');
    
    await autoModConfigs.updateOne(
      { guildId },
      { $set: { enabled } },
      { upsert: true }
    );
  }

  static async addChannel(guildId, channelId) {
    const db = getDatabase();
    const autoModConfigs = db.collection('autoModConfigs');
    
    await autoModConfigs.updateOne(
      { guildId },
      { $addToSet: { monitoredChannels: channelId } },
      { upsert: true }
    );
  }

  static async removeChannel(guildId, channelId) {
    const db = getDatabase();
    const autoModConfigs = db.collection('autoModConfigs');
    
    await autoModConfigs.updateOne(
      { guildId },
      { $pull: { monitoredChannels: channelId } }
    );
  }

  static async addKeyword(guildId, keyword) {
    const db = getDatabase();
    const autoModConfigs = db.collection('autoModConfigs');
    
    await autoModConfigs.updateOne(
      { guildId },
      { $addToSet: { keywords: keyword.toLowerCase() } },
      { upsert: true }
    );
  }

  static async removeKeyword(guildId, keyword) {
    const db = getDatabase();
    const autoModConfigs = db.collection('autoModConfigs');
    
    await autoModConfigs.updateOne(
      { guildId },
      { $pull: { keywords: keyword.toLowerCase() } }
    );
  }

  static async setMuteDuration(guildId, hours) {
    const db = getDatabase();
    const autoModConfigs = db.collection('autoModConfigs');
    
    await autoModConfigs.updateOne(
      { guildId },
      { $set: { muteDuration: hours } },
      { upsert: true }
    );
  }

  static async setMuteRole(guildId, roleId) {
    const db = getDatabase();
    const autoModConfigs = db.collection('autoModConfigs');
    
    await autoModConfigs.updateOne(
      { guildId },
      { $set: { muteRoleId: roleId } },
      { upsert: true }
    );
  }

  static async setLogChannel(guildId, channelId) {
    const db = getDatabase();
    const autoModConfigs = db.collection('autoModConfigs');
    
    await autoModConfigs.updateOne(
      { guildId },
      { $set: { logChannel: channelId } },
      { upsert: true }
    );
  }

  static async addForum(guildId, forumId) {
    const db = getDatabase();
    const autoModConfigs = db.collection('autoModConfigs');
    
    await autoModConfigs.updateOne(
      { guildId },
      { $addToSet: { monitoredForums: forumId } },
      { upsert: true }
    );
  }

  static async removeForum(guildId, forumId) {
    const db = getDatabase();
    const autoModConfigs = db.collection('autoModConfigs');
    
    await autoModConfigs.updateOne(
      { guildId },
      { $pull: { monitoredForums: forumId } }
    );
  }
}

module.exports = AutoMod;
