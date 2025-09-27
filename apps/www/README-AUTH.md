# Authentication Setup Guide

## Required Environment Variables

### 1. AUTH_SECRET (Required!)
This is **CRITICAL** for NextAuth.js to work. Without it, authentication will fail silently.

Generate a secure secret with:
```bash
openssl rand -base64 32
```

Add to your `.env.local`:
```env
AUTH_SECRET=your-generated-secret-here
```

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Navigate to **APIs & Services** > **Credentials**
4. Create an OAuth 2.0 Client ID
5. Add Authorized redirect URIs:
   - For development: `http://localhost:3000/api/auth/callback/google`
   - For production: `https://your-domain.com/api/auth/callback/google`

Add to your `.env.local`:
```env
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
```

### 3. Other OAuth Providers (Optional)

#### GitHub OAuth
```env
AUTH_GITHUB_ID=your-github-client-id
AUTH_GITHUB_SECRET=your-github-client-secret
```

#### Apple OAuth
```env
AUTH_APPLE_ID=your-apple-client-id
AUTH_APPLE_SECRET=your-apple-client-secret
AUTH_APPLE_TEAM_ID=your-apple-team-id
AUTH_APPLE_KEY_ID=your-apple-key-id
```

#### LinkedIn OAuth
```env
AUTH_LINKEDIN_ID=your-linkedin-client-id
AUTH_LINKEDIN_SECRET=your-linkedin-client-secret
```

## Troubleshooting

### Login doesn't work after OAuth redirect
- **Check AUTH_SECRET**: Ensure you have set the `AUTH_SECRET` environment variable
- **Check console errors**: Look for errors in browser console and server logs
- **Verify redirect URI**: Make sure the redirect URI matches exactly in your OAuth provider settings
- **Check environment**: Ensure all required environment variables are set correctly

### redirect_uri_mismatch error
- Verify the redirect URI in your OAuth provider matches exactly:
  - Protocol must match (http vs https)
  - Port must match (localhost:3000 vs localhost:3001)
  - Path must be exact: `/api/auth/callback/google`

### Session not persisting
- Ensure `AUTH_SECRET` is set and consistent across deployments
- Check that cookies are enabled in your browser
- Verify your domain is correctly configured for production

## Quick Start

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Generate and set AUTH_SECRET:
   ```bash
   echo "AUTH_SECRET=$(openssl rand -base64 32)" >> .env.local
   ```

3. Add your OAuth provider credentials

4. Restart your development server:
   ```bash
   pnpm dev
   ```