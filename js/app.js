window.appState = {
    transactions: [],
    startingBalance: 0
};

async function initApp() {
    try {
        await openDB();
        setupEventListeners();
        initTheme();
        
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                    console.log('Service Worker registered:', registration);
                })
                .catch((error) => {
                    console.log('Service Worker registration failed:', error);
                });
        }
        
        const savedStartingBalance = await getSetting('startingBalance');
        window.appState.startingBalance = savedStartingBalance || 0;
        
        const transactions = await getAllTransactions();
        window.appState.transactions = transactions;
        
        updateDashboard();
        updateTransactionsView();
        updateSettingsView();
        
        document.getElementById('startingBalance').value = formatCurrencyInput(window.appState.startingBalance);
        
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showToast('Failed to initialize application', 'error');
    }
}

function updateDashboard() {
    const currentBalance = calculateCurrentBalance(window.appState.transactions, window.appState.startingBalance);
    document.getElementById('totalBalance').textContent = formatCurrency(currentBalance);
    
    const monthlyStats = getCurrentMonthStats(window.appState.transactions);
    document.getElementById('monthlyDeposits').textContent = formatCurrency(monthlyStats.deposits);
    document.getElementById('monthlyPayments').textContent = formatCurrency(monthlyStats.payments);
    
    const netChangeEl = document.getElementById('monthlyNetChange');
    netChangeEl.textContent = formatCurrency(monthlyStats.netChange);
    netChangeEl.classList.remove('positive', 'negative');
    if (monthlyStats.netChange > 0) {
        netChangeEl.classList.add('positive');
    } else if (monthlyStats.netChange < 0) {
        netChangeEl.classList.add('negative');
    }
    
    document.getElementById('monthlyTransactionCount').textContent = monthlyStats.count;
    
    const recentTransactions = getRecentTransactions(window.appState.transactions);
    const recentList = document.getElementById('recentTransactionsList');
    const recentEmpty = document.getElementById('recentEmptyState');
    
    if (recentTransactions.length === 0) {
        recentList.innerHTML = '';
        recentEmpty.classList.remove('hidden');
    } else {
        recentEmpty.classList.add('hidden');
        const withBalances = calculateRunningBalances(window.appState.transactions, window.appState.startingBalance);
        const balanceMap = new Map(withBalances.map(t => [t.id, t.balanceAfter]));
        
        recentList.innerHTML = recentTransactions.map(t => 
            renderTransactionItem(t, balanceMap.get(t.id))
        ).join('');
    }
}

function updateTransactionsView() {
    const search = document.getElementById('searchInput').value;
    const filter = document.getElementById('filterSelect').value;
    const sort = document.getElementById('sortSelect').value;
    
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    const dateRangeFilter = document.getElementById('dateRangeFilter');
    dateRangeFilter.classList.toggle('hidden', filter !== 'custom');
    
    let filtered = filterTransactions(window.appState.transactions, {
        search,
        type: filter === 'deposits' || filter === 'payments' ? filter : 'all',
        dateRange: filter === 'thisMonth' || filter === 'lastMonth' || filter === 'custom' ? filter : 'all',
        startDate,
        endDate
    });
    
    filtered = sortTransactions(filtered, sort);
    
    const withBalances = calculateRunningBalances(window.appState.transactions, window.appState.startingBalance);
    const balanceMap = new Map(withBalances.map(t => [t.id, t.balanceAfter]));
    
    const tableBody = document.getElementById('transactionsTableBody');
    const emptyState = document.getElementById('transactionsEmptyState');
    const table = document.getElementById('transactionsTable');
    
    if (filtered.length === 0) {
        tableBody.innerHTML = '';
        emptyState.classList.remove('hidden');
        table.classList.add('hidden');
    } else {
        emptyState.classList.add('hidden');
        table.classList.remove('hidden');
        tableBody.innerHTML = filtered.map(t => 
            renderTransactionRow(t, balanceMap.get(t.id))
        ).join('');
        
        tableBody.querySelectorAll('.action-btn.edit').forEach(btn => {
            btn.addEventListener('click', () => editTransaction(btn.dataset.id));
        });
        
        tableBody.querySelectorAll('.action-btn.delete').forEach(btn => {
            btn.addEventListener('click', () => confirmDeleteTransaction(btn.dataset.id));
        });
    }
    
    updateAllCharts(filtered, window.appState.startingBalance);
}

function updateSettingsView() {
    document.getElementById('startingBalance').value = formatCurrencyInput(window.appState.startingBalance);
}

