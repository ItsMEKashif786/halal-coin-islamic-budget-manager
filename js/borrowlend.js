// Borrow/Lend Manager for Halal Coin

class BorrowLendManager {
    constructor() {
        this.currentTransactionId = null;
        this.currentType = 'lent'; // 'lent' or 'borrowed'
        this.init();
    }

    init() {
        this.setupEventListeners();
        
        // Load transactions when borrow-lend page becomes active
        document.addEventListener('DOMContentLoaded', () => {
            if (window.AuthManager?.getCurrentUser()) {
                // Check if we're on borrow-lend page
                const borrowLendPage = document.getElementById('borrow-lend-page');
                if (borrowLendPage && borrowLendPage.classList.contains('active')) {
                    this.loadTransactions();
                }
            }
        });
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.bl-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                this.switchTab(type);
            });
        });

        // Add transaction button
        const addTransactionBtn = document.getElementById('add-transaction-btn');
        if (addTransactionBtn) {
            addTransactionBtn.addEventListener('click', () => {
                this.showTransactionModal();
            });
        }

        // Transaction form submission
        const transactionForm = document.getElementById('transaction-form');
        if (transactionForm) {
            transactionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveTransaction();
            });
        }

        // Transaction modal close buttons
        const transactionModal = document.getElementById('transaction-modal');
        if (transactionModal) {
            transactionModal.querySelectorAll('.modal-close').forEach(button => {
                button.addEventListener('click', () => {
                    this.hideTransactionModal();
                });
            });

            // Close modal on outside click
            transactionModal.addEventListener('click', (e) => {
                if (e.target === transactionModal) {
                    this.hideTransactionModal();
                }
            });
        }

        // Transaction type change
        const transactionTypeSelect = document.getElementById('transaction-type');
        if (transactionTypeSelect) {
            transactionTypeSelect.addEventListener('change', (e) => {
                this.currentType = e.target.value;
            });
        }
    }

    switchTab(type) {
        this.currentType = type;
        
        // Update active tab
        document.querySelectorAll('.bl-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.type === type);
        });
        
        // Reload transactions for selected type
        this.loadTransactions();
    }

    showTransactionModal(transaction = null) {
        const modal = document.getElementById('transaction-modal');
        const form = document.getElementById('transaction-form');
        const modalTitle = modal.querySelector('h3');
        
        if (transaction) {
            // Edit mode
            modalTitle.textContent = 'Edit Transaction';
            this.currentTransactionId = transaction.id;
            this.currentType = transaction.type;
            
            document.getElementById('transaction-type').value = transaction.type;
            document.getElementById('transaction-person').value = transaction.person_name;
            document.getElementById('transaction-amount').value = transaction.amount;
            document.getElementById('transaction-due-date').value = transaction.due_date || '';
            document.getElementById('transaction-status').value = transaction.status || 'pending';
            document.getElementById('transaction-notes').value = transaction.notes || '';
        } else {
            // Add mode
            modalTitle.textContent = 'Add Transaction';
            this.currentTransactionId = null;
            form.reset();
            document.getElementById('transaction-type').value = this.currentType;
            document.getElementById('transaction-status').value = 'pending';
            document.getElementById('transaction-due-date').value = '';
        }
        
        modal.classList.remove('hidden');
    }

    hideTransactionModal() {
        const modal = document.getElementById('transaction-modal');
        modal.classList.add('hidden');
        this.currentTransactionId = null;
        
        const form = document.getElementById('transaction-form');
        form.reset();
    }

    async saveTransaction() {
        const userId = window.AuthManager.getUserId();
        if (!userId) {
            if (window.Utils && window.Utils.showToast) {
                window.Utils.showToast('Please login first', 'error');
            } else {
                alert('Please login first');
            }
            return;
        }

        const type = document.getElementById('transaction-type').value;
        const personName = document.getElementById('transaction-person').value.trim();
        const amount = parseFloat(document.getElementById('transaction-amount').value);
        const dueDate = document.getElementById('transaction-due-date').value || null;
        const status = document.getElementById('transaction-status').value;
        const notes = document.getElementById('transaction-notes').value.trim();

        // Validation
        if (!personName) {
            if (window.Utils && window.Utils.showToast) {
                window.Utils.showToast('Please enter person name', 'error');
            } else {
                alert('Please enter person name');
            }
            return;
        }

        if (!amount || amount <= 0) {
            if (window.Utils && window.Utils.showToast) {
                window.Utils.showToast('Please enter a valid amount', 'error');
            } else {
                alert('Please enter a valid amount');
            }
            return;
        }

        // Validate due date if provided
        if (dueDate) {
            const due = new Date(dueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // Auto-update status if due date is in past
            let finalStatus = status;
            if (due < today && status === 'pending') {
                finalStatus = 'overdue';
            }
        }

        if (window.Utils && window.Utils.showLoading) {
            window.Utils.showLoading();
        }

        try {
            const transactionData = {
                user_id: userId,
                type: type,
                person_name: personName,
                amount: amount,
                due_date: dueDate,
                status: status,
                notes: notes || null
            };

            let result;

            if (this.currentTransactionId) {
                // Update existing transaction
                const { data, error } = await supabase
                    .from('borrow_lend')
                    .update(transactionData)
                    .eq('id', this.currentTransactionId)
                    .select();

                if (error) throw error;
                result = data?.[0];
                if (window.Utils && window.Utils.showToast) {
                    window.Utils.showToast('Transaction updated successfully', 'success');
                } else {
                    alert('Transaction updated successfully');
                }
            } else {
                // Create new transaction
                const { data, error } = await supabase
                    .from('borrow_lend')
                    .insert([transactionData])
                    .select();

                if (error) throw error;
                result = data?.[0];
                if (window.Utils && window.Utils.showToast) {
                    window.Utils.showToast('Transaction added successfully', 'success');
                } else {
                    alert('Transaction added successfully');
                }
            }

            // Refresh data
            this.loadTransactions();
            
            // Update dashboard if it's active
            if (window.DashboardManager && document.getElementById('dashboard-page').classList.contains('active')) {
                window.DashboardManager.loadData();
            }

            this.hideTransactionModal();

        } catch (error) {
            console.error('Error saving transaction:', error);
            if (window.Utils && window.Utils.showToast) {
                window.Utils.showToast('Failed to save transaction', 'error');
            } else {
                alert('Failed to save transaction');
            }
        } finally {
            if (window.Utils && window.Utils.hideLoading) {
                window.Utils.hideLoading();
            }
        }
    }

    async loadTransactions() {
        const userId = window.AuthManager.getUserId();
        if (!userId) {
            console.warn('No user logged in');
            return;
        }

        if (window.Utils && window.Utils.showLoading) {
            window.Utils.showLoading();
        }

        try {
            const { data: transactions, error } = await supabase
                .from('borrow_lend')
                .select('*')
                .eq('user_id', userId)
                .eq('type', this.currentType)
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.renderTransactions(transactions || []);

        } catch (error) {
            console.error('Error loading transactions:', error);
            if (window.Utils && window.Utils.showToast) {
                window.Utils.showToast('Failed to load transactions', 'error');
            } else {
                alert('Failed to load transactions');
            }
        } finally {
            if (window.Utils && window.Utils.hideLoading) {
                window.Utils.hideLoading();
            }
        }
    }

    renderTransactions(transactions) {
        const tbody = document.getElementById('transactions-table-body');
        if (!tbody) return;

        if (transactions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="empty-table">
                        <i class="fas fa-handshake"></i>
                        <p>No ${this.currentType} transactions recorded yet</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = transactions.map(transaction => `
            <tr>
                <td>${transaction.person_name}</td>
                <td>
                    <span class="type-badge ${transaction.type}">
                        ${transaction.type === 'lent' ? 'Lent' : 'Borrowed'}
                    </span>
                </td>
                <td class="amount-cell ${transaction.type === 'lent' ? 'positive' : 'negative'}">
                    ${window.Utils ? window.Utils.formatCurrency(transaction.amount) : `$${parseFloat(transaction.amount).toFixed(2)}`}
                </td>
                <td>${transaction.due_date ? (window.Utils ? window.Utils.formatDate(transaction.due_date) : new Date(transaction.due_date).toLocaleDateString('en-IN')) : '-'}</td>
                <td>
                    <span class="status-badge ${transaction.status}">
                        ${this.getStatusLabel(transaction.status)}
                    </span>
                </td>
                <td>${transaction.notes || '-'}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon edit-transaction" data-id="${transaction.id}" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete-transaction" data-id="${transaction.id}" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                        ${transaction.status === 'pending' ? `
                            <button class="btn-icon mark-paid" data-id="${transaction.id}" title="Mark as Paid">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');

        // Add event listeners to action buttons
        tbody.querySelectorAll('.edit-transaction').forEach(button => {
            button.addEventListener('click', async (e) => {
                const transactionId = e.currentTarget.dataset.id;
                await this.editTransaction(transactionId);
            });
        });

        tbody.querySelectorAll('.delete-transaction').forEach(button => {
            button.addEventListener('click', async (e) => {
                const transactionId = e.currentTarget.dataset.id;
                await this.deleteTransaction(transactionId);
            });
        });

        tbody.querySelectorAll('.mark-paid').forEach(button => {
            button.addEventListener('click', async (e) => {
                const transactionId = e.currentTarget.dataset.id;
                await this.markAsPaid(transactionId);
            });
        });
    }

    getStatusLabel(status) {
        const statusLabels = {
            'pending': 'Pending',
            'paid': 'Paid',
            'overdue': 'Overdue'
        };
        return statusLabels[status] || status;
    }

    async editTransaction(transactionId) {
        if (window.Utils && window.Utils.showLoading) {
            window.Utils.showLoading();
        }

        try {
            const { data: transaction, error } = await supabase
                .from('borrow_lend')
                .select('*')
                .eq('id', transactionId)
                .single();

            if (error) throw error;

            this.showTransactionModal(transaction);

        } catch (error) {
            console.error('Error loading transaction for edit:', error);
            if (window.Utils && window.Utils.showToast) {
                window.Utils.showToast('Failed to load transaction', 'error');
            } else {
                alert('Failed to load transaction');
            }
        } finally {
            if (window.Utils && window.Utils.hideLoading) {
                window.Utils.hideLoading();
            }
        }
    }

    async deleteTransaction(transactionId) {
        if (!confirm('Are you sure you want to delete this transaction?')) {
            return;
        }

        if (window.Utils && window.Utils.showLoading) {
            window.Utils.showLoading();
        }

        try {
            const { error } = await supabase
                .from('borrow_lend')
                .delete()
                .eq('id', transactionId);

            if (error) throw error;

            if (window.Utils && window.Utils.showToast) {
                window.Utils.showToast('Transaction deleted successfully', 'success');
            } else {
                alert('Transaction deleted successfully');
            }
            
            // Refresh data
            this.loadTransactions();
            
            // Update dashboard if it's active
            if (window.DashboardManager && document.getElementById('dashboard-page').classList.contains('active')) {
                window.DashboardManager.loadData();
            }

        } catch (error) {
            console.error('Error deleting transaction:', error);
            if (window.Utils && window.Utils.showToast) {
                window.Utils.showToast('Failed to delete transaction', 'error');
            } else {
                alert('Failed to delete transaction');
            }
        } finally {
            if (window.Utils && window.Utils.hideLoading) {
                window.Utils.hideLoading();
            }
        }
    }

    async markAsPaid(transactionId) {
        if (window.Utils && window.Utils.showLoading) {
            window.Utils.showLoading();
        }

        try {
            const { error } = await supabase
                .from('borrow_lend')
                .update({ status: 'paid' })
                .eq('id', transactionId);

            if (error) throw error;

            if (window.Utils && window.Utils.showToast) {
                window.Utils.showToast('Transaction marked as paid', 'success');
            } else {
                alert('Transaction marked as paid');
            }
            
            // Refresh data
            this.loadTransactions();
            
            // Update dashboard if it's active
            if (window.DashboardManager && document.getElementById('dashboard-page').classList.contains('active')) {
                window.DashboardManager.loadData();
            }

        } catch (error) {
            console.error('Error marking transaction as paid:', error);
            if (window.Utils && window.Utils.showToast) {
                window.Utils.showToast('Failed to update transaction', 'error');
            } else {
                alert('Failed to update transaction');
            }
        } finally {
            if (window.Utils && window.Utils.hideLoading) {
                window.Utils.hideLoading();
            }
        }
    }

    // Get total lent/borrowed amounts
    async getTotals() {
        const userId = window.AuthManager.getUserId();
        if (!userId) return { lent: 0, borrowed: 0 };

        try {
            // Get total lent
            const { data: lentData, error: lentError } = await supabase
                .from('borrow_lend')
                .select('amount')
                .eq('user_id', userId)
                .eq('type', 'lent')
                .eq('status', 'pending');

            if (lentError) throw lentError;

            // Get total borrowed
            const { data: borrowedData, error: borrowedError } = await supabase
                .from('borrow_lend')
                .select('amount')
                .eq('user_id', userId)
                .eq('type', 'borrowed')
                .eq('status', 'pending');

            if (borrowedError) throw borrowedError;

            const totalLent = lentData.reduce((sum, t) => sum + parseFloat(t.amount), 0);
            const totalBorrowed = borrowedData.reduce((sum, t) => sum + parseFloat(t.amount), 0);

            return {
                lent: totalLent,
                borrowed: totalBorrowed,
                net: totalLent - totalBorrowed
            };

        } catch (error) {
            console.error('Error getting transaction totals:', error);
            return { lent: 0, borrowed: 0, net: 0 };
        }
    }

    // Get overdue transactions
    async getOverdueTransactions() {
        const userId = window.AuthManager.getUserId();
        if (!userId) return [];

        try {
            const today = Utils.getCurrentDate();
            
            const { data: transactions, error } = await supabase
                .from('borrow_lend')
                .select('*')
                .eq('user_id', userId)
                .eq('status', 'pending')
                .lt('due_date', today)
                .order('due_date', { ascending: true });

            if (error) throw error;

            return transactions || [];

        } catch (error) {
            console.error('Error getting overdue transactions:', error);
            return [];
        }
    }
}

// Initialize Borrow/Lend Manager
document.addEventListener('DOMContentLoaded', () => {
    window.BorrowLendManager = new BorrowLendManager();
    
    // Add CSS for transaction badges
    const style = document.createElement('style');
    style.textContent = `
        .type-badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 500;
        }
        
        .type-badge.lent {
            background-color: rgba(40, 167, 69, 0.2);
            color: var(--success-color);
        }
        
        .type-badge.borrowed {
            background-color: rgba(220, 53, 69, 0.2);
            color: var(--danger-color);
        }
        
        .status-badge {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 500;
        }
        
        .status-badge.pending {
            background-color: rgba(255, 193, 7, 0.2);
            color: var(--warning-color);
        }
        
        .status-badge.paid {
            background-color: rgba(40, 167, 69, 0.2);
            color: var(--success-color);
        }
        
        .status-badge.overdue {
            background-color: rgba(220, 53, 69, 0.2);
            color: var(--danger-color);
        }
        
        .amount-cell.positive {
            color: var(--success-color);
            font-weight: 600;
        }
        
        .amount-cell.negative {
            color: var(--danger-color);
            font-weight: 600;
        }
        
        .btn-icon.mark-paid:hover {
            color: var(--success-color);
        }
    `;
    document.head.appendChild(style);
});