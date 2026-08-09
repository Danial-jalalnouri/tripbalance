// Trip Balance - Expense Tracker
// Main Application JavaScript

// ============================================================
// Data Layer - Firestore Integration
// ============================================================

const DataStore = {
    // Firestore collection references
    tripRef: null,
    expensesRef: null,
    currentTripId: null,

    // Initialize Firestore references
    init() {
        this.tripRef = db.collection('trips').doc('current');
        this.expensesRef = db.collection('expenses');
    },

    // Get trip details
    async getTrip() {
        try {
            const doc = await this.tripRef.get();
            if (doc.exists) {
                this.currentTripId = doc.id;
                return doc.data();
            }
            return {
                name: '',
                startDate: '',
                endDate: '',
                currency: 'USD'
            };
        } catch (error) {
            console.error('Error getting trip:', error);
            return {
                name: '',
                startDate: '',
                endDate: '',
                currency: 'USD'
            };
        }
    },

    // Save trip details
    async saveTrip(trip) {
        try {
            await this.tripRef.set(trip);
            return true;
        } catch (error) {
            console.error('Error saving trip:', error);
            return false;
        }
    },

    // Get all expenses
    async getExpenses() {
        try {
            const snapshot = await this.expensesRef.orderBy('date', 'desc').get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting expenses:', error);
            return [];
        }
    },

    // Add a new expense
    async addExpense(expense) {
        try {
            const docRef = await this.expensesRef.add(expense);
            return {
                id: docRef.id,
                ...expense
            };
        } catch (error) {
            console.error('Error adding expense:', error);
            return null;
        }
    },

    // Update an expense
    async updateExpense(id, updates) {
        try {
            await this.expensesRef.doc(id).update(updates);
            return {
                id,
                ...updates
            };
        } catch (error) {
            console.error('Error updating expense:', error);
            return null;
        }
    },

    // Delete an expense
    async deleteExpense(id) {
        try {
            await this.expensesRef.doc(id).delete();
            return true;
        } catch (error) {
            console.error('Error deleting expense:', error);
            return false;
        }
    },

    // Clear all expenses
    async clearAllExpenses() {
        try {
            const snapshot = await this.expensesRef.get();
            const batch = db.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            return true;
        } catch (error) {
            console.error('Error clearing expenses:', error);
            return false;
        }
    }
};

// ============================================================
// Currency Utilities
// ============================================================

const CurrencyUtils = {
    symbols: {
        USD: '$',
        EUR: '€',
        GBP: '£',
        JPY: '¥',
        CAD: 'C$',
        AUD: 'A$',
        CHF: 'CHF ',
        CNY: '¥',
        INR: '₹',
        MYR: 'RM'
    },

    format(amount, currency) {
        const symbol = this.symbols[currency] || currency + ' ';
        return `${symbol}${parseFloat(amount).toFixed(2)}`;
    }
};

// ============================================================
// Category Utilities
// ============================================================

const CategoryUtils = {
    categories: {
        food: { name: 'Food & Dining', icon: '🍽️', color: '#fbbf24' },
        transport: { name: 'Transport', icon: '🚗', color: '#3b82f6' },
        accommodation: { name: 'Accommodation', icon: '🏨', color: '#8b5cf6' },
        activities: { name: 'Activities', icon: '🎯', color: '#22c55e' },
        shopping: { name: 'Shopping', icon: '🛍️', color: '#ec4899' },
        other: { name: 'Other', icon: '📦', color: '#6b7280' }
    },

    getCategoryInfo(category) {
        return this.categories[category] || this.categories.other;
    },

    getCategoryName(category) {
        return this.getCategoryInfo(category).name;
    },

    getCategoryIcon(category) {
        return this.getCategoryInfo(category).icon;
    }
};

// ============================================================
// UI Controller
// ============================================================

