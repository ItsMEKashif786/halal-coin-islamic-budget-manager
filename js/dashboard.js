// Dashboard Manager for Halal Coin

class DashboardManager {
    constructor() {
        this.expenseChart = null;
        this.trendChart = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateIslamicDate();
        
        // Load data when dashboard becomes active
        document.addEventListener('DOMContentLoaded', () => {
            if (window.AuthManager?.getCurrentUser()) {
                this.loadData();
            }
        });
    }

    setupEventListeners() {
        // Expense period filter
        const expensePeriod = document.getElementById('expense-period');
        if (expensePeriod) {
            expensePeriod.addEventListener('change', () => {
                this.loadExpenseChart();
            });
        }

        // Trend period filter
        const trendPeriod = document.getElementById('trend-period');
        if (trendPeriod) {
            trendPeriod.addEventListener('change', () => {
                this.loadTrendChart();
            });
        }

        // Navigation to expenses page
        const viewAllBtn = document.querySelector('[data-page="expenses"]');
        if (viewAllBtn) {
            viewAllBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.AuthManager) {
                    window.AuthManager.navigateToPage('expenses');
                }
            });
        }
    }

    async loadData() {
        if (!window.AuthManager?.getUserId()) {
            console.warn('No user logged in');
            return;
        }

        Utils.showLoading();

        try {
            await Promise.all([
                this.loadStats(),
                this.loadExpenseChart(),
                this.loadTrendChart(),
                this.loadRecentTransactions()
            ]);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            Utils.showToast('Failed to load dashboard data', 'error');
        } finally {
            Utils.hideLoading();
        }
    }

    async loadStats() {
        const userId = window.AuthManager.getUserId();
        if (!userId) return;

        try {
            // Get current month expenses
            const monthStart = Utils.getMonthStartDate();
            const today = Utils.getCurrentDate();

            // Total expenses this month
            const { data: expenses, error: expensesError } = await supabase
                .from('expenses')
                .select('amount')
                .eq('user_id', userId)
                .gte('date', monthStart)
                .lte('date', today);

            if (expensesError) throw expensesError;

            const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

            // Total lent
            const { data: lentTransactions, error: lentError } = await supabase
                .from('borrow_lend')
                .select('amount')
                .eq('user_id', userId)
                .eq('type', 'lent')
                .eq('status', 'pending');

            if (lentError) throw lentError;

            const totalLent = lentTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

            // Total borrowed
            const { data: borrowedTransactions, error: borrowedError } = await supabase
                .from('borrow_lend')
                .select('amount')
                .eq('user_id', userId)
                .eq('type', 'borrowed')
                .eq('status', 'pending');

            if (borrowedError) throw borrowedError;

            const totalBorrowed = borrowedTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);

            // Calculate net borrow and total balance
            const netBorrow = totalLent - totalBorrowed;
            const totalBalance = netBorrow - totalExpenses; // Simplified calculation

            // Update UI
            this.updateStat('total-balance', totalBalance);
            this.updateStat('total-expenses', totalExpenses);
            this.updateStat('total-lent', totalLent);
            this.updateStat('total-borrowed', totalBorrowed);
            this.updateStat('net-borrow', netBorrow);

            // Update profile stats
            const profileTotalExpenses = document.getElementById('profile-total-expenses');
            if (profileTotalExpenses) {
                profileTotalExpenses.textContent = Utils.formatCurrency(totalExpenses);
            }

            const profileTotalTransactions = document.getElementById('profile-total-transactions');
            if (profileTotalTransactions) {
                const totalTransactions = (lentTransactions?.length || 0) + (borrowedTransactions?.length || 0);
                profileTotalTransactions.textContent = totalTransactions;
            }

        } catch (error) {
            console.error('Error loading stats:', error);
            throw error;
        }
    }

    updateStat(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = Utils.formatCurrency(value);
        }
    }

    async loadExpenseChart() {
        const userId = window.AuthManager.getUserId();
        if (!userId) return;

        const period = document.getElementById('expense-period')?.value || 'month';
        let startDate;

        switch (period) {
            case 'week':
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                startDate = weekAgo.toISOString().split('T')[0];
                break;
            case 'year':
                const yearAgo = new Date();
                yearAgo.setFullYear(yearAgo.getFullYear() - 1);
                startDate = yearAgo.toISOString().split('T')[0];
                break;
            default: // month
                startDate = Utils.getMonthStartDate();
        }

        try {
            const { data: expenses, error } = await supabase
                .from('expenses')
                .select('category, amount')
                .eq('user_id', userId)
                .gte('date', startDate);

            if (error) throw error;

            // Group by category
            const categoryTotals = {};
            AppConfig.categories.forEach(category => {
                categoryTotals[category] = 0;
            });

            expenses.forEach(expense => {
                if (categoryTotals.hasOwnProperty(expense.category)) {
                    categoryTotals[expense.category] += parseFloat(expense.amount);
                }
            });

            // Filter out zero categories
            const labels = [];
            const data = [];
            const backgroundColors = [];

            Object.entries(categoryTotals).forEach(([category, total], index) => {
                if (total > 0) {
                    labels.push(category);
                    data.push(total);
                    backgroundColors.push(AppConfig.chartColors[index % AppConfig.chartColors.length]);
                }
            });

            // Create or update chart
            const ctx = document.getElementById('expense-chart');
            if (!ctx) return;

            if (this.expenseChart) {
                this.expenseChart.destroy();
            }

            this.expenseChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: backgroundColors,
                        borderColor: '#FFFFFF',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: (context) => {
                                    const value = context.raw;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                                    return `${context.label}: ${Utils.formatCurrency(value)} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });

        } catch (error) {
            console.error('Error loading expense chart:', error);
            throw error;
        }
    }

    async loadTrendChart() {
        const userId = window.AuthManager.getUserId();
        if (!userId) return;

        const months = parseInt(document.getElementById('trend-period')?.value || '6');
        
        try {
            // Get expenses for last N months
            const endDate = new Date();
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - months);

            const { data: expenses, error } = await supabase
                .from('expenses')
                .select('amount, date')
                .eq('user_id', userId)
                .gte('date', startDate.toISOString().split('T')[0])
                .lte('date', endDate.toISOString().split('T')[0])
                .order('date', { ascending: true });

            if (error) throw error;

            // Group by month
            const monthlyTotals = {};
            const monthLabels = [];
            
            // Initialize last N months
            for (let i = months - 1; i >= 0; i--) {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const monthKey = date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
                monthLabels.push(monthKey);
                monthlyTotals[monthKey] = 0;
            }

            // Sum expenses by month
            expenses.forEach(expense => {
                const date = new Date(expense.date);
                const monthKey = date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
                if (monthlyTotals.hasOwnProperty(monthKey)) {
                    monthlyTotals[monthKey] += parseFloat(expense.amount);
                }
            });

            const data = monthLabels.map(label => monthlyTotals[label]);

            // Create or update chart
            const ctx = document.getElementById('trend-chart');
            if (!ctx) return;

            if (this.trendChart) {
                this.trendChart.destroy();
            }

            this.trendChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: monthLabels,
                    datasets: [{
                        label: 'Monthly Expenses',
                        data: data,
                        borderColor: AppConfig.chartColors[0],
                        backgroundColor: `${AppConfig.chartColors[0]}20`,
                        borderWidth: 3,
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: (context) => {
                                    return `Expenses: ${Utils.formatCurrency(context.raw)}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: (value) => Utils.formatCurrency(value)
                            }
                        }
                    }
                }
            });

        } catch (error) {
            console.error('Error loading trend chart:', error);
            throw error;
        }
    }

    async loadRecentTransactions() {
        const userId = window.AuthManager.getUserId();
        if (!userId) return;

        try {
            // Get recent expenses
            const { data: expenses, error: expensesError } = await supabase
                .from('expenses')
                .select('*')
                .eq('user_id', userId)
                .order('date', { ascending: false })
                .limit(5);

            if (expensesError) throw expensesError;

            // Get recent borrow/lend transactions
            const { data: transactions, error: transactionsError } = await supabase
                .from('borrow_lend')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(5);

            if (transactionsError) throw transactionsError;

            // Combine and sort by date
            const allTransactions = [
                ...expenses.map(exp => ({
                    ...exp,
                    type: 'expense',
                    displayDate: Utils.formatDate(exp.date),
                    displayAmount: Utils.formatCurrency(exp.amount),
                    description: exp.description || exp.category
                })),
                ...transactions.map(trans => ({
                    ...trans,
                    type: 'borrow_lend',
                    displayDate: Utils.formatDate(trans.created_at),
                    displayAmount: Utils.formatCurrency(trans.amount),
                    description: `${trans.type === 'lent' ? 'Lent to' : 'Borrowed from'} ${trans.person_name}`
                }))
            ].sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at))
             .slice(0, 5);

            // Update UI
            this.renderRecentTransactions(allTransactions);

        } catch (error) {
            console.error('Error loading recent transactions:', error);
            throw error;
        }
    }

    renderRecentTransactions(transactions) {
        const container = document.getElementById('recent-transactions');
        if (!container) return;

        if (transactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exchange-alt"></i>
                    <p>No recent transactions</p>
                </div>
            `;
            return;
        }

        container.innerHTML = transactions.map(transaction => `
            <div class="transaction-item">
                <div class="transaction-info">
                    <h4>${transaction.description}</h4>
                    <p>${transaction.displayDate}</p>
                </div>
                <div class="transaction-amount ${transaction.type === 'expense' ? 'negative' : 'positive'}">
                    ${transaction.type === 'expense' ? '-' : '+'} ${transaction.displayAmount}
                </div>
            </div>
        `).join('');
    }

    updateIslamicDate() {
        const islamicDateElement = document.getElementById('islamic-date');
        const gregorianDateElement = document.getElementById('gregorian-date');
        
        if (islamicDateElement) {
            islamicDateElement.textContent = Utils.getIslamicDate();
        }
        
        if (gregorianDateElement) {
            const today = new Date();
            gregorianDateElement.textContent = today.toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    }
}

// Initialize Dashboard Manager
document.addEventListener('DOMContentLoaded', () => {
    window.DashboardManager = new DashboardManager();
});