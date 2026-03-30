# Islamic Budget Manager - Deployment Guide

## GitHub Repository
✅ **Repository Created Successfully!**
- **URL**: https://github.com/ItsMEKashif786/halal-coin-islamic-budget-manager
- **Status**: Code pushed successfully
- **Branch**: main

## Next Steps for Deployment

### 1. Netlify Deployment

#### Option A: Deploy via Netlify UI
1. Go to [Netlify](https://app.netlify.com/)
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub and select the repository: `halal-coin-islamic-budget-manager`
4. Configure build settings:
   - **Build command**: (leave empty - static site)
   - **Publish directory**: `.` (root directory)
5. Click "Deploy site"

#### Option B: Deploy via Netlify CLI (if installed)
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize and deploy
netlify init
netlify deploy --prod
```

### 2. Supabase Backend Setup

#### Step 1: Create Supabase Project
1. Go to [Supabase](https://supabase.com/) and create an account
2. Create a new project:
   - **Name**: `halal-coin-budget-manager`
   - **Database Password**: Choose a secure password
   - **Region**: Choose closest to your users

#### Step 2: Get Project Credentials
After project creation:
1. Go to Project Settings → API
2. Copy:
   - **Project URL** (e.g., `https://xxxxxxxx.supabase.co`)
   - **anon/public key**

#### Step 3: Update Configuration
Edit `js/config.js` and update:
```javascript
const SUPABASE_URL = 'https://your-project.supabase.co'; // Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'your-anon-key'; // Replace with your Supabase anon key
```

#### Step 4: Create Database Tables
Run the following SQL in Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Expenses table
CREATE TABLE expenses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Borrow/Lend transactions table
CREATE TABLE transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('lent', 'borrowed')),
    person_name TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    due_date DATE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own expenses" ON expenses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own transactions" ON transactions FOR ALL USING (auth.uid() = user_id);
```

#### Step 5: Set up Authentication
1. Go to Authentication → Providers
2. Enable "Email" provider
3. Configure settings as needed

### 3. Environment Variables (for Netlify)

If deploying to Netlify, set these environment variables in Netlify dashboard:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### 4. PWA Configuration

The PWA is already configured with:
- `manifest.json` - App metadata and icons
- `service-worker.js` - Offline caching
- Icons in `assets/` directory

### 5. Testing the Deployment

1. **Test locally**: Open `open-test.html` in browser
2. **Test deployed site**: Visit your Netlify URL
3. **Check PWA**: In Chrome DevTools → Application → Manifest
4. **Test offline**: Enable offline mode in DevTools

### 6. Custom Domain (Optional)

1. In Netlify: Site settings → Domain management
2. Add custom domain
3. Configure DNS as instructed

## Troubleshooting

### Common Issues:

1. **CORS errors**: Ensure Supabase URL is correctly configured
2. **Authentication errors**: Check Supabase auth settings
3. **PWA not installing**: Check manifest.json and service worker
4. **Database errors**: Verify SQL tables were created correctly

### Support Files Included:

- `test.html` - Basic functionality test
- `test-website.js` - Node.js test script
- `open-test.html` - User-friendly test page
- `README.md` - Complete documentation

## Final Checklist

- [ ] GitHub repository created and pushed
- [ ] Netlify deployment configured
- [ ] Supabase project created
- [ ] Database tables created
- [ ] Configuration updated in `js/config.js`
- [ ] Test application locally
- [ ] Test deployed application
- [ ] Verify PWA installation
- [ ] Test offline functionality

## Repository Structure
```
halal-coin-islamic-budget-manager/
├── index.html              # Main application
├── css/style.css          # Islamic design CSS
├── js/
│   ├── config.js          # Supabase configuration
│   ├── auth.js            # Authentication system
│   ├── dashboard.js       # Dashboard with charts
│   ├── expenses.js        # Expense manager
│   ├── borrowlend.js      # Borrow/Lend manager
│   └── main.js            # Main app initialization
├── manifest.json          # PWA manifest
├── service-worker.js      # PWA service worker
├── assets/                # Icons and images
├── README.md              # Documentation
└── DEPLOYMENT_GUIDE.md    # This file
```

## Need Help?

1. Check the [README.md](README.md) for detailed setup instructions
2. Review browser console for errors
3. Test with `open-test.html` for guided testing
4. Refer to Supabase and Netlify documentation

Your Islamic Budget Manager is now ready for production deployment! 🎉