const UI = {
    // DOM Elements
    elements: {
        tripName: document.getElementById('tripName'),
        startDate: document.getElementById('startDate'),
        endDate: document.getElementById('endDate'),
        tripCurrency: document.getElementById('tripCurrency'),
        saveTrip: document.getElementById('saveTrip'),
        expenseForm: document.getElementById('expenseForm'),
        expenseDescription: document.getElementById('expenseDescription'),
        expenseAmount: document.getElementById('expenseAmount'),
        expenseCategory: document.getElementById('expenseCategory'),
        expenseDate: document.getElementById('expenseDate'),
        expensesList: document.getElementById('expensesList'),
        filterCategory: document.getElementById('filterCategory'),
        totalExpenses: document.getElementById('totalExpenses'),
        expenseCount: document.getElementById('expenseCount'),
        avgExpense: document.getElementById('avgExpense'),
        categoryBreakdown: document.getElementById('categoryBreakdown'),
        exportCSV: document.getElementById('exportCSV'),
        clearAll: document.getElementById('clearAll')
    },

    // Current trip data
    currentTrip: null,

    // Initialize UI
    async init() {
        DataStore.init();
        await this.loadTripDetails();
        await this.loadExpenses();
        this.setDefaultDate();
        this.bindEvents();
    },

    // Load trip details from Firestore
    async loadTripDetails() {
        this.currentTrip = await DataStore.getTrip();
        this.elements.tripName.value = this.currentTrip.name;
        this.elements.startDate.value = this.currentTrip.startDate;
        this.elements.endDate.value = this.currentTrip.endDate;
        this.elements.tripCurrency.value = this.currentTrip.currency;
    },

    // Set default date for new expenses
    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        this.elements.expenseDate.value = today;
    },

    // Bind event listeners
    bindEvents() {
        // Trip details save button
        this.elements.saveTrip.addEventListener('click', () => this.saveTripDetails());

        // Expense form submission
        this.elements.expenseForm.addEventListener('submit', (e) => this.handleAddExpense(e));

        // Filter changes
        this.elements.filterCategory.addEventListener('change', () => this.loadExpenses());

        // Action buttons
        this.elements.exportCSV.addEventListener('click', () => this.exportToCSV());
        this.elements.clearAll.addEventListener('click', () => this.clearAllExpenses());
    },

    // Save trip details to Firestore
    async saveTripDetails() {
        const trip = {
            name: this.elements.tripName.value,
            startDate: this.elements.startDate.value,
            endDate: this.elements.endDate.value,
            currency: this.elements.tripCurrency.value
        };

        const success = await DataStore.saveTrip(trip);
        if (success) {
            this.currentTrip = trip;
            this.showNotification('Trip details saved!', 'success');
        } else {
            this.showNotification('Error saving trip details', 'error');
        }
    },

    // Handle adding new expense
    async handleAddExpense(e) {
        e.preventDefault();

        const expense = {
            description: this.elements.expenseDescription.value.trim(),
            amount: parseFloat(this.elements.expenseAmount.value),
            category: this.elements.expenseCategory.value,
            date: this.elements.expenseDate.value,
            currency: this.currentTrip.currency
        };

        const newExpense = await DataStore.addExpense(expense);

        if (newExpense) {
            // Reset form
            this.elements.expenseForm.reset();
            this.setDefaultDate();

            // Reload expenses
            await this.loadExpenses();

            // Show success feedback
            this.showNotification('Expense added successfully!', 'success');
        } else {
            this.showNotification('Error adding expense', 'error');
        }
    },

    // Load and display expenses
    async loadExpenses() {
        let expenses = await DataStore.getExpenses();

        // Apply category filter
        const categoryFilter = this.elements.filterCategory.value;

        if (categoryFilter !== 'all') {
            expenses = expenses.filter(e => e.category === categoryFilter);
        }

        // Sort by date (newest first)
        expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Render expenses
        this.renderExpenses(expenses);

        // Update summary with all expenses (not filtered)
        const allExpenses = await DataStore.getExpenses();
        this.updateSummary(allExpenses);
    },

    // Render expenses list
    renderExpenses(expenses) {
        if (expenses.length === 0) {
            this.elements.expensesList.innerHTML = `
                <p class="no-expenses">No expenses added yet. Start tracking your trip!</p>
            `;
            return;
        }

        const html = expenses.map(expense => {
            const categoryInfo = CategoryUtils.getCategoryInfo(expense.category);
            const formattedAmount = CurrencyUtils.format(expense.amount, expense.currency);
            const formattedDate = new Date(expense.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });

            return `
                <div class="expense-item" data-id="${expense.id}">
                    <div class="expense-details">
                        <div class="expense-description">${this.escapeHtml(expense.description)}</div>
                        <div class="expense-meta">
                            <span>${categoryInfo.icon} ${categoryInfo.name}</span>
                            <span>${formattedDate}</span>
                        </div>
                    </div>
                    <div class="expense-amount">${formattedAmount}</div>
                    <div class="expense-actions">
                        <button onclick="UI.deleteExpense('${expense.id}')" title="Delete expense">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        this.elements.expensesList.innerHTML = html;
    },

    // Delete expense
    async deleteExpense(id) {
        if (confirm('Are you sure you want to delete this expense?')) {
            const success = await DataStore.deleteExpense(id);
            if (success) {
                await this.loadExpenses();
                this.showNotification('Expense deleted', 'info');
            } else {
                this.showNotification('Error deleting expense', 'error');
            }
        }
    },

    // Update summary statistics
    updateSummary(expenses) {
        const total = expenses.reduce((sum, e) => sum + e.amount, 0);
        const count = expenses.length;
        const avg = count > 0 ? total / count : 0;

        // Group by category
        const byCategory = {};
        expenses.forEach(expense => {
            if (!byCategory[expense.category]) {
                byCategory[expense.category] = 0;
            }
            byCategory[expense.category] += expense.amount;
        });

        // Update DOM
        const currency = this.currentTrip ? this.currentTrip.currency : 'USD';
        this.elements.totalExpenses.textContent = CurrencyUtils.format(total, currency);
        this.elements.expenseCount.textContent = count;
        this.elements.avgExpense.textContent = CurrencyUtils.format(avg, currency);

        // Render category breakdown
        this.renderCategoryBreakdown(byCategory);
    },

    // Render category breakdown
    renderCategoryBreakdown(byCategory) {
        const categories = Object.keys(byCategory);
        const currency = this.currentTrip ? this.currentTrip.currency : 'USD';

        if (categories.length === 0) {
            this.elements.categoryBreakdown.innerHTML = '<p class="no-expenses">No expenses yet</p>';
            return;
        }

        // Sort by amount (highest first)
        categories.sort((a, b) => byCategory[b] - byCategory[a]);

        const html = categories.map(category => {
            const info = CategoryUtils.getCategoryInfo(category);
            const amount = byCategory[category];

            return `
                <div class="category-item">
                    <span class="category-name">
                        <span class="category-icon category-${category}"></span>
                        ${info.icon} ${info.name}
                    </span>
                    <span class="category-amount">${CurrencyUtils.format(amount, currency)}</span>
                </div>
            `;
        }).join('');

        this.elements.categoryBreakdown.innerHTML = html;
    },

    // Export to CSV
    async exportToCSV() {
        const expenses = await DataStore.getExpenses();

        if (expenses.length === 0) {
            this.showNotification('No expenses to export', 'info');
            return;
        }

        // CSV headers
        const headers = ['Date', 'Description', 'Category', 'Amount', 'Currency'];

        // CSV rows
        const rows = expenses.map(e => [
            e.date,
            `"${e.description.replace(/"/g, '""')}"`,
            CategoryUtils.getCategoryName(e.category),
            e.amount,
            e.currency
        ]);

        // Create CSV content
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Create download link
        const blob = new Blob([csvContent], {
            type: 'text/csv;charset=utf-8;'
        });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `trip_balance_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showNotification('Expenses exported to CSV', 'success');
    },

    // Clear all expenses
    async clearAllExpenses() {
        if (confirm('Are you sure you want to delete ALL expenses? This action cannot be undone.')) {
            const success = await DataStore.clearAllExpenses();
            if (success) {
                await this.loadExpenses();
                this.showNotification('All expenses cleared', 'info');
            } else {
                this.showNotification('Error clearing expenses', 'error');
            }
        }
    },

    // Show notification
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Style the notification
        notification.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            padding: 1rem 2rem;
            border-radius: 12px;
            color: white;
            font-weight: 600;
            font-size: 0.95rem;
            z-index: 1000;
            animation: slideIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            background-color: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            setTimeout(() => notification.remove(), 400);
        }, 3000);
    },

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// ============================================================
// Initialize Application
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    UI.init();
});
