// Expense Manager for Halal Coin

class ExpenseManager {
    constructor() {
        this.currentExpenseId = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        
        // Load expenses when expenses page becomes active
        document.addEventListener('DOMContentLoaded', () => {
            if (window.AuthManager?.getCurrentUser()) {
                // Check if we're on expenses page
                const expensesPage = document.getElementById('expenses-page');
                if (expensesPage && expensesPage.classList.contains('active')) {
                    this.loadExpenses();
                }
            }
        });
    }

    setupEventListeners() {
        // Add expense button
        const addExpenseBtn = document.getElementById('add-expense-btn');
        if (addExpenseBtn) {
            addExpenseBtn.addEventListener('click', () => {
                this.showExpenseModal();
            });
        }

        // Expense form submission
        const expenseForm = document.getElementById('expense-form');
        if (expenseForm) {
            expenseForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveExpense();
            });
        }

        // Modal close buttons
        document.querySelectorAll('.modal-close').forEach(button => {
            button.addEventListener('click', () => {
                this.hideExpenseModal();
            });
        });

        // Category filter
        const categoryFilter = document.getElementById('expense-category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                this.loadExpenses();
            });
        }

        // Date filter
        const dateFilter = document.getElementById('expense-date-filter');
        if (dateFilter) {
            dateFilter.addEventListener('change', () => {
                this.loadExpenses();
            });
        }

        // Close modal on outside click
        const expenseModal = document.getElementById('expense-modal');
        if (expenseModal) {
            expenseModal.addEventListener('click', (e) => {
                if (e.target === expenseModal) {
                    this.hideExpenseModal();
                }
            });
        }
    }

    showExpenseModal(expense = null) {
        const modal = document.getElementById('expense-modal');
        const form = document.getElementById('expense-form');
        const modalTitle = modal.querySelector('h3');
        
        if (expense) {
            // Edit mode
            modalTitle.textContent = 'Edit Expense';
            this.currentExpenseId = expense.id;
            
            document.getElementById('expense-amount').value = expense.amount;
            document.getElementById('expense-category').value = expense.category;
            document.getElementById('expense-description').value = expense.description || '';
            document.getElementById('expense-date').value = expense.date;
        } else {
            // Add mode
            modalTitle.textContent = 'Add New Expense';
            this.currentExpenseId = null;
            form.reset();
            document.getElementById('expense-date').value = Utils.getCurrentDate();
        }
        
        modal.classList.remove('hidden');
    }

    hideExpenseModal() {
        const modal = document.getElementById('expense-modal');
        modal.classList.add('hidden');
        this.currentExpenseId = null;
        
        const form = document.getElementById('expense-form');
        form.reset();
    }

    async saveExpense() {
        const userId = window.AuthManager.getUserId();
        if (!userId) {
            Utils.showToast('Please login first', 'error');
            return;
        }

        const amount = parseFloat(document.getElementById('expense-amount').value);
        const category = document.getElementById('expense-category').value;
        const description = document.getElementById('expense-description').value.trim();
        const date = document.getElementById('expense-date').value;

        // Validation
        if (!amount || amount <= 0) {
            Utils.showToast('Please enter a valid amount', 'error');
            return;
        }

        if (!category) {
            Utils.showToast('Please select a category', 'error');
            return;
        }

        if (!date) {
            Utils.showToast('Please select a date', 'error');
            return;
        }

        Utils.showLoading();

        try {
            const expenseData = {
                user_id: userId,
                amount: amount,
                category: category,
                description: description || null,
                date: date
            };

            let result;

            if (this.currentExpenseId) {
                // Update existing expense
                const { data, error } = await supabase
                    .from('expenses')
                    .update(expenseData)
                    .eq('id', this.currentExpenseId)
                    .select();

                if (error) throw error;
                result = data?.[0];
                Utils.showToast('Expense updated successfully', 'success');
            } else {
                // Create new expense
                const { data, error } = await supabase
                    .from('expenses')
                    .insert([expenseData])
                    .select();

                if (error) throw error;
                result = data?.[0];
                Utils.showToast('Expense added successfully', 'success');
            }

            // Refresh data
            this.loadExpenses();
            
            // Update dashboard if it's active
            if (window.DashboardManager && document.getElementById('dashboard-page').classList.contains('active')) {
                window.DashboardManager.loadData();
            }

            this.hideExpenseModal();

        } catch (error) {
            console.error('Error saving expense:', error);
            Utils.showToast('Failed to save expense', 'error');
        } finally {
            Utils.hideLoading();
        }
    }

    async loadExpenses() {
        const userId = window.AuthManager.getUserId();
        if (!userId) {
            console.warn('No user logged in');
            return;
        }

        Utils.showLoading();

        try {
            let query = supabase
                .from('expenses')
                .select('*')
                .eq('user_id', userId)
                .order('date', { ascending: false });

            // Apply filters
            const categoryFilter = document.getElementById('expense-category-filter')?.value;
            const dateFilter = document.getElementById('expense-date-filter')?.value;

            if (categoryFilter) {
                query = query.eq('category', categoryFilter);
            }

            if (dateFilter) {
                query = query.eq('date', dateFilter);
            }

            const { data: expenses, error } = await query;

            if (error) throw error;

            this.renderExpenses(expenses || []);

        } catch (error) {
            console.error('Error loading expenses:', error);
            Utils.showToast('Failed to load expenses', 'error');
        } finally {
            Utils.hideLoading();
        }
    }

    renderExpenses(expenses) {
        const tbody = document.getElementById('expenses-table-body');
        if (!tbody) return;

        if (expenses.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-table">
                        <i class="fas fa-receipt"></i>
                        <p>No expenses recorded yet</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = expenses.map(expense => `
            <tr>
                <td>${Utils.formatDate(expense.date)}</td>
                <td>
                    <span class="category-badge" style="background-color: ${this.getCategoryColor(expense.category)}">
                        ${expense.category}
                    </span>
                </td>
                <td>${expense.description || '-'}</td>
                <td class="amount-cell">${Utils.formatCurrency(expense.amount)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon edit-expense" data-id="${expense.id}" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete-expense" data-id="${expense.id}" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        // Add event listeners to action buttons
        tbody.querySelectorAll('.edit-expense').forEach(button => {
            button.addEventListener('click', async (e) => {
                const expenseId = e.currentTarget.dataset.id;
                await this.editExpense(expenseId);
            });
        });

        tbody.querySelectorAll('.delete-expense').forEach(button => {
            button.addEventListener('click', async (e) => {
                const expenseId = e.currentTarget.dataset.id;
                await this.deleteExpense(expenseId);
            });
        });
    }

    getCategoryColor(category) {
        const categoryIndex = AppConfig.categories.indexOf(category);
        if (categoryIndex >= 0) {
            return `${AppConfig.chartColors[categoryIndex % AppConfig.chartColors.length]}40`;
        }
        return '#F0F0F0';
    }

    async editExpense(expenseId) {
        Utils.showLoading();

        try {
            const { data: expense, error } = await supabase
                .from('expenses')
                .select('*')
                .eq('id', expenseId)
                .single();

            if (error) throw error;

            this.showExpenseModal(expense);

        } catch (error) {
            console.error('Error loading expense for edit:', error);
            Utils.showToast('Failed to load expense', 'error');
        } finally {
            Utils.hideLoading();
        }
    }

    async deleteExpense(expenseId) {
        if (!confirm('Are you sure you want to delete this expense?')) {
            return;
        }

        Utils.showLoading();

        try {
            const { error } = await supabase
                .from('expenses')
                .delete()
                .eq('id', expenseId);

            if (error) throw error;

            Utils.showToast('Expense deleted successfully', 'success');
            
            // Refresh data
            this.loadExpenses();
            
            // Update dashboard if it's active
            if (window.DashboardManager && document.getElementById('dashboard-page').classList.contains('active')) {
                window.DashboardManager.loadData();
            }

        } catch (error) {
            console.error('Error deleting expense:', error);
            Utils.showToast('Failed to delete expense', 'error');
        } finally {
            Utils.hideLoading();
        }
    }

    // Get total expenses for a specific period
    async getTotalExpenses(startDate, endDate = Utils.getCurrentDate()) {
        const userId = window.AuthManager.getUserId();
        if (!userId) return 0;

        try {
            const { data: expenses, error } = await supabase
                .from('expenses')
                .select('amount')
                .eq('user_id', userId)
                .gte('date', startDate)
                .lte('date', endDate);

            if (error) throw error;

            return expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

        } catch (error) {
            console.error('Error getting total expenses:', error);
            return 0;
        }
    }

    // Get expenses by category for a specific period
    async getExpensesByCategory(startDate, endDate = Utils.getCurrentDate()) {
        const userId = window.AuthManager.getUserId();
        if (!userId) return {};

        try {
            const { data: expenses, error } = await supabase
                .from('expenses')
                .select('category, amount')
                .eq('user_id', userId)
                .gte('date', startDate)
                .lte('date', endDate);

            if (error) throw error;

            const categoryTotals = {};
            AppConfig.categories.forEach(category => {
                categoryTotals[category] = 0;
            });

            expenses.forEach(expense => {
                if (categoryTotals.hasOwnProperty(expense.category)) {
                    categoryTotals[expense.category] += parseFloat(expense.amount);
                }
            });

            return categoryTotals;

        } catch (error) {
            console.error('Error getting expenses by category:', error);
            return {};
        }
    }
}

// Initialize Expense Manager
document.addEventListener('DOMContentLoaded', () => {
    window.ExpenseManager = new ExpenseManager();
    
    // Add CSS for action buttons and category badges
    const style = document.createElement('style');
    style.textContent = `
        .category-badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 500;
            color: var(--primary-color);
        }
        
        .amount-cell {
            font-weight: 600;
            color: var(--primary-color);
        }
        
        .action-buttons {
            display: flex;
            gap: 0.5rem;
        }
        
        .btn-icon {
            background: none;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            padding: 0.5rem;
            border-radius: 4px;
            transition: var(--transition);
        }
        
        .btn-icon:hover {
            background: var(--background-color);
            color: var(--primary-color);
        }
        
        .btn-icon.edit-expense:hover {
            color: var(--info-color);
        }
        
        .btn-icon.delete-expense:hover {
            color: var(--danger-color);
        }
    `;
    document.head.appendChild(style);
});