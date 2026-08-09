// Trip Balance - Expense Tracker
// Main Application JavaScript

// ============================================================
// Data Layer - Easily swappable for Firestore/Firebase
// ============================================================

const DataStore = {
    // Storage keys
    TRIP_KEY: 'tripBalance_trip',
    EXPENSES_KEY: 'tripBalance_expenses',

    // Get trip details
    getTrip() {
        const data = localStorage.getItem(this.TRIP_KEY);
        return data ? JSON.parse(data) : {
            name: '',
            startDate: '',
            endDate: ''
        };
    },

    // Save trip details
    saveTrip(trip) {
        localStorage.setItem(this.TRIP_KEY, JSON.stringify(trip));
    },

    // Get all expenses
    getExpenses() {
        const data = localStorage.getItem(this.EXPENSES_KEY);
        return data ? JSON.parse(data) : [];
    },

    // Save all expenses
    saveExpenses(expenses) {
        localStorage.setItem(this.EXPENSES_KEY, JSON.stringify(expenses));
    },

    // Add a new expense
    addExpense(expense) {
        const expenses = this.getExpenses();
        expense.id = Date.now().toString();
        expense.createdAt = new Date().toISOString();
        expenses.push(expense);
        this.saveExpenses(expenses);
        return expense;
    },

    // Update an expense
    updateExpense(id, updates) {
        const expenses = this.getExpenses();
        const index = expenses.findIndex(e => e.id === id);
        if (index !== -1) {
            expenses[index] = { ...expenses[index], ...updates };
            this.saveExpenses(expenses);
            return expenses[index];
        }
        return null;
    },

    // Delete an expense
    deleteExpense(id) {
        const expenses = this.getExpenses();
        const filtered = expenses.filter(e => e.id !== id);
        this.saveExpenses(filtered);
        return filtered;
    },

    // Clear all expenses
    clearAllExpenses() {
        this.saveExpenses([]);
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
        expenseForm: document.getElementById('expenseForm'),
        expenseDescription: document.getElementById('expenseDescription'),
        expenseAmount: document.getElementById('expenseAmount'),
        expenseCategory: document.getElementById('expenseCategory'),
        expenseDate: document.getElementById('expenseDate'),
        expenseCurrency: document.getElementById('expenseCurrency'),
        expensesList: document.getElementById('expensesList'),
        filterCategory: document.getElementById('filterCategory'),
        filterCurrency: document.getElementById('filterCurrency'),
        totalExpenses: document.getElementById('totalExpenses'),
        expenseCount: document.getElementById('expenseCount'),
        avgExpense: document.getElementById('avgExpense'),
        categoryBreakdown: document.getElementById('categoryBreakdown'),
        exportCSV: document.getElementById('exportCSV'),
        clearAll: document.getElementById('clearAll')
    },

    // Initialize UI
    init() {
        this.loadTripDetails();
        this.loadExpenses();
        this.setDefaultDate();
        this.bindEvents();
    },

    // Load trip details from storage
    loadTripDetails() {
        const trip = DataStore.getTrip();
        this.elements.tripName.value = trip.name;
        this.elements.startDate.value = trip.startDate;
        this.elements.endDate.value = trip.endDate;
    },

    // Set default date for new expenses
    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        this.elements.expenseDate.value = today;
    },

    // Bind event listeners
    bindEvents() {
        // Trip details change
        this.elements.tripName.addEventListener('change', () => this.saveTripDetails());
        this.elements.startDate.addEventListener('change', () => this.saveTripDetails());
        this.elements.endDate.addEventListener('change', () => this.saveTripDetails());

        // Expense form submission
        this.elements.expenseForm.addEventListener('submit', (e) => this.handleAddExpense(e));

        // Filter changes
        this.elements.filterCategory.addEventListener('change', () => this.loadExpenses());
        this.elements.filterCurrency.addEventListener('change', () => this.loadExpenses());

        // Action buttons
        this.elements.exportCSV.addEventListener('click', () => this.exportToCSV());
        this.elements.clearAll.addEventListener('click', () => this.clearAllExpenses());
    },

    // Save trip details
    saveTripDetails() {
        const trip = {
            name: this.elements.tripName.value,
            startDate: this.elements.startDate.value,
            endDate: this.elements.endDate.value
        };
        DataStore.saveTrip(trip);
    },

    // Handle adding new expense
    handleAddExpense(e) {
        e.preventDefault();

        const expense = {
            description: this.elements.expenseDescription.value.trim(),
            amount: parseFloat(this.elements.expenseAmount.value),
            category: this.elements.expenseCategory.value,
            date: this.elements.expenseDate.value,
            currency: this.elements.expenseCurrency.value
        };

        DataStore.addExpense(expense);

        // Reset form
        this.elements.expenseForm.reset();
        this.setDefaultDate();

        // Reload expenses
        this.loadExpenses();

        // Show success feedback
        this.showNotification('Expense added successfully!', 'success');
    },

    // Load and display expenses
    loadExpenses() {
        let expenses = DataStore.getExpenses();

        // Apply filters
        const categoryFilter = this.elements.filterCategory.value;
        const currencyFilter = this.elements.filterCurrency.value;

        if (categoryFilter !== 'all') {
            expenses = expenses.filter(e => e.category === categoryFilter);
        }

        if (currencyFilter !== 'all') {
            expenses = expenses.filter(e => e.currency === currencyFilter);
        }

        // Sort by date (newest first)
        expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Render expenses
        this.renderExpenses(expenses);

        // Update summary
        this.updateSummary(DataStore.getExpenses());
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
    deleteExpense(id) {
        if (confirm('Are you sure you want to delete this expense?')) {
            DataStore.deleteExpense(id);
            this.loadExpenses();
            this.showNotification('Expense deleted', 'info');
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
        this.elements.totalExpenses.textContent = CurrencyUtils.format(total, 'USD');
        this.elements.expenseCount.textContent = count;
        this.elements.avgExpense.textContent = CurrencyUtils.format(avg, 'USD');

        // Render category breakdown
        this.renderCategoryBreakdown(byCategory);
    },

    // Render category breakdown
    renderCategoryBreakdown(byCategory) {
        const categories = Object.keys(byCategory);

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
                    <span class="category-amount">${CurrencyUtils.format(amount, 'USD')}</span>
                </div>
            `;
        }).join('');

        this.elements.categoryBreakdown.innerHTML = html;
    },

    // Export to CSV
    exportToCSV() {
        const expenses = DataStore.getExpenses();

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
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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
    clearAllExpenses() {
        if (confirm('Are you sure you want to delete ALL expenses? This action cannot be undone.')) {
            DataStore.clearAllExpenses();
            this.loadExpenses();
            this.showNotification('All expenses cleared', 'info');
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
            bottom: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            background-color: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
        `;

        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
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

// ============================================================
// Future: Firestore Integration Guide
// ============================================================
//
// To integrate with Firestore, replace the DataStore methods:
//
// 1. Initialize Firebase in a separate config file
// 2. Replace localStorage calls with Firestore operations:
//
// Example:
// const DataStore = {
//     async getExpenses() {
//         const snapshot = await db.collection('expenses').get();
//         return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//     },
//
//     async addExpense(expense) {
//         const docRef = await db.collection('expenses').add(expense);
//         return { id: docRef.id, ...expense };
//     },
//
//     async deleteExpense(id) {
//         await db.collection('expenses').doc(id).delete();
//     }
// };
//
// ============================================================
