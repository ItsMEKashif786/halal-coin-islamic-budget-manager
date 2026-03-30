// Authentication Module for Halal Coin

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        // Check if user is already logged in
        await this.checkAuthState();
        this.setupEventListeners();
    }

    async checkAuthState() {
        try {
            // Check localStorage for saved user
            const savedUser = localStorage.getItem('halalCoinUser');
            const rememberMe = localStorage.getItem('halalCoinRememberMe') === 'true';
            
            if (savedUser && rememberMe) {
                this.currentUser = JSON.parse(savedUser);
                this.showApp();
                Utils.showToast('Welcome back!', 'success');
            } else {
                this.showAuth();
            }
        } catch (error) {
            console.error('Auth check error:', error);
            this.showAuth();
        }
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchAuthTab(tabName);
            });
        });

        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Register form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }
    }

    switchAuthTab(tabName) {
        // Update active tab
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Show corresponding form
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.toggle('active', form.id === `${tabName}-form`);
        });
    }

    async handleLogin() {
        const name = document.getElementById('login-name').value.trim();
        const mobile = document.getElementById('login-mobile').value.trim();
        const email = document.getElementById('login-email').value.trim();
        const rememberMe = document.getElementById('remember-me').checked;

        if (!name || !mobile || !email) {
            Utils.showToast('Please fill in all fields', 'error');
            return;
        }

        Utils.showLoading();

        try {
            // Check if user exists in Supabase
            const { data: existingUsers, error } = await supabase
                .from('users')
                .select('*')
                .or(`mobile.eq.${mobile},email.eq.${email}`);

            if (error) throw error;

            let user = existingUsers?.[0];

            if (!user) {
                // Create new user if doesn't exist (auto-register)
                const { data: newUser, error: createError } = await supabase
                    .from('users')
                    .insert([{ name, mobile, email }])
                    .select()
                    .single();

                if (createError) throw createError;
                user = newUser;
            } else {
                // Update user info if changed
                if (user.name !== name || user.email !== email) {
                    const { error: updateError } = await supabase
                        .from('users')
                        .update({ name, email })
                        .eq('id', user.id);

                    if (updateError) throw updateError;
                    user.name = name;
                    user.email = email;
                }
            }

            // Save user session
            this.currentUser = user;
            
            if (rememberMe) {
                localStorage.setItem('halalCoinUser', JSON.stringify(user));
                localStorage.setItem('halalCoinRememberMe', 'true');
            } else {
                sessionStorage.setItem('halalCoinUser', JSON.stringify(user));
            }

            Utils.hideLoading();
            Utils.showToast('Login successful!', 'success');
            this.showApp();
            
            // Update UI with user info
            this.updateUserUI();
            
        } catch (error) {
            Utils.hideLoading();
            console.error('Login error:', error);
            Utils.showToast('Login failed. Please try again.', 'error');
        }
    }

    async handleRegister() {
        const name = document.getElementById('register-name').value.trim();
        const mobile = document.getElementById('register-mobile').value.trim();
        const email = document.getElementById('register-email').value.trim();

        if (!name || !mobile || !email) {
            Utils.showToast('Please fill in all fields', 'error');
            return;
        }

        // Validate mobile number
        if (!/^\d{10}$/.test(mobile)) {
            Utils.showToast('Please enter a valid 10-digit mobile number', 'error');
            return;
        }

        // Validate email
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            Utils.showToast('Please enter a valid email address', 'error');
            return;
        }

        Utils.showLoading();

        try {
            // Check if user already exists
            const { data: existingUsers, error: checkError } = await supabase
                .from('users')
                .select('*')
                .or(`mobile.eq.${mobile},email.eq.${email}`);

            if (checkError) throw checkError;

            if (existingUsers && existingUsers.length > 0) {
                Utils.hideLoading();
                Utils.showToast('User with this mobile or email already exists', 'warning');
                this.switchAuthTab('login');
                return;
            }

            // Create new user
            const { data: user, error: createError } = await supabase
                .from('users')
                .insert([{ name, mobile, email }])
                .select()
                .single();

            if (createError) throw createError;

            // Auto-login after registration
            this.currentUser = user;
            localStorage.setItem('halalCoinUser', JSON.stringify(user));
            localStorage.setItem('halalCoinRememberMe', 'true');

            Utils.hideLoading();
            Utils.showToast('Registration successful!', 'success');
            this.showApp();
            
            // Update UI with user info
            this.updateUserUI();
            
        } catch (error) {
            Utils.hideLoading();
            console.error('Registration error:', error);
            Utils.showToast('Registration failed. Please try again.', 'error');
        }
    }

    handleLogout() {
        // Clear all storage
        localStorage.removeItem('halalCoinUser');
        localStorage.removeItem('halalCoinRememberMe');
        sessionStorage.removeItem('halalCoinUser');
        
        this.currentUser = null;
        
        // Reset forms
        document.getElementById('login-form')?.reset();
        document.getElementById('register-form')?.reset();
        
        Utils.showToast('Logged out successfully', 'info');
        this.showAuth();
    }

    showAuth() {
        document.getElementById('auth-screen').style.display = 'flex';
        document.getElementById('app-container').classList.add('hidden');
        document.getElementById('loading-screen').style.display = 'none';
    }

    showApp() {
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('app-container').classList.remove('hidden');
        
        // Show dashboard by default
        this.navigateToPage('dashboard');
        
        // Initialize other modules
        if (window.DashboardManager) {
            window.DashboardManager.init();
        }
    }

    updateUserUI() {
        if (!this.currentUser) return;

        // Update user name in dashboard
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = this.currentUser.name;
        }

        // Update profile page
        const profileName = document.getElementById('profile-name');
        const profileEmail = document.getElementById('profile-email');
        const profileMobile = document.getElementById('profile-mobile');
        const memberSince = document.getElementById('member-since');

        if (profileName) profileName.textContent = this.currentUser.name;
        if (profileEmail) profileEmail.textContent = this.currentUser.email;
        if (profileMobile) profileMobile.textContent = this.currentUser.mobile;
        
        if (memberSince && this.currentUser.created_at) {
            const joinDate = new Date(this.currentUser.created_at);
            memberSince.textContent = joinDate.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'long'
            });
        }
    }

    navigateToPage(pageName) {
        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.page === pageName);
        });

        // Show corresponding page
        document.querySelectorAll('.page').forEach(page => {
            page.classList.toggle('active', page.id === `${pageName}-page`);
        });

        // Initialize page-specific functionality
        switch (pageName) {
            case 'dashboard':
                if (window.DashboardManager) window.DashboardManager.loadData();
                break;
            case 'expenses':
                if (window.ExpenseManager) window.ExpenseManager.loadExpenses();
                break;
            case 'borrow-lend':
                if (window.BorrowLendManager) window.BorrowLendManager.loadTransactions();
                break;
            case 'profile':
                this.updateUserUI();
                break;
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getUserId() {
        return this.currentUser?.id;
    }
}

// Initialize Auth Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.AuthManager = new AuthManager();
});