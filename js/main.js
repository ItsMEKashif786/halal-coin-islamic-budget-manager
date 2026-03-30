// Main Application Initialization for Halal Coin

class MainApp {
    constructor() {
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupProfileSettings();
        this.setupZakatCalculator();
        this.setupPWA();
        this.setupOfflineDetection();
        this.setupGlobalEventListeners();
        
        // Initialize date fields with current date
        this.initializeDateFields();
    }

    setupNavigation() {
        // Navbar toggle for mobile
        const navbarToggle = document.getElementById('navbar-toggle');
        const navbarMenu = document.getElementById('navbar-menu');
        
        if (navbarToggle && navbarMenu) {
            navbarToggle.addEventListener('click', () => {
                navbarMenu.classList.toggle('active');
            });
        }

        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                
                // Close mobile menu if open
                if (navbarMenu) {
                    navbarMenu.classList.remove('active');
                }
                
                // Navigate to page
                if (window.AuthManager) {
                    window.AuthManager.navigateToPage(page);
                }
            });
        });

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.page) {
                if (window.AuthManager) {
                    window.AuthManager.navigateToPage(e.state.page);
                }
            }
        });
    }

    setupProfileSettings() {
        // Currency setting
        const currencySetting = document.getElementById('currency-setting');
        if (currencySetting) {
            const savedCurrency = localStorage.getItem('halalCoinCurrency') || 'INR';
            currencySetting.value = savedCurrency;
            
            currencySetting.addEventListener('change', (e) => {
                localStorage.setItem('halalCoinCurrency', e.target.value);
                Utils.showToast('Currency setting saved', 'success');
                
                // Reload dashboard to update currency display
                if (window.DashboardManager && document.getElementById('dashboard-page').classList.contains('active')) {
                    window.DashboardManager.loadData();
                }
            });
        }

        // Toggle settings
        const settings = ['notifications', 'islamic-calendar', 'auto-backup'];
        settings.forEach(setting => {
            const element = document.getElementById(`${setting}-setting`);
            if (element) {
                const savedValue = localStorage.getItem(`halalCoin${setting.charAt(0).toUpperCase() + setting.slice(1)}`);
                element.checked = savedValue !== 'false';
                
                element.addEventListener('change', (e) => {
                    localStorage.setItem(`halalCoin${setting.charAt(0).toUpperCase() + setting.slice(1)}`, e.target.checked);
                    Utils.showToast('Setting saved', 'success');
                });
            }
        });

        // Edit profile button
        const editProfileBtn = document.getElementById('edit-profile-btn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => {
                Utils.showToast('Profile editing will be available soon', 'info');
            });
        }

        // Export data button
        const exportDataBtn = document.getElementById('export-data-btn');
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', async () => {
                await this.exportData();
            });
        }
    }

    setupZakatCalculator() {
        const calculateBtn = document.getElementById('calculate-zakat');
        if (!calculateBtn) return;

        calculateBtn.addEventListener('click', () => {
            const savings = parseFloat(document.getElementById('zakat-savings').value) || 0;
            const goldValue = parseFloat(document.getElementById('zakat-gold').value) || 0;

            const zakatAmount = Utils.calculateZakat(savings, goldValue);
            
            const resultElement = document.getElementById('zakat-result');
            const amountElement = resultElement.querySelector('.zakat-amount');
            
            amountElement.textContent = Utils.formatCurrency(zakatAmount);
            resultElement.classList.remove('hidden');
            
            if (zakatAmount === 0) {
                resultElement.querySelector('.zakat-note').textContent = 'Your wealth is below Nisab threshold. No Zakat due.';
            } else {
                resultElement.querySelector('.zakat-note').textContent = '2.5% of your total wealth above Nisab';
            }
        });
    }

    async exportData() {
        if (!window.AuthManager?.getUserId()) {
            Utils.showToast('Please login first', 'error');
            return;
        }

        Utils.showLoading();

        try {
            const userId = window.AuthManager.getUserId();
            const user = window.AuthManager.getCurrentUser();
            
            // Get all user data
            const [expenses, transactions] = await Promise.all([
                supabase.from('expenses').select('*').eq('user_id', userId),
                supabase.from('borrow_lend').select('*').eq('user_id', userId)
            ]);

            const exportData = {
                user: user,
                exportDate: new Date().toISOString(),
                expenses: expenses.data || [],
                transactions: transactions.data || []
            };

            // Create and download JSON file
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const exportFileDefaultName = `halal-coin-export-${new Date().toISOString().split('T')[0]}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            
            Utils.showToast('Data exported successfully', 'success');

        } catch (error) {
            console.error('Error exporting data:', error);
            Utils.showToast('Failed to export data', 'error');
        } finally {
            Utils.hideLoading();
        }
    }

    setupPWA() {
        // Check if PWA is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('Running in standalone PWA mode');
        }

        // Handle install prompt
        let deferredPrompt;
        const installPrompt = document.getElementById('install-prompt');
        const installBtn = document.getElementById('install-btn');
        const dismissBtn = document.getElementById('dismiss-install');

        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later
            deferredPrompt = e;
            
            // Show install prompt
            if (installPrompt) {
                installPrompt.classList.remove('hidden');
            }
        });

        if (installBtn) {
            installBtn.addEventListener('click', async () => {
                if (!deferredPrompt) return;
                
                // Show the install prompt
                deferredPrompt.prompt();
                
                // Wait for the user to respond to the prompt
                const { outcome } = await deferredPrompt.userChoice;
                
                if (outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                    Utils.showToast('App installed successfully!', 'success');
                } else {
                    console.log('User dismissed the install prompt');
                }
                
                // Hide the install prompt
                if (installPrompt) {
                    installPrompt.classList.add('hidden');
                }
                
                // Clear the deferredPrompt variable
                deferredPrompt = null;
            });
        }

        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => {
                if (installPrompt) {
                    installPrompt.classList.add('hidden');
                }
                // Hide for 30 days
                localStorage.setItem('halalCoinInstallDismissed', Date.now().toString());
            });
        }

        // Check if user previously dismissed the prompt
        const dismissedTime = localStorage.getItem('halalCoinInstallDismissed');
        if (dismissedTime) {
            const thirtyDays = 30 * 24 * 60 * 60 * 1000;
            if (Date.now() - parseInt(dismissedTime) < thirtyDays) {
                if (installPrompt) {
                    installPrompt.classList.add('hidden');
                }
            }
        }
    }

    setupOfflineDetection() {
        const offlineIndicator = document.getElementById('offline-indicator');
        
        window.addEventListener('online', () => {
            if (offlineIndicator) {
                offlineIndicator.classList.add('hidden');
            }
            Utils.showToast('You are back online', 'success');
            
            // Sync any pending changes
            this.syncPendingChanges();
        });
        
        window.addEventListener('offline', () => {
            if (offlineIndicator) {
                offlineIndicator.classList.remove('hidden');
            }
            Utils.showToast('You are offline. Changes will sync when reconnected.', 'warning');
        });
        
        // Initial check
        if (!navigator.onLine && offlineIndicator) {
            offlineIndicator.classList.remove('hidden');
        }
    }

    async syncPendingChanges() {
        // This would sync any locally stored changes when coming back online
        // For now, just reload data
        if (window.DashboardManager && document.getElementById('dashboard-page').classList.contains('active')) {
            window.DashboardManager.loadData();
        }
        
        if (window.ExpenseManager && document.getElementById('expenses-page').classList.contains('active')) {
            window.ExpenseManager.loadExpenses();
        }
        
        if (window.BorrowLendManager && document.getElementById('borrow-lend-page').classList.contains('active')) {
            window.BorrowLendManager.loadTransactions();
        }
    }

    setupGlobalEventListeners() {
        // Close modals with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modals = document.querySelectorAll('.modal:not(.hidden)');
                modals.forEach(modal => {
                    modal.classList.add('hidden');
                });
                
                // Clear any edit IDs
                if (window.ExpenseManager) window.ExpenseManager.currentExpenseId = null;
                if (window.BorrowLendManager) window.BorrowLendManager.currentTransactionId = null;
            }
        });

        // Update Islamic date every minute
        setInterval(() => {
            if (window.DashboardManager) {
                window.DashboardManager.updateIslamicDate();
            }
        }, 60000);
    }

    initializeDateFields() {
        // Set today's date as default for date inputs
        const today = Utils.getCurrentDate();
        document.querySelectorAll('input[type="date"]').forEach(input => {
            if (!input.value) {
                input.value = today;
                input.max = today; // Don't allow future dates
            }
        });
    }
}

// Initialize Main App when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Hide loading screen after everything is loaded
    setTimeout(() => {
        Utils.hideLoading();
    }, 1000);
    
    // Initialize main app
    window.MainApp = new MainApp();
    
    // Check if user is returning to the app
    if (window.AuthManager?.getCurrentUser()) {
        // User is logged in, ensure app is shown
        window.AuthManager.showApp();
    }
});

// Register service worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').then(registration => {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }).catch(error => {
            console.log('ServiceWorker registration failed: ', error);
        });
    });
}