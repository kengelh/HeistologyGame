# Bug Tracking System

## Overview

Heistology now includes an integrated bug tracking system powered by Sentry. This allows players to easily report bugs directly from the game, and gives you (the developer) a professional dashboard to manage and track all issues.

## Features

### For Players
- **Easy Reporting**: Click the 🐛 button in the bottom-right corner of any screen
- **Simple Form**: Fill out a quick form describing the bug
- **Optional Contact**: Players can optionally provide their name/email if they want updates
- **Instant Submission**: Bug reports are sent immediately to your dashboard

### For Developers
- **Centralized Dashboard**: All bug reports in one place at sentry.io
- **Rich Context**: Each report includes:
  - What screen the player was on
  - Which scenario they were playing
  - Game phase (planning/execution)
  - Team size and current time
  - Browser and device information
- **Automatic Error Tracking**: JavaScript errors are automatically captured
- **Session Replay**: See exactly what the user was doing (optional)
- **Issue Management**: Mark bugs as resolved, assign them, add comments

## Files

- `lib/sentry.ts` - Sentry initialization and utility functions
- `components/BugReportButton.tsx` - The bug report UI component
- `SENTRY_SETUP.md` - Complete setup instructions
- `.env.example` - Example environment configuration

## Quick Start

1. Follow the instructions in `SENTRY_SETUP.md`
2. Create a free Sentry account
3. Add your DSN to a `.env` file
4. Restart your dev server
5. Done! The bug button will appear automatically

## How It Works

1. **Initialization**: Sentry is initialized in `index.tsx` before React starts
2. **Context Tracking**: Game state is automatically tracked via `setGameContext()`
3. **Bug Button**: The `BugReportButton` component is added to all main screens
4. **Submission**: When users submit a bug, it's sent to Sentry with full context
5. **Dashboard**: You view and manage bugs in your Sentry dashboard

## Privacy & Performance

- **Minimal Impact**: Sentry adds ~9KB to your bundle (gzipped)
- **Conditional Loading**: Only loads if DSN is configured
- **Privacy-Friendly**: No personal data is collected unless users provide it
- **Free Tier**: 5,000 errors/month is plenty for most indie games

## Customization

You can customize the bug report button by editing `components/BugReportButton.tsx`:
- Change the button position
- Modify the form fields
- Adjust colors and styling
- Add custom validation

## Disabling

To disable bug tracking:
1. Remove the `VITE_SENTRY_DSN` from your `.env` file
2. Restart the dev server

The bug button will still appear, but reports won't be sent anywhere.

## Support

For help with Sentry, see:
- [Sentry Documentation](https://docs.sentry.io)
- [Sentry React Guide](https://docs.sentry.io/platforms/javascript/guides/react/)
