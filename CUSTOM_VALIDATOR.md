# Custom Email Validator

Your app now uses a **custom email validator** instead of ZeroBounce API.

## How It Works

The custom validator performs these checks:

1. **Syntax Validation** - Verifies email format (user@domain.com)
2. **Domain Existence** - Checks if domain has DNS records
3. **MX Records** - Verifies mail server records exist
4. **Disposable Email Detection** - Filters temporary email services
5. **Free Email Detection** - Identifies Gmail, Yahoo, etc.

## What It Can't Do

- ❌ **SMTP Verification** - Can't check if mailbox actually exists (requires connecting to mail servers)
- ❌ **Spam Trap Detection** - No spam trap database
- ❌ **Catch-All Detection** - Can't detect catch-all domains

## Accuracy

- **Custom Validator**: ~70-80% accuracy
- **ZeroBounce**: ~98% accuracy

## Fallback

If ZeroBounce API key is configured (`ZEROBOUNCE_API_KEY`), it will fallback to ZeroBounce if custom validator fails.

## Usage

The validator is automatically used when:
- Importing contacts via CSV
- Creating new contacts
- Sending campaigns (invalid emails are filtered)

## Configuration

No configuration needed! The custom validator works out of the box.

To use ZeroBounce as fallback, set:
```bash
ZEROBOUNCE_API_KEY=your_api_key
```

## Files

- `src/lib/custom-validator.ts` - Custom validation logic
- `src/lib/zerobounce.ts` - Main validation function (uses custom validator)

## Testing

Test validation by:
1. Importing a CSV with test emails
2. Creating a contact manually
3. Using `/api/contacts/validate` endpoint

