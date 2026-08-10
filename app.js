// Trip Balance - Expense Tracker
// Main Application JavaScript

// ============================================================
// Constants
// ============================================================

const ADMIN_EMAIL = 'coursebagemaila@gmail.com';
const DEFAULT_TRIP_LIMIT = 2;

// ============================================================
// Authentication Module
// ============================================================

const Auth = {
    currentUser: null,
    isAdmin: false,

    // Initialize auth state listener
    init() {
        // Bind auth buttons immediately (before any sign-in state)
        document.getElementById('googleSignIn').addEventListener('click', () => this.signInWithGoogle());
        document.getElementById('signOut').addEventListener('click', () => this.signOut());

        auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            this.isAdmin = user && user.email === ADMIN_EMAIL;
            this.handleAuthStateChange(user);
        });
    },

    // Handle auth state change
    handleAuthStateChange(user) {
        const authSignedOut = document.getElementById('authSignedOut');
        const authSignedIn = document.getElementById('authSignedIn');
        const mainApp = document.getElementById('mainApp');
        const loadingSpinner = document.getElementById('loadingSpinner');
        const adminPanel = document.getElementById('adminPanel');

        if (user) {
            // User is signed in
            authSignedOut.style.display = 'none';
            authSignedIn.style.display = 'block';
            loadingSpinner.style.display = 'none';
            mainApp.style.display = 'block';

            // Show admin panel for admin user
            adminPanel.style.display = this.isAdmin ? 'block' : 'none';

            // Update user info
            document.getElementById('userAvatar').src = user.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.displayName || 'User') + '&background=6366f1&color=fff';

            // Save user info to Firestore
            db.collection('users').doc(user.uid).set({
                email: user.email,
                displayName: user.displayName || '',
                photoURL: user.photoURL || '',
                lastLogin: new Date().toISOString()
            }, { merge: true });

            // Initialize app with user ID
            DataStore.init(user.uid);
            if (!UI.initialized) {
                UI.init();
            } else {
                UI.loadTrips();
            }

            // Load admin panel if admin
            if (this.isAdmin) {
                AdminPanel.loadUsers();
            }
        } else {
            // User is signed out
            authSignedOut.style.display = 'block';
            authSignedIn.style.display = 'none';
            loadingSpinner.style.display = 'none';
            mainApp.style.display = 'none';
        }
    },

    // Sign in with Google
    async signInWithGoogle() {
        try {
            const result = await auth.signInWithPopup(googleProvider);
            console.log('User signed in:', result.user);
            return result.user;
        } catch (error) {
            console.error('Error signing in:', error);
            UI.showNotification('Error signing in: ' + error.message, 'error');
            return null;
        }
    },

    // Sign out
    async signOut() {
        try {
            await auth.signOut();
            console.log('User signed out');
        } catch (error) {
            console.error('Error signing out:', error);
            UI.showNotification('Error signing out', 'error');
        }
    },

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }
};

// ============================================================
// Data Layer - Firestore Integration (Multiple Trips)
// ============================================================

