// Environment variables injection for Halal Coin
// This file is generated during Netlify build process
// For local development, values are read from localStorage or use defaults

(function() {
    // Create window.env object if it doesn't exist
    window.env = window.env || {};
    
    // Try to load from localStorage (for local development)
    try {
        const savedEnv = localStorage.getItem('halalCoinEnv');
        if (savedEnv) {
            const parsed = JSON.parse(savedEnv);
            Object.assign(window.env, parsed);
            console.log('Loaded environment from localStorage');
        }
    } catch (e) {
        console.log('No saved environment in localStorage');
    }
    
    // Set default values (will be overridden by Netlify build)
    window.env.VITE_SUPABASE_URL = window.env.VITE_SUPABASE_URL || 'https://suqokpiibtnnkatauehu.supabase.co';
    window.env.VITE_SUPABASE_ANON_KEY = window.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1cW9rcGlpYnRubmthdGF1ZWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NTEyOTksImV4cCI6MjA5MDQyNzI5OX0.eiTxH9M-41enjS7m3rvtUPhnST1mi8H2NuaFt_xJODQ';
    
    // Log environment status (without exposing keys)
    console.log('Environment loaded:', {
        hasSupabaseUrl: !!window.env.VITE_SUPABASE_URL,
        hasSupabaseKey: !!window.env.VITE_SUPABASE_ANON_KEY,
        urlLength: window.env.VITE_SUPABASE_URL ? window.env.VITE_SUPABASE_URL.length : 0,
        keyLength: window.env.VITE_SUPABASE_ANON_KEY ? window.env.VITE_SUPABASE_ANON_KEY.length : 0
    });
})();