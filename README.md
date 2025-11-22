# Rekber Atomic - Discord Middleman Ticket Bot

A professional Discord bot for managing middleman services using private threads instead of channels.

## Features

### 🎫 Ticket System
- Create private threads for each transaction
- Dropdown-based fee range selection
- Member selection for trading partners
- Automatic QRIS payment embed
- Thread-based ticket management

### ⚙️ Configuration Commands
- **`/configure add-fee`** - Add a new fee limit range
- **`/configure remove-fee`** - Remove a fee limit by index
- **`/configure list-fees`** - View all configured fee limits
- **`/configure qris`** - Set QRIS payment image URL
- **`/configure audit-channel`** - Set audit log channel
- **`/configure ticket-log-channel`** - Set ticket log channel
- **`/configure view`** - View current configuration

### 🎯 Ticket Management
- **`/send`** - Send the ticket panel with dropdown
- **`/add`** - Add a member to the current ticket thread
- **`/remove`** - Remove a member from the current ticket thread
- **Close Button** - Close tickets (Access_ID only)

## Setup Instructions

### 1. Prerequisites
- Node.js v16.9.0 or higher
- MongoDB database (MongoDB Atlas recommended)
- Discord bot token

### 2. Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```env
BOT_TOKEN=your_bot_token_here
BOT_ID=your_bot_id_here
MONGO_DB=your_mongodb_connection_string
# Support multiple authorized staff IDs separated by comma
Access_ID=123456789,987654321,555555555
```

**Note for Railway Deployment:**
- When setting environment variables in Railway, use comma-separated IDs without spaces
- Example: `1207696111851143208,1234567890123456789`
- All listed IDs will have full staff permissions

### 3. MongoDB Setup

Your MongoDB connection string should be in this format:
```
mongodb+srv://username:password@cluster.mongodb.net/?appName=YourApp
```

The bot will automatically create a database named `MiddlemanBot` with two collections:
- `guildConfigs` - Server configurations
- `tickets` - Ticket data

### 4. Running the Bot

Start the bot:
```bash
npm start
```

You should see:
```
✅ Loaded command: configure
✅ Loaded command: send
✅ Loaded command: add
✅ Loaded command: remove
🤖 Bot is ready! Logged in as YourBot#1234
✅ Successfully connected to MongoDB!
📝 Registering slash commands...
✅ Slash commands registered successfully!
```

## Usage Guide

### Initial Configuration

1. **Set up fee limits:**
```
/configure add-fee min:10001 max:150000 fee:2000
/configure add-fee min:150001 max:300000 fee:5000
/configure add-fee min:300001 max:500000 fee:10000
/configure add-fee min:500001 max:999999 fee:15000
/configure add-fee min:1000000 max:0 fee:0 percentage:5
```

2. **Set QRIS image:**
```
/configure qris url:https://your-image-url.com/qris.png
```

3. **Set audit log channel:**
```
/configure audit-channel channel:#audit-logs
```

4. **Set ticket log channel:**
```
/configure ticket-log-channel channel:#ticket-logs
```

### Creating Tickets

1. **Send ticket panel:**
```
/send
```

2. **Users create tickets by:**
   - Selecting their transaction amount range from the dropdown
   - Selecting the person they're trading with
   - Bot automatically creates a private thread with both parties + staff

### Managing Tickets

**Add someone to a ticket:**
```
/add user:@username
```

**Remove someone from a ticket:**
```
/remove user:@username
```

**Close a ticket (Access_ID only):**
- Click the "Close Ticket" button in the pinned message
- Thread will be archived and logged automatically

## Fee Structure Example

The bot supports flexible fee structures:

| Transaction Range | Fee |
|------------------|-----|
| Rp 10.001 - Rp 150.000 | Rp 2.000 |
| Rp 150.001 - Rp 300.000 | Rp 5.000 |
| Rp 300.001 - Rp 500.000 | Rp 10.000 |
| Rp 500.001 - Rp 999.999 | Rp 15.000 |
| ≥ Rp 1.000.000 | 5% flat |

## Project Structure

```
Rekber Atomic/
├── src/
│   ├── commands/          # Slash commands
│   │   ├── configure.js   # Configuration command
│   │   ├── send.js        # Send ticket panel
│   │   ├── add.js         # Add member to ticket
│   │   └── remove.js      # Remove member from ticket
│   ├── functions/         # Utility functions
│   │   └── ticketHandler.js  # Ticket interaction handlers
│   ├── schemas/           # Database models
│   │   ├── GuildConfig.js # Guild configuration schema
│   │   └── Ticket.js      # Ticket schema
│   └── utilities/         # Utilities
│       └── database.js    # MongoDB connection
├── .env                   # Environment variables
├── index.js              # Main bot file
└── package.json          # Dependencies
```

## Features in Detail

### Private Threads
- Tickets are created as private threads, keeping conversations organized
- Only involved parties can see the thread
- Threads are automatically archived after closing

### Auto-updating Dropdowns
- Fee options automatically update when you add/remove fee limits
- No need to resend the ticket panel

### Audit Logging
- All ticket actions are logged to the audit channel
- Track ticket creation, closure, and duration

### Ticket Logs
- Closed tickets are logged with a "View Thread" button
- Easy access to archived tickets for reference

## Permissions Required

The bot needs these permissions:
- Read Messages/View Channels
- Send Messages
- Create Private Threads
- Manage Threads
- Embed Links
- Add Reactions
- Use Slash Commands

## Troubleshooting

**Commands not showing up:**
- Wait a few minutes for Discord to sync commands
- Check bot has "applications.commands" scope

**Cannot create threads:**
- Ensure the bot has "Create Private Threads" permission
- Check channel settings allow thread creation

**Database connection failed:**
- Verify MongoDB connection string is correct
- Check network connectivity
- Ensure MongoDB Atlas allows connections from your IP

## Support

For issues or questions, please check:
1. MongoDB connection is active
2. Bot has proper permissions
3. Environment variables are set correctly
4. All dependencies are installed

## License

ISC