const DataStore = {
    // Firestore collection references
    tripsRef: null,
    expensesRef: null,
    currentTripId: null,
    userId: null,

    // Initialize Firestore references for current user
    init(userId) {
        this.userId = userId;
        this.tripsRef = db.collection('users').doc(userId).collection('trips');
        this.expensesRef = db.collection('users').doc(userId).collection('expenses');
    },

    // Get user limits (admin only)
    async getUserLimits() {
        try {
            const snapshot = await db.collection('userLimits').get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting user limits:', error);
            return [];
        }
    },

    // Get trip limit for a user
    async getUserTripLimit(userId) {
        try {
            const doc = await db.collection('userLimits').doc(userId).get();
            if (doc.exists) {
                return doc.data().tripLimit;
            }
            return DEFAULT_TRIP_LIMIT;
        } catch (error) {
            console.error('Error getting user trip limit:', error);
            return DEFAULT_TRIP_LIMIT;
        }
    },

    // Set trip limit for a user (admin only)
    async setUserTripLimit(userId, tripLimit) {
        try {
            await db.collection('userLimits').doc(userId).set({
                tripLimit: tripLimit,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            return true;
        } catch (error) {
            console.error('Error setting user trip limit:', error);
            return false;
        }
    },

    // Get all users (admin only)
    async getAllUsers() {
        try {
            const snapshot = await db.collection('users').get();
            return snapshot.docs.map(doc => ({
                uid: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting all users:', error);
            return [];
        }
    },

    // Get all trips
    async getAllTrips() {
        try {
            const snapshot = await this.tripsRef.orderBy('createdAt', 'desc').get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting trips:', error);
            return [];
        }
    },

    // Get a single trip by ID
    async getTrip(tripId) {
        try {
            const doc = await this.tripsRef.doc(tripId).get();
            if (doc.exists) {
                return {
                    id: doc.id,
                    ...doc.data()
                };
            }
            return null;
        } catch (error) {
            console.error('Error getting trip:', error);
            return null;
        }
    },

    // Create a new trip
    async createTrip(trip) {
        try {
            trip.createdAt = new Date().toISOString();
            const docRef = await this.tripsRef.add(trip);
            return {
                id: docRef.id,
                ...trip
            };
        } catch (error) {
            console.error('Error creating trip:', error);
            return null;
        }
    },

    // Update a trip
    async updateTrip(tripId, updates) {
        try {
            await this.tripsRef.doc(tripId).update(updates);
            return {
                id: tripId,
                ...updates
            };
        } catch (error) {
            console.error('Error updating trip:', error);
            return null;
        }
    },

    // Delete a trip and its expenses
    async deleteTrip(tripId) {
        try {
            // Delete all expenses for this trip
            const expensesSnapshot = await this.expensesRef.where('tripId', '==', tripId).get();
            const batch = db.batch();
            expensesSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            batch.delete(this.tripsRef.doc(tripId));
            await batch.commit();
            return true;
        } catch (error) {
            console.error('Error deleting trip:', error);
            return false;
        }
    },

    // Get expenses for a specific trip
    async getExpensesByTrip(tripId) {
        try {
            const snapshot = await this.expensesRef.where('tripId', '==', tripId).get();
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
            expense.createdAt = new Date().toISOString();
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

    // Clear all expenses for a trip
    async clearAllExpenses(tripId) {
        try {
            const snapshot = await this.expensesRef.where('tripId', '==', tripId).get();
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
// Admin Panel
// ============================================================

const AdminPanel = {
    users: [],

    // Load all users
    async loadUsers() {
        const users = await DataStore.getAllUsers();
        const limits = await DataStore.getUserLimits();
        const limitsMap = {};
        limits.forEach(l => {
            limitsMap[l.id] = l.tripLimit;
        });

        // Enrich users with trip counts and limits
        this.users = [];
        for (const user of users) {
            const tripsSnapshot = await db.collection('users').doc(user.uid).collection('trips').get();
            const tripCount = tripsSnapshot.size;
            const tripLimit = limitsMap[user.uid] || DEFAULT_TRIP_LIMIT;
            this.users.push({
                uid: user.uid,
                email: user.email || 'Unknown',
                displayName: user.displayName || 'Unknown',
                tripCount: tripCount,
                tripLimit: tripLimit
            });
        }

        this.renderUsers();
    },

    // Render users list
    renderUsers() {
        const container = document.getElementById('adminUsers');

        if (this.users.length === 0) {
            container.innerHTML = '<p class="no-trips">No users found</p>';
            return;
        }

        const html = this.users.map(user => {
            const isAdmin = user.email === ADMIN_EMAIL;
            return `
                <div class="admin-user-item">
                    <div class="admin-user-info">
                        <div class="admin-user-email">
                            ${this.escapeHtml(user.email)}
                            ${isAdmin ? '<span class="admin-badge">Admin</span>' : ''}
                        </div>
                        <div class="admin-user-id">UID: ${user.uid.substring(0, 12)}... | Trips: ${user.tripCount}</div>
                    </div>
                    <div class="admin-user-limit">
                        <label>Limit:</label>
                        <select id="limit-${user.uid}">
                            ${[1, 2, 3, 4, 5, 10, 15, 20].map(n =>
                                `<option value="${n}" ${user.tripLimit === n ? 'selected' : ''}>${n}</option>`
                            ).join('')}
                        </select>
                        <button class="btn-primary btn-small" onclick="AdminPanel.saveLimit('${user.uid}')">Save</button>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    },

    // Save trip limit for a user
    async saveLimit(userId) {
        const select = document.getElementById(`limit-${userId}`);
        const newLimit = parseInt(select.value);

        const success = await DataStore.setUserTripLimit(userId, newLimit);
        if (success) {
            UI.showNotification('Trip limit updated!', 'success');
            // Update local data
            const user = this.users.find(u => u.uid === userId);
            if (user) {
                user.tripLimit = newLimit;
            }
        } else {
            UI.showNotification('Error updating trip limit', 'error');
        }
    },

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// ============================================================
// UI Controller
// ============================================================

const UI = {
    // DOM Elements
    elements: {
        // Trip selector
        newTripBtn: document.getElementById('newTripBtn'),
        tripList: document.getElementById('tripList'),

        // Trip details section
        tripDetailsSection: document.getElementById('tripDetailsSection'),
        selectedTripTitle: document.getElementById('selectedTripTitle'),
        editTripBtn: document.getElementById('editTripBtn'),
        deleteTripBtn: document.getElementById('deleteTripBtn'),
        tripDetailsContent: document.getElementById('tripDetailsContent'),

        // Modal
        tripModal: document.getElementById('tripModal'),
        modalTitle: document.getElementById('modalTitle'),
        closeModal: document.getElementById('closeModal'),
        tripForm: document.getElementById('tripForm'),
        modalTripName: document.getElementById('modalTripName'),
        modalStartDate: document.getElementById('modalStartDate'),
        modalEndDate: document.getElementById('modalEndDate'),
        modalCurrency: document.getElementById('modalCurrency'),
        cancelModal: document.getElementById('cancelModal'),

        // Expense form
        addExpenseSection: document.getElementById('addExpenseSection'),
        expenseForm: document.getElementById('expenseForm'),
        expenseDescription: document.getElementById('expenseDescription'),
        expenseAmount: document.getElementById('expenseAmount'),
        expenseCategory: document.getElementById('expenseCategory'),
        expenseDate: document.getElementById('expenseDate'),

        // Expenses list
        expensesSection: document.getElementById('expensesSection'),
        expensesList: document.getElementById('expensesList'),
        filterCategory: document.getElementById('filterCategory'),

        // Summary
        summarySection: document.getElementById('summarySection'),
        totalExpenses: document.getElementById('totalExpenses'),
        expenseCount: document.getElementById('expenseCount'),
        avgExpense: document.getElementById('avgExpense'),
        categoryBreakdown: document.getElementById('categoryBreakdown'),

        // Actions
        actionsSection: document.getElementById('actionsSection'),
        exportCSV: document.getElementById('exportCSV'),
        clearAll: document.getElementById('clearAll')
    },

    // Current state
    currentTrip: null,
    allTrips: [],
    editingTripId: null,
    initialized: false,

    // Initialize UI
    async init() {
        this.initialized = true;
        await this.loadTrips();
        this.setDefaultDate();
        this.bindEvents();
    },

    // Load all trips
    async loadTrips() {
        this.allTrips = await DataStore.getAllTrips();
        this.renderTripList();
    },

    // Render trip list
    renderTripList() {
        if (this.allTrips.length === 0) {
            this.elements.tripList.innerHTML = '<p class="no-trips">No trips yet. Create your first trip!</p>';
            this.hideSections();
            return;
        }

        const html = this.allTrips.map(trip => {
            const isSelected = this.currentTrip && this.currentTrip.id === trip.id;
            const formattedStartDate = trip.startDate ? new Date(trip.startDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            }) : 'Not set';
            const formattedEndDate = trip.endDate ? new Date(trip.endDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            }) : 'Not set';

            return `
                <div class="trip-item ${isSelected ? 'selected' : ''}" data-id="${trip.id}" onclick="UI.selectTrip('${trip.id}')">
                    <div class="trip-item-info">
                        <div class="trip-item-name">${this.escapeHtml(trip.name)}</div>
                        <div class="trip-item-dates">${formattedStartDate} - ${formattedEndDate}</div>
                    </div>
                    <div class="trip-item-currency">${trip.currency}</div>
                </div>
            `;
        }).join('');

        this.elements.tripList.innerHTML = html;
    },

    // Select a trip
    async selectTrip(tripId) {
        this.currentTrip = await DataStore.getTrip(tripId);
        if (this.currentTrip) {
            this.renderTripList();
            this.showSections();
            await this.loadExpenses();
        }
    },

    // Show all sections when a trip is selected
    showSections() {
        this.elements.tripDetailsSection.style.display = 'block';
        this.elements.addExpenseSection.style.display = 'block';
        this.elements.expensesSection.style.display = 'block';
        this.elements.summarySection.style.display = 'block';
        this.elements.actionsSection.style.display = 'flex';
        this.renderTripDetails();
    },

    // Hide sections when no trip is selected
    hideSections() {
        this.elements.tripDetailsSection.style.display = 'none';
        this.elements.addExpenseSection.style.display = 'none';
        this.elements.expensesSection.style.display = 'none';
        this.elements.summarySection.style.display = 'none';
        this.elements.actionsSection.style.display = 'none';
        this.currentTrip = null;
    },

    // Render trip details
    renderTripDetails() {
        if (!this.currentTrip) return;

        const trip = this.currentTrip;
        const formattedStartDate = trip.startDate ? new Date(trip.startDate).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        }) : 'Not set';
        const formattedEndDate = trip.endDate ? new Date(trip.endDate).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        }) : 'Not set';

        this.elements.selectedTripTitle.textContent = trip.name;

        this.elements.tripDetailsContent.innerHTML = `
            <div class="trip-detail-item">
                <span class="trip-detail-label">Name</span>
                <span class="trip-detail-value">${this.escapeHtml(trip.name)}</span>
            </div>
            <div class="trip-detail-item">
                <span class="trip-detail-label">Start Date</span>
                <span class="trip-detail-value">${formattedStartDate}</span>
            </div>
            <div class="trip-detail-item">
                <span class="trip-detail-label">End Date</span>
                <span class="trip-detail-value">${formattedEndDate}</span>
            </div>
            <div class="trip-detail-item">
                <span class="trip-detail-label">Currency</span>
                <span class="trip-detail-value">${trip.currency}</span>
            </div>
        `;
    },

    // Set default date for new expenses
    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        this.elements.expenseDate.value = today;
    },

    // Bind event listeners
    bindEvents() {
        // New trip button
        this.elements.newTripBtn.addEventListener('click', () => this.openCreateTripModal());

        // Edit trip button
        this.elements.editTripBtn.addEventListener('click', () => this.openEditTripModal());

        // Delete trip button
        this.elements.deleteTripBtn.addEventListener('click', () => this.deleteTrip());

        // Modal close buttons
        this.elements.closeModal.addEventListener('click', () => this.closeModal());
        this.elements.cancelModal.addEventListener('click', () => this.closeModal());

        // Trip form submission
        this.elements.tripForm.addEventListener('submit', (e) => this.handleTripSubmit(e));

        // Expense form submission
        this.elements.expenseForm.addEventListener('submit', (e) => this.handleAddExpense(e));

        // Filter changes
        this.elements.filterCategory.addEventListener('change', () => this.loadExpenses());

        // Action buttons
        this.elements.exportCSV.addEventListener('click', () => this.exportToCSV());
        this.elements.clearAll.addEventListener('click', () => this.clearAllExpenses());

        // Close modal on outside click
        this.elements.tripModal.addEventListener('click', (e) => {
            if (e.target === this.elements.tripModal) {
                this.closeModal();
            }
        });
    },

    // Open modal for creating a new trip
    async openCreateTripModal() {
        const tripLimit = await DataStore.getUserTripLimit(DataStore.userId);
        if (this.allTrips.length >= tripLimit) {
            UI.showNotification(`Trip limit reached: maximum ${tripLimit} trip${tripLimit !== 1 ? 's' : ''} allowed`, 'error');
            return;
        }
        this.editingTripId = null;
        this.elements.modalTitle.textContent = 'Create New Trip';
        this.elements.tripForm.reset();
        this.elements.modalCurrency.value = 'USD';
        this.elements.tripModal.style.display = 'flex';
    },

    // Open modal for editing a trip
    openEditTripModal() {
        if (!this.currentTrip) return;

        this.editingTripId = this.currentTrip.id;
        this.elements.modalTitle.textContent = 'Edit Trip';
        this.elements.modalTripName.value = this.currentTrip.name;
        this.elements.modalStartDate.value = this.currentTrip.startDate;
        this.elements.modalEndDate.value = this.currentTrip.endDate;
        this.elements.modalCurrency.value = this.currentTrip.currency;
        this.elements.tripModal.style.display = 'flex';
    },

    // Close modal
    closeModal() {
        this.elements.tripModal.style.display = 'none';
        this.editingTripId = null;
    },

    // Handle trip form submission
    async handleTripSubmit(e) {
        e.preventDefault();

        const tripData = {
            name: this.elements.modalTripName.value.trim(),
            startDate: this.elements.modalStartDate.value,
            endDate: this.elements.modalEndDate.value,
            currency: this.elements.modalCurrency.value
        };

        let result;

        if (this.editingTripId) {
            // Update existing trip
            result = await DataStore.updateTrip(this.editingTripId, tripData);
            if (result) {
                this.currentTrip = {
                    id: this.editingTripId,
                    ...tripData
                };
                this.showNotification('Trip updated successfully!', 'success');
            }
        } else {
            // Create new trip
            result = await DataStore.createTrip(tripData);
            if (result) {
                this.currentTrip = result;
                this.showNotification('Trip created successfully!', 'success');
            }
        }

        if (result) {
            this.closeModal();
            await this.loadTrips();
            this.showSections();
        } else {
            this.showNotification('Error saving trip', 'error');
        }
    },

    // Delete current trip
    async deleteTrip() {
        if (!this.currentTrip) return;

        if (confirm(`Are you sure you want to delete "${this.currentTrip.name}" and all its expenses? This action cannot be undone.`)) {
            const success = await DataStore.deleteTrip(this.currentTrip.id);
            if (success) {
                this.hideSections();
                await this.loadTrips();
                this.showNotification('Trip deleted', 'info');
            } else {
                this.showNotification('Error deleting trip', 'error');
            }
        }
    },

    // Handle adding new expense
    async handleAddExpense(e) {
        e.preventDefault();

        if (!this.currentTrip) {
            this.showNotification('Please select a trip first', 'error');
            return;
        }

        const expense = {
            tripId: this.currentTrip.id,
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

    // Load and display expenses for current trip
    async loadExpenses() {
        if (!this.currentTrip) return;

        let expenses = await DataStore.getExpensesByTrip(this.currentTrip.id);

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
        const allExpenses = await DataStore.getExpensesByTrip(this.currentTrip.id);
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
        if (!this.currentTrip) return;

        const expenses = await DataStore.getExpensesByTrip(this.currentTrip.id);

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
        link.setAttribute('download', `${this.currentTrip.name.replace(/[^a-z0-9]/gi, '_')}_expenses_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showNotification('Expenses exported to CSV', 'success');
    },

    // Clear all expenses for current trip
    async clearAllExpenses() {
        if (!this.currentTrip) return;

        if (confirm(`Are you sure you want to delete ALL expenses for "${this.currentTrip.name}"? This action cannot be undone.`)) {
            const success = await DataStore.clearAllExpenses(this.currentTrip.id);
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
    Auth.init();
});