function openTransactionForm(transaction = null) {
    const form = document.getElementById('transactionForm');
    const formContainer = document.querySelector('.transaction-form-container');
    
    form.reset();
    document.getElementById('transactionId').value = '';
    
    if (transaction) {
        document.getElementById('transactionId').value = transaction.id;
        document.getElementById('checkNumber').value = transaction.checkNumber || '';
        document.getElementById('transactionName').value = transaction.name;
        document.getElementById('transactionDate').value = transaction.date;
        document.getElementById('category').value = transaction.category || '';
        document.getElementById('payment').value = formatCurrencyInput(transaction.paymentCents);
        document.getElementById('deposit').value = formatCurrencyInput(transaction.depositCents);
        formContainer.querySelector('h2').textContent = 'Edit Transaction';
    } else {
        document.getElementById('transactionDate').value = new Date().toISOString().split('T')[0];
        formContainer.querySelector('h2').textContent = 'Do a Transaction';
    }
    
    updateBalancePreview();
    navigateTo('transaction-form');
}

function updateBalancePreview() {
    const paymentCents = parseCurrencyInput(document.getElementById('payment').value);
    const depositCents = parseCurrencyInput(document.getElementById('deposit').value);
    
    const currentBalance = calculateCurrentBalance(window.appState.transactions, window.appState.startingBalance);
    const afterBalance = currentBalance + depositCents - paymentCents;
    
    document.getElementById('previewCurrentBalance').textContent = formatCurrency(currentBalance);
    document.getElementById('previewAfterBalance').textContent = formatCurrency(afterBalance);
    
    const afterEl = document.getElementById('previewAfterBalance');
    afterEl.classList.remove('positive', 'negative');
    if (afterBalance > currentBalance) {
        afterEl.classList.add('positive');
    } else if (afterBalance < currentBalance) {
        afterEl.classList.add('negative');
    }
}

async function saveTransaction(e) {
    e.preventDefault();
    
    const id = document.getElementById('transactionId').value;
    const checkNumber = document.getElementById('checkNumber').value.trim();
    const name = document.getElementById('transactionName').value.trim();
    const date = document.getElementById('transactionDate').value;
    const category = document.getElementById('category').value;
    const paymentCents = parseCurrencyInput(document.getElementById('payment').value);
    const depositCents = parseCurrencyInput(document.getElementById('deposit').value);
    
    if (!name) {
        showToast('Transaction name is required', 'error');
        return;
    }
    
    if (!date) {
        showToast('Date is required', 'error');
        return;
    }
    
    if (paymentCents === 0 && depositCents === 0) {
        showToast('Please enter a payment or deposit amount', 'error');
        return;
    }
    
    if (paymentCents > 0 && depositCents > 0) {
        showToast('Please enter only a payment OR deposit, not both', 'error');
        return;
    }
    
    const now = Date.now();
    
    if (id) {
        const existing = await getTransaction(id);
        if (existing) {
            const updated = {
                ...existing,
                checkNumber,
                name,
                date,
                category,
                paymentCents,
                depositCents,
                updatedAt: now
            };
            await updateTransaction(updated);
            
            const index = window.appState.transactions.findIndex(t => t.id === id);
            if (index !== -1) {
                window.appState.transactions[index] = updated;
            }
            
            showToast('Transaction updated successfully', 'success');
        }
    } else {
        const transaction = {
            id: generateId(),
            checkNumber,
            name,
            date,
            category,
            paymentCents,
            depositCents,
            createdAt: now,
            updatedAt: now
        };
        
        await addTransaction(transaction);
        window.appState.transactions.push(transaction);
        showToast('Transaction saved successfully', 'success');
    }
    
    updateDashboard();
    updateTransactionsView();
    navigateTo('dashboard');
}

async function editTransaction(id) {
    const transaction = await getTransaction(id);
    if (transaction) {
        openTransactionForm(transaction);
    }
}

async function confirmDeleteTransaction(id) {
    showConfirmModal(
        'Delete Transaction',
        'Are you sure you want to delete this transaction? This action cannot be undone.',
        async () => {
            await deleteTransaction(id);
            window.appState.transactions = window.appState.transactions.filter(t => t.id !== id);
            updateDashboard();
            updateTransactionsView();
            showToast('Transaction deleted', 'success');
        }
    );
}

async function saveStartingBalance() {
    const value = parseCurrencyInput(document.getElementById('startingBalance').value);
    window.appState.startingBalance = value;
    await setSetting('startingBalance', value);
    updateDashboard();
    updateTransactionsView();
    showToast('Starting balance saved', 'success');
}

async function handleExportCSV() {
    exportToCSV(window.appState.transactions);
}

async function handleExportJSON() {
    exportToJSON(window.appState.transactions, window.appState.startingBalance);
}

