# How Email Campaign Scheduling Works

## Overview

The scheduling system allows you to create campaigns and schedule them to send at a specific date and time in the future.

## How It Works

### 1. **Creating a Scheduled Campaign**

When creating or editing a campaign:
- Set a **Schedule** date/time in the campaign form
- If `scheduledAt` is provided, the campaign status becomes `SCHEDULED`
- If no schedule is set, status is `DRAFT`

**Example:**
```javascript
// Creating a campaign with schedule
POST /api/campaigns
{
  "name": "Weekly Newsletter",
  "subject": "Your Weekly Update",
  "scheduledAt": "2024-01-15T10:00:00Z",  // ISO datetime string
  "htmlContent": "...",
  "tagIds": ["tag-id-1"]
}
```

### 2. **Campaign States**

- **DRAFT** - Campaign created but not scheduled
- **SCHEDULED** - Campaign has a `scheduledAt` date in the future
- **SENDING** - Campaign is currently being sent
- **SENT** - Campaign has been sent

### 3. **The Cron Job**

A cron job must periodically call the send endpoint:

**Endpoint:** `GET /api/cron/send`

**Authentication:** Requires `Authorization: Bearer {CRON_SECRET}` header

**What it does:**
1. Finds all campaigns with:
   - Status: `SCHEDULED`
   - `scheduledAt <= now` (time has arrived)
2. For each campaign:
   - Updates status to `SENDING`
   - Gets contacts based on campaign tags
   - Sends emails to all contacts
   - Updates status to `SENT` when complete

### 4. **Setting Up the Cron Job**

#### Option A: Vercel Cron (Recommended)

Create `vercel.json` in your project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/send",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

This runs every 5 minutes. Adjust schedule as needed:
- `*/1 * * * *` - Every minute
- `*/5 * * * *` - Every 5 minutes (recommended)
- `*/15 * * * *` - Every 15 minutes
- `0 * * * *` - Every hour

**Required Environment Variable:**
- `CRON_SECRET` - Secret token for authentication

#### Option B: External Cron Service

Use services like:
- **cron-job.org** - Free cron service
- **EasyCron** - Cron job scheduler
- **GitHub Actions** - Schedule workflows

**Setup:**
1. Create a scheduled job
2. URL: `https://yourdomain.com/api/cron/send`
3. Method: `GET`
4. Headers: `Authorization: Bearer YOUR_CRON_SECRET`
5. Frequency: Every 1-5 minutes

### 5. **The Flow**

```
┌─────────────────┐
│ Create Campaign │
│ with scheduledAt│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Status: SCHEDULED│
│ scheduledAt set │
└────────┬────────┘
         │
         │ (wait for scheduled time)
         │
         ▼
┌─────────────────┐
│ Cron Job Runs    │
│ /api/cron/send   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Check:           │
│ scheduledAt <= now│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Status: SENDING  │
│ Send emails      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Status: SENT     │
│ Campaign complete│
└─────────────────┘
```

## Important Notes

### Timezone
- `scheduledAt` is stored as UTC in the database
- The UI should convert to user's local timezone for display
- Cron job compares against server time (UTC)

### Precision
- Cron job runs every X minutes (e.g., every 5 minutes)
- Campaigns send when cron runs **after** the scheduled time
- Example: Scheduled for 10:00 AM, cron runs at 10:03 AM → sends at 10:03 AM

### Multiple Campaigns
- If multiple campaigns are scheduled for the same time, they all send when cron runs
- They send sequentially (one after another)
- Rate limiting applies (14 emails/second max)

### Canceling Scheduled Campaigns
- Change campaign status to `CANCELLED` before scheduled time
- Or edit campaign and remove `scheduledAt` (sets to DRAFT)

## Example: Setting Up Vercel Cron

1. **Create `vercel.json`:**
```json
{
  "crons": [
    {
      "path": "/api/cron/send",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

2. **Set `CRON_SECRET` in Vercel:**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Add: `CRON_SECRET=your-random-secret-here`

3. **Deploy to Vercel:**
   - The cron job will automatically start running

## Testing

To test scheduling locally:

```bash
# Manually trigger the cron endpoint
curl -X GET http://localhost:3000/api/cron/send \
  -H "Authorization: Bearer your-cron-secret"
```

## Troubleshooting

**Campaigns not sending:**
- ✅ Check cron job is running (check Vercel logs)
- ✅ Verify `CRON_SECRET` is set correctly
- ✅ Check campaign status is `SCHEDULED`
- ✅ Verify `scheduledAt` is in the past
- ✅ Check Vercel function logs for errors

**Campaigns sending too early/late:**
- Check timezone settings
- Verify `scheduledAt` is stored correctly (UTC)
- Adjust cron frequency if needed

