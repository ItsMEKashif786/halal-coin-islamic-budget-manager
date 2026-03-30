# Netlify Environment Variables Setup Guide

## Overview
Your Halal Coin Islamic Budget Manager application now uses environment variables for Supabase credentials, making it secure for production deployment. This guide explains how to set up environment variables in Netlify.

## Environment Variables Required

The application requires two environment variables:

1. **VITE_SUPABASE_URL** - Your Supabase project URL
   - Example: `https://suqokpiibtnnkatauehu.supabase.co`

2. **VITE_SUPABASE_ANON_KEY** - Your Supabase anonymous/public key
   - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## How to Set Environment Variables in Netlify

### Method 1: Netlify Dashboard
1. Go to your Netlify dashboard
2. Select your site (halal-coin-islamic-budget-manager)
3. Go to **Site settings** → **Environment variables**
4. Click **Add variable**
5. Add both variables:
   - Key: `VITE_SUPABASE_URL`, Value: `https://suqokpiibtnnkatauehu.supabase.co`
   - Key: `VITE_SUPABASE_ANON_KEY`, Value: `your-anon-key-here`
6. Click **Save**

### Method 2: Netlify CLI
```bash
# Install Netlify CLI if not already installed
npm install -g netlify-cli

# Login to Netlify
netlify login

# Set environment variables
netlify env:set VITE_SUPABASE_URL "https://suqokpiibtnnkatauehu.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "your-anon-key-here"

# Deploy
netlify deploy --prod
```

### Method 3: netlify.toml (Not Recommended for Secrets)
For non-secret variables only (URLs without keys):
```toml
[build.environment]
  VITE_SUPABASE_URL = "https://suqokpiibtnnkatauehu.supabase.co"
```

**Warning**: Never put API keys in `netlify.toml` as it's committed to git.

## Getting Your Supabase Credentials

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Select your project
3. Go to **Project Settings** → **API**
4. Copy:
   - **Project URL** (use as VITE_SUPABASE_URL)
   - **anon/public** key (use as VITE_SUPABASE_ANON_KEY)

## How the Application Uses Environment Variables

The application uses a two-layer approach:

1. **Runtime Injection**: `js/env.js` loads environment variables from `window.env`
2. **Build-time Injection**: Netlify can inject variables during build (requires build script)
3. **Fallback**: If no environment variables are set, the app uses hardcoded defaults for local development

## For Local Development

### Option 1: Use Defaults
The app includes default Supabase credentials for testing. Just open `index.html` in a browser.

### Option 2: Set Local Environment Variables
Create a file `local-env.js` in the `js` folder:
```javascript
// Save this as local-env.js and load it before env.js
window.env = window.env || {};
window.env.VITE_SUPABASE_URL = 'https://suqokpiibtnnkatauehu.supabase.co';
window.env.VITE_SUPABASE_ANON_KEY = 'your-anon-key-here';
```

Then update `index.html` to load it:
```html
<script src="js/local-env.js"></script>
<script src="js/env.js"></script>
```

### Option 3: Use localStorage (for testing)
Open browser console and run:
```javascript
localStorage.setItem('halalCoinEnv', JSON.stringify({
  VITE_SUPABASE_URL: 'https://suqokpiibtnnkatauehu.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'your-anon-key-here'
}));
location.reload();
```

## Testing Environment Variables

After setting environment variables:

1. **Redeploy your site** on Netlify
2. **Check the console** for environment status:
   - Open browser developer tools (F12)
   - Go to Console tab
   - Look for "Environment loaded" message
   - Should show `hasSupabaseUrl: true` and `hasSupabaseKey: true`

## Troubleshooting

### Issue: "Supabase not initialized" error
**Solution**: Check if environment variables are correctly set in Netlify dashboard.

### Issue: CORS errors
**Solution**: Ensure your Supabase URL is correctly configured in Supabase dashboard:
1. Go to Supabase → Authentication → URL Configuration
2. Add your Netlify site URL to "Additional Redirect URLs"

### Issue: Environment variables not loading
**Solution**: 
1. Check Netlify build logs for errors
2. Verify variable names match exactly (case-sensitive)
3. Try redeploying after clearing Netlify build cache

## Security Best Practices

1. **Never commit API keys** to GitHub
2. **Use environment variables** for all secrets
3. **Rotate keys regularly** in Supabase dashboard
4. **Restrict Supabase RLS policies** to protect data
5. **Use different keys** for development and production

## Next Steps

1. Set up environment variables in Netlify
2. Trigger a new deployment
3. Test authentication functionality
4. Verify data is being saved to Supabase
5. Monitor Netlify logs for any issues

## Support

If you encounter issues:
1. Check Netlify deployment logs
2. Verify Supabase project is active
3. Ensure database tables are created (run supabase_schema_clean.sql)
4. Contact for further assistance

---

**Application Status**: ✅ All fixes applied and pushed to GitHub  
**GitHub Repository**: https://github.com/ItsMEKashif786/halal-coin-islamic-budget-manager  
**Supabase Project**: https://suqokpiibtnnkatauehu.supabase.co  
**Netlify Site**: https://halal-coin-islamic-budget-manager.netlify.app (after deployment)