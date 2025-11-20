const { getDatabase } = require('../utilities/database');

class Ticket {
  static collection = null;

  static getCollection() {
    if (!this.collection) {
      const db = getDatabase();
      this.collection = db.collection('tickets');
    }
    return this.collection;
  }

  static async createTicket(ticketData) {
    const collection = this.getCollection();
    const ticket = {
      ...ticketData,
      createdAt: new Date(),
      status: 'open'
    };
    const result = await collection.insertOne(ticket);
    return { ...ticket, _id: result.insertedId };
  }

  static async getTicket(threadId) {
    const collection = this.getCollection();
    return await collection.findOne({ threadId });
  }

  static async closeTicket(threadId, closedBy) {
    const collection = this.getCollection();
    await collection.updateOne(
      { threadId },
      { 
        $set: { 
          status: 'closed',
          closedAt: new Date(),
          closedBy
        } 
      }
    );
  }

  static async addMember(threadId, userId) {
    const collection = this.getCollection();
    await collection.updateOne(
      { threadId },
      { $addToSet: { members: userId } }
    );
  }

  static async removeMember(threadId, userId) {
    const collection = this.getCollection();
    await collection.updateOne(
      { threadId },
      { $pull: { members: userId } }
    );
  }
}

module.exports = Ticket;
