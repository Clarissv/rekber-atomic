# Example Configuration Commands

## Step 1: Set up your fee structure
# These are based on your requirements

# Fee 1: Rp 10,001 - Rp 150,000 → Rp 2,000
/configure add-fee min:10001 max:150000 fee:2000

# Fee 2: Rp 150,001 - Rp 300,000 → Rp 5,000
/configure add-fee min:150001 max:300000 fee:5000

# Fee 3: Rp 300,001 - Rp 500,000 → Rp 10,000
/configure add-fee min:300001 max:500000 fee:10000

# Fee 4: Rp 500,001 - Rp 999,999 → Rp 15,000
/configure add-fee min:500001 max:999999 fee:15000

# Fee 5: ≥ Rp 1,000,000 → 5% flat
# Note: Use max:0 for unlimited, fee:0 when using percentage
/configure add-fee min:1000000 max:0 fee:0 percentage:5

## Step 2: Set QRIS payment image
# Replace with your actual QRIS image URL
/configure qris url:https://example.com/qris-payment.png

## Step 3: Set audit log channel
# Replace #audit-logs with your actual channel
/configure audit-channel channel:#audit-logs

## Step 4: Set ticket log channel
# Replace #ticket-logs with your actual channel
/configure ticket-log-channel channel:#ticket-logs

## Step 5: Verify configuration
/configure view

## Step 6: Send the ticket panel
# Go to the channel where you want the ticket panel
/send

---

## Managing Fee Limits

# View all configured fees
/configure list-fees

# Remove a fee by index (use list-fees to see indices)
/configure remove-fee index:1

# Update a fee (remove old one, add new one)
/configure remove-fee index:3
/configure add-fee min:300001 max:500000 fee:12000

---

## Usage Examples

# Add someone to an existing ticket
/add user:@username

# Remove someone from a ticket
/remove user:@username

---

## Notes

1. Only administrators can use /configure and /send commands
2. Only the Access_ID user can close tickets
3. Fee limits are automatically sorted by minimum amount
4. Dropdowns auto-update when you modify fee limits
5. Threads are automatically archived after closing
6. All actions are logged to the audit channel
