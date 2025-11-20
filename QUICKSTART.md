# Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### 1. Install Dependencies
Already done! ✅ (mongodb, discord.js, dotenv are installed)

### 2. Update Environment Variables
Your `.env` file is already configured with:
- ✅ BOT_TOKEN
- ✅ BOT_ID
- ✅ MONGO_DB
- ✅ Access_ID

### 3. Start the Bot
```bash
npm start
```

Expected output:
```
✅ Loaded command: add
✅ Loaded command: configure
✅ Loaded command: remove
✅ Loaded command: send
🤖 Bot is ready! Logged in as YourBot#1234
✅ Successfully connected to MongoDB!
📝 Registering slash commands...
✅ Slash commands registered successfully!
```

### 4. Configure the Bot (In Discord)

Run these commands in order:

**A. Add your fee limits:**
```
/configure add-fee min:10001 max:150000 fee:2000
/configure add-fee min:150001 max:300000 fee:5000
/configure add-fee min:300001 max:500000 fee:10000
/configure add-fee min:500001 max:999999 fee:15000
/configure add-fee min:1000000 max:0 fee:0 percentage:5
```

**B. Set QRIS image (replace with your URL):**
```
/configure qris url:YOUR_QRIS_IMAGE_URL
```

**C. Set channels:**
```
/configure audit-channel channel:#your-audit-channel
/configure ticket-log-channel channel:#your-ticket-logs
```

**D. Verify setup:**
```
/configure view
```

### 5. Send Ticket Panel
```
/send
```

### 6. Test the System

1. Click the dropdown in the ticket panel
2. Select a transaction range
3. Select a trading partner
4. Check that a private thread is created
5. Verify payment method (QRIS) appears
6. Test closing with the close button (as Access_ID user)

---

## 📋 Checklist

- [ ] Bot is running without errors
- [ ] All 5 fee limits are configured
- [ ] QRIS image is set and visible
- [ ] Audit log channel is configured
- [ ] Ticket log channel is configured
- [ ] Ticket panel is sent
- [ ] Can create tickets via dropdown
- [ ] Private threads are created successfully
- [ ] QRIS payment embed appears
- [ ] Can add/remove members with /add and /remove
- [ ] Can close tickets (Access_ID only)
- [ ] Closed tickets appear in ticket log channel
- [ ] Audit logs are working

---

## 🔧 Troubleshooting

**Bot doesn't respond to commands:**
- Wait 5-10 minutes for Discord to sync slash commands
- Try kicking and re-inviting the bot
- Check bot has "applications.commands" scope in OAuth2

**Database connection error:**
- Verify MONGO_DB connection string in .env
- Check MongoDB Atlas network access (whitelist your IP or use 0.0.0.0/0)
- Ensure database user has read/write permissions

**Cannot create threads:**
- Bot needs "Create Private Threads" permission
- Channel must allow thread creation
- Check bot's role position (should be high enough)

**QRIS image not showing:**
- Ensure URL is direct image link (ends in .png, .jpg, etc.)
- Use Discord CDN, Imgur, or similar image hosting
- Test URL in browser first

---

## 🎯 Next Steps

1. **Customize fee structure** - Adjust fees to match your service
2. **Customize embeds** - Edit colors and messages in the code
3. **Add more features** - Extend functionality as needed
4. **Set up auto-restart** - Use PM2 or similar for production
5. **Monitor logs** - Keep an eye on the console for errors

---

## 💡 Pro Tips

- Use `/configure list-fees` to see all configured fees
- Fee limits are auto-sorted by minimum amount
- Dropdowns update automatically when fees change
- Threads are archived after closing (can still be viewed)
- All ticket actions are logged for audit trail
- Access_ID is stored in .env for easy updates

---

## 📞 Support Commands

```bash
# View configuration
/configure view

# List all fees
/configure list-fees

# Test in current channel
/send
```

---

## 🎉 You're All Set!

Your middleman ticket bot is ready to use. Enjoy managing transactions with ease!