function handleImportJSON() {
    const fileInput = document.getElementById('importFile');
    fileInput.click();
    
    fileInput.onchange = async () => {
        const file = fileInput.files[0];
        if (!validateImportFile(file)) return;
        
        showConfirmModal(
            'Import Data',
            'Do you want to replace existing data or merge with it?',
            async () => {
                const mode = 'replace';
                try {
                    const result = await importFromJSON(file, mode);
                    if (mode === 'replace') {
                        window.appState.transactions = await getAllTransactions();
                        const savedBalance = await getSetting('startingBalance');
                        window.appState.startingBalance = savedBalance || 0;
                    }
                    updateDashboard();
                    updateTransactionsView();
                    updateSettingsView();
                } catch (error) {
                    console.error('Import failed:', error);
                }
            }
        );
        
        fileInput.value = '';
    };
}

async function handleClearAllData() {
    showConfirmModal(
        'Clear All Data',
        'This will permanently delete all transactions and reset the application. This action cannot be undone. Are you absolutely sure?',
        async () => {
            await clearAllData();
            window.appState.transactions = [];
            window.appState.startingBalance = 0;
            updateDashboard();
            updateTransactionsView();
            updateSettingsView();
            document.getElementById('startingBalance').value = '';
            showToast('All data cleared', 'success');
        }
    );
}

function setupEventListeners() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            navigateTo(view);
        });
    });

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            setTheme(currentTheme === 'dark' ? 'light' : 'dark');
        });
    }

    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.addEventListener('click', () => {
            setTheme(btn.dataset.theme);
        });
    });

    const confirmModalCancel = document.getElementById('confirmModalCancel');
    if (confirmModalCancel) {
        confirmModalCancel.addEventListener('click', hideConfirmModal);
    }

    const confirmModalConfirm = document.getElementById('confirmModalConfirm');
    if (confirmModalConfirm) {
        confirmModalConfirm.addEventListener('click', () => {
            if (confirmCallback) {
                confirmCallback();
            }
            hideConfirmModal();
        });
    }

    const confirmModal = document.getElementById('confirmModal');
    if (confirmModal) {
        confirmModal.addEventListener('click', (e) => {
            if (e.target.id === 'confirmModal') {
                hideConfirmModal();
            }
        });
    }

    const doTransactionBtn = document.getElementById('doTransactionBtn');
    if (doTransactionBtn) {
        doTransactionBtn.addEventListener('click', () => openTransactionForm());
    }

    const emptyDoTransaction = document.getElementById('emptyDoTransaction');
    if (emptyDoTransaction) {
        emptyDoTransaction.addEventListener('click', () => openTransactionForm());
    }

    const seeAllTransactions = document.getElementById('seeAllTransactions');
    if (seeAllTransactions) {
        seeAllTransactions.addEventListener('click', () => navigateTo('transactions'));
    }
    
    const transactionForm = document.getElementById('transactionForm');
    if (transactionForm) {
        transactionForm.addEventListener('submit', saveTransaction);
    }

    const cancelTransaction = document.getElementById('cancelTransaction');
    if (cancelTransaction) {
        cancelTransaction.addEventListener('click', () => navigateTo('dashboard'));
    }
    
    const autofillDate = document.getElementById('autofillDate');
    if (autofillDate) {
        autofillDate.addEventListener('click', () => {
            const transactionDate = document.getElementById('transactionDate');
            if (transactionDate) {
                transactionDate.value = new Date().toISOString().split('T')[0];
            }
        });
    }
    
    const payment = document.getElementById('payment');
    if (payment) {
        payment.addEventListener('input', updateBalancePreview);
    }

    const deposit = document.getElementById('deposit');
    if (deposit) {
        deposit.addEventListener('input', updateBalancePreview);
    }
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', updateTransactionsView);
    }

    const filterSelect = document.getElementById('filterSelect');
    if (filterSelect) {
        filterSelect.addEventListener('change', updateTransactionsView);
    }

    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', updateTransactionsView);
    }

    const startDate = document.getElementById('startDate');
    if (startDate) {
        startDate.addEventListener('change', updateTransactionsView);
    }

    const endDate = document.getElementById('endDate');
    if (endDate) {
        endDate.addEventListener('change', updateTransactionsView);
    }
    
    const saveStartingBalanceBtn = document.getElementById('saveStartingBalance');
    if (saveStartingBalanceBtn) {
        saveStartingBalanceBtn.addEventListener('click', saveStartingBalance);
    }

    const exportCSV = document.getElementById('exportCSV');
    if (exportCSV) {
        exportCSV.addEventListener('click', handleExportCSV);
    }

    const exportJSON = document.getElementById('exportJSON');
    if (exportJSON) {
        exportJSON.addEventListener('click', handleExportJSON);
    }

    const importJSON = document.getElementById('importJSON');
    if (importJSON) {
        importJSON.addEventListener('click', handleImportJSON);
    }

    const clearAllData = document.getElementById('clearAllData');
    if (clearAllData) {
        clearAllData.addEventListener('click', handleClearAllData);
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideConfirmModal();
            if (currentView === 'transaction-form') {
                navigateTo('dashboard');
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', initApp);
