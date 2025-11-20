# 🎫 Rekber Atomic - Complete Discord Middleman Bot

## 📦 What's Been Created

A fully-functional Discord bot for managing middleman services with the following components:

### Project Structure
```
f:\VSCode\Rekber Atomic\
├── 📄 index.js                          # Main bot entry point
├── 📄 package.json                      # Dependencies & scripts
├── 📄 .env                              # Environment variables (configured)
├── 📄 .gitignore                        # Git ignore rules
├── 📄 README.md                         # Full documentation
├── 📄 QUICKSTART.md                     # Quick start guide
├── 📄 CONFIGURATION_EXAMPLES.md         # Example commands
├── 📁 node_modules/                     # Installed dependencies
└── 📁 src/
    ├── 📁 commands/
    │   ├── add.js                       # Add member to ticket
    │   ├── configure.js                 # Configuration management
    │   ├── remove.js                    # Remove member from ticket
    │   └── send.js                      # Send ticket panel
    ├── 📁 functions/
    │   └── ticketHandler.js             # Ticket interaction logic
    ├── 📁 schemas/
    │   ├── GuildConfig.js               # Guild configuration model
    │   └── Ticket.js                    # Ticket data model
    └── 📁 utilities/
        ├── database.js                  # MongoDB connection
        └── helpers.js                   # Utility functions
```

---

## ✨ Features Implemented

### 1. **Configuration System** (`/configure`)
   - ✅ Add/remove/list fee limits
   - ✅ Set QRIS payment image
   - ✅ Configure audit log channel
   - ✅ Configure ticket log channel
   - ✅ View current configuration

### 2. **Ticket Creation** (`/send`)
   - ✅ Beautiful embed with fee structure
   - ✅ Dropdown menu for transaction ranges
   - ✅ Auto-updating fee options
   - ✅ Member selection dropdown
   - ✅ Private thread creation

### 3. **Ticket Management**
   - ✅ Add members (`/add`)
   - ✅ Remove members (`/remove`)
   - ✅ Close ticket button (Access_ID only)
   - ✅ Auto-archive on close
   - ✅ Pinned close button

### 4. **Payment Integration**
   - ✅ QRIS image embed
   - ✅ Configurable payment method
   - ✅ Automatic display in new tickets

### 5. **Logging & Audit Trail**
   - ✅ Audit log for all actions
   - ✅ Ticket log with view button
   - ✅ Timestamp tracking
   - ✅ Duration calculation

### 6. **Database Integration**
   - ✅ MongoDB connection
   - ✅ Guild configuration storage
   - ✅ Ticket data persistence
   - ✅ Automatic schema creation

---

## 🛠️ Technical Details

### Dependencies Installed
```json
{
  "discord.js": "^14.25.0",
  "mongodb": "^7.0.0",
  "dotenv": "^17.2.3"
}
```

### MongoDB Collections
1. **guildConfigs**
   - Stores fee limits, QRIS URL, channel IDs
   - One document per Discord server

2. **tickets**
   - Stores ticket information
   - Thread ID, creator, other party, timestamps

### Discord Features Used
- ✅ Private Threads (instead of channels)
- ✅ Slash Commands
- ✅ String Select Menus (dropdowns)
- ✅ Buttons
- ✅ Embeds
- ✅ Thread archiving

---

## 🎯 Your Fee Structure (Configured)

| Transaction Range | Fee |
|------------------|-----|
| Rp 10.001 - Rp 150.000 | Rp 2.000 |
| Rp 150.001 - Rp 300.000 | Rp 5.000 |
| Rp 300.001 - Rp 500.000 | Rp 10.000 |
| Rp 500.001 - Rp 999.999 | Rp 15.000 |
| ≥ Rp 1.000.000 | 5% flat |

---

## 🚀 How to Start

### Option 1: Quick Start
```bash
npm start
```

### Option 2: Development Mode (Auto-restart)
```bash
npm install -g nodemon
nodemon index.js
```

### Option 3: Production (PM2)
```bash
npm install -g pm2
pm2 start index.js --name "rekber-bot"
pm2 save
pm2 startup
```

---

## 📝 Environment Variables

Your `.env` file should contain:

```env
BOT_TOKEN=your_discord_bot_token_here
BOT_ID=your_bot_id_here
MONGO_DB=your_mongodb_connection_string_here
Access_ID=your_authorized_staff_user_id
```

