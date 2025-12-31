# TREMS Email Campaign Platform

A private, single-user email campaign platform built with Next.js 14, PostgreSQL, and Amazon SES.

## Features

- **Contact Management**: Import contacts via CSV, organize with tags, track consent status
- **Rich Email Editor**: Drag-and-drop email builder using Unlayer
- **Campaign Management**: Create, schedule, and send email campaigns
- **Advanced Tracking**: Track opens, clicks, bounces, and complaints
- **Analytics Dashboard**: Visualize campaign performance with charts
- **Unsubscribe Handling**: CAN-SPAM compliant unsubscribe flow
- **SES Integration**: Reliable email delivery via Amazon SES

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (Docker Compose included)
- Amazon SES account with verified email address
- AWS credentials (Access Key ID and Secret Access Key)

## Setup

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Set up PostgreSQL** (Choose ONE method):

   **Option A: Docker (Recommended)**:
   ```bash
   # Add user to docker group (one-time)
   sudo usermod -aG docker $USER
   # Log out and back in, then:
   bash scripts/setup-docker-db.sh
   ```

   **Option B: System Install**:
   ```bash
   sudo apt update
   sudo apt install -y postgresql postgresql-contrib
   sudo -u postgres bash scripts/setup-database.sh
   ```

3. **Run database migrations**:
   ```bash
   npm run db:migrate
   ```

4. **Configure environment variables**:
   Create a `.env.local` file (see `.env.example`):
   ```env
   DATABASE_URL="postgresql://trems:trems_password@localhost:5432/trems"
   AWS_ACCESS_KEY_ID="your-aws-access-key"
   AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
   AWS_REGION="us-east-1"
   SES_FROM_EMAIL="campaigns@yourdomain.com"
   APP_SECRET="generate-a-random-32-character-secret"
   ADMIN_PASSWORD_HASH="generate-with: node -e \"console.log(require('bcryptjs').hashSync('your-password', 10))\""
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

5. **Run the development server**:
   ```bash
   npm run dev
   ```

6. **Access the application**:
   Open [http://localhost:3000/login](http://localhost:3000/login)
   - **Password**: `admin123` (default)

## Generating Admin Password Hash

To generate a bcrypt hash for your admin password:

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('your-password', 10).then(hash => console.log(hash))"
```

Copy the output and set it as `ADMIN_PASSWORD_HASH` in your `.env.local` file.

## Amazon SES Setup

1. **Verify your email address** in the SES console
2. **Request production access** if you're in the SES sandbox
3. **Configure SNS notifications** for bounces and complaints:
   - Create an SNS topic
   - Subscribe it to SES bounce/complaint events
   - Set the webhook URL to: `https://yourdomain.com/api/webhooks/ses`

## Scheduled Campaigns

To enable scheduled campaign sending, set up a cron job that calls:
```
GET https://yourdomain.com/api/cron/send
Authorization: Bearer YOUR_CRON_SECRET
```

Set `CRON_SECRET` in your environment variables.

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Authentication pages
│   ├── (dashboard)/     # Protected dashboard pages
│   ├── api/             # API routes
│   └── unsubscribe/      # Public unsubscribe pages
├── components/          # React components
├── lib/                 # Utility functions
└── types/               # TypeScript types
```

## Technologies Used

- **Next.js 14** - React framework with App Router
- **PostgreSQL** - Database
- **Prisma** - ORM
- **shadcn/ui** - UI components
- **Amazon SES** - Email delivery
- **Unlayer** - Email editor
- **Recharts** - Data visualization

## License

Private use only.
