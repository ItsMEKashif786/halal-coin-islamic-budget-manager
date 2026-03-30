// Supabase Configuration - Use environment variables with fallback for local development
// For Netlify deployment, set these environment variables:
// - VITE_SUPABASE_URL
// - VITE_SUPABASE_ANON_KEY

(function() {
    // Check if already initialized
    if (window.AppConfig && window.Utils && window.supabase) {
        console.log('Config already initialized, skipping...');
        return;
    }

    const SUPABASE_URL = window.env?.VITE_SUPABASE_URL || 'https://suqokpiibtnnkatauehu.supabase.co';
    const SUPABASE_ANON_KEY = window.env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1cW9rcGlpYnRubmthdGF1ZWh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NTEyOTksImV4cCI6MjA5MDQyNzI5OX0.eiTxH9M-41enjS7m3rvtUPhnST1mi8H2NuaFt_xJODQ';

    // Initialize Supabase client - use a function to defer initialization
    let supabase;
    function initializeSupabase() {
        if (window.supabase && window.supabase.createClient) {
            try {
                supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                console.log('Supabase client initialized successfully');
                return supabase;
            } catch (error) {
                console.error('Failed to initialize Supabase client:', error);
            }
        }
        
        // Create a dummy client to prevent errors
        supabase = {
            from: () => ({
                select: () => ({ data: null, error: new Error('Supabase not initialized') }),
                insert: () => ({ data: null, error: new Error('Supabase not initialized') }),
                update: () => ({ data: null, error: new Error('Supabase not initialized') }),
                delete: () => ({ data: null, error: new Error('Supabase not initialized') })
            }),
            auth: {
                signUp: () => ({ data: null, error: new Error('Supabase not initialized') }),
                signIn: () => ({ data: null, error: new Error('Supabase not initialized') })
            }
        };
        return supabase;
    }

    // Initialize immediately if possible, otherwise wait for DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            initializeSupabase();
        });
    } else {
        initializeSupabase();
    }

    // App Configuration
    const APP_CONFIG = {
        appName: 'Halal Coin',
        currency: '₹',
        categories: [
            'Food & Dining',
            'Transportation',
            'Shopping',
            'Entertainment',
            'Bills & Utilities',
            'Healthcare',
            'Education',
            'Charity (Sadaqah)',
            'Housing',
            'Personal Care',
            'Travel',
            'Other'
        ],
        transactionTypes: ['borrow', 'lend'],
        statusOptions: ['pending', 'paid', 'overdue'],
        chartColors: [
            '#0B3B2F', '#D4AF37', '#2E8B57', '#8B4513', '#4682B4',
            '#D2691E', '#5F9EA0', '#A0522D', '#CD853F', '#6B8E23',
            '#8FBC8F', '#B8860B'
        ]
    };

    // Utility Functions
    const Utils = {
        formatCurrency(amount) {
            return `${APP_CONFIG.currency}${parseFloat(amount).toFixed(2)}`;
        },
        
        formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        },
        
        getCurrentDate() {
            const now = new Date();
            return now.toISOString().split('T')[0];
        },
        
        getMonthStartDate() {
            const now = new Date();
            return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        },
        
        showToast(message, type = 'info') {
            const toastContainer = document.getElementById('toast-container');
            if (!toastContainer) return;
            
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.innerHTML = `
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                <span>${message}</span>
            `;
            
            toastContainer.appendChild(toast);
            
            // Remove toast after 5 seconds
            setTimeout(() => {
                toast.remove();
            }, 5000);
        },
        
        showLoading() {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.display = 'flex';
            }
        },
        
        hideLoading() {
            const loadingScreen = document.getElementById('loading-screen');
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.style.display = 'none';
                    loadingScreen.style.opacity = '1';
                }, 500);
            }
        },
        
        // Islamic date calculation (simplified)
        getIslamicDate() {
            const today = new Date();
            const islamicMonths = [
                'Muharram', 'Safar', 'Rabi\' al-Awwal', 'Rabi\' al-Thani',
                'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Sha\'ban',
                'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
            ];
            
            // Simplified calculation - in production, use a proper Hijri calendar library
            const islamicYear = 1445 + Math.floor((today.getFullYear() - 2023) * 0.97);
            const islamicMonth = islamicMonths[today.getMonth()];
            const islamicDay = today.getDate();
            
            return `${islamicDay} ${islamicMonth} ${islamicYear} AH`;
        },
        
        // Calculate Zakat
        calculateZakat(savings, goldValue = 0) {
            const totalWealth = parseFloat(savings) + parseFloat(goldValue);
            const nisab = 87500; // Approximate Nisab value in INR (based on 85g gold)
            
            if (totalWealth < nisab) {
                return 0;
            }
            
            return totalWealth * 0.025; // 2.5%
        }
    };

    // Export for use in other modules
    window.AppConfig = APP_CONFIG;
    window.Utils = Utils;
    window.supabase = supabase;
    
    console.log('Config initialized successfully');
})();