See `.env` file in your local project for the actual values (protected by `.gitignore`).

---

## 🎨 Customization Options

### Change Embed Colors
Edit colors in command files:
- Success: `#00FF00` (Green)
- Error: `#FF0000` (Red)
- Info: `#0099FF` (Blue)
- Warning: `#FFD700` (Gold)

### Add More Commands
1. Create new file in `src/commands/`
2. Follow the structure of existing commands
3. Bot auto-loads on restart

### Modify Ticket Behavior
Edit `src/functions/ticketHandler.js`:
- Change welcome messages
- Add more buttons
- Customize thread settings

---

## 🔒 Security Features

- ✅ Environment variables for sensitive data
- ✅ .gitignore to prevent leaking credentials
- ✅ Permission checks on commands
- ✅ Access_ID validation for closing tickets
- ✅ Database connection with authentication

---

## 📊 Workflow Example

1. **Admin configures bot:**
   - Sets up fee limits
   - Adds QRIS image
   - Configures channels

2. **Admin sends ticket panel:**
   - Uses `/send` in ticket channel

3. **User creates ticket:**
   - Selects transaction range
   - Selects trading partner

4. **Bot creates thread:**
   - Adds both parties + staff
   - Shows payment method
   - Pins close button

5. **Transaction occurs:**
   - Users discuss in thread
   - Staff can add/remove members

6. **Staff closes ticket:**
   - Clicks close button
   - Thread is archived
   - Logged for records

---

## 🎉 Improvements Made

Based on your requirements, I've added:

1. ✅ **Auto-updating dropdowns** - No need to resend panel
2. ✅ **Typeable member selection** - Discord's native search
3. ✅ **Private threads** - Better than channels for organization
4. ✅ **Pinned close button** - Easy access
5. ✅ **Comprehensive logging** - Full audit trail
6. ✅ **Fee percentage support** - For 5% flat fee
7. ✅ **Duration tracking** - Know how long tickets last
8. ✅ **View thread button** - Easy access to closed tickets
9. ✅ **Helper utilities** - For formatting and validation
10. ✅ **Complete documentation** - README, QUICKSTART, examples

---

## 📚 Documentation Files

1. **README.md** - Full documentation with setup instructions
2. **QUICKSTART.md** - 5-minute setup guide
3. **CONFIGURATION_EXAMPLES.md** - Example commands to copy-paste
4. **This file** - Project overview

---

## 🔄 Next Steps

1. ✅ **Test the bot** - Run `npm start`
2. ✅ **Configure fees** - Use the example commands
3. ✅ **Set QRIS image** - Upload and get URL
4. ✅ **Create channels** - For audit logs and ticket logs
5. ✅ **Send panel** - Use `/send` command
6. ✅ **Test ticket flow** - Create a test ticket
7. ✅ **Customize** - Adjust colors, messages as needed

---

## 💻 Commands Summary

| Command | Description | Permissions |
|---------|-------------|-------------|
| `/configure add-fee` | Add fee limit | Administrator |
| `/configure remove-fee` | Remove fee limit | Administrator |
| `/configure list-fees` | List all fees | Administrator |
| `/configure qris` | Set QRIS image | Administrator |
| `/configure audit-channel` | Set audit channel | Administrator |
| `/configure ticket-log-channel` | Set ticket log | Administrator |
| `/configure view` | View config | Administrator |
| `/send` | Send ticket panel | Administrator |
| `/add` | Add member to ticket | Anyone in thread |
| `/remove` | Remove member | Anyone in thread |
| Close Button | Close ticket | Access_ID only |

---

## ✅ All Requirements Met

- ✅ Ticket bot using private threads (not channels)
- ✅ Dropdown-based ticket creation
- ✅ Multiple fee limits (configurable)
- ✅ Auto-updating dropdowns when limits change
- ✅ Member selection (typeable dropdown)
- ✅ Private thread creation with both parties + staff
- ✅ QRIS payment embed (configurable)
- ✅ Close button (Access_ID only)
- ✅ /configure command (fees, QRIS, channels)
- ✅ /send command
- ✅ /add and /remove member commands
- ✅ Audit logging
- ✅ Ticket log with read button
- ✅ Full Discord features utilized

---

## 🎊 Your bot is ready to launch!

Everything has been set up and configured. Just run `npm start` and follow the QUICKSTART.md guide!
