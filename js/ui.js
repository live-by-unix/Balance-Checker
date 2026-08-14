let currentView = 'dashboard';
let confirmCallback = null;

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    toast.innerHTML = `
        <div class="toast-content">${message}</div>
        <button class="toast-close" aria-label="Close notification">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
        </button>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        toast.remove();
    });

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 5000);
}

function navigateTo(view) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    const viewElement = document.getElementById(view);
    if (viewElement) {
        viewElement.classList.add('active');
    }

    const navBtn = document.querySelector(`.nav-btn[data-view="${view}"]`);
    if (navBtn) {
        navBtn.classList.add('active');
    }

    currentView = view;

    if (view === 'transactions') {
        updateTransactionsView();
    }
}

function showConfirmModal(title, message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    const titleEl = document.getElementById('confirmModalTitle');
    const messageEl = document.getElementById('confirmModalMessage');
    const confirmBtn = document.getElementById('confirmModalConfirm');
    const cancelBtn = document.getElementById('confirmModalCancel');

    titleEl.textContent = title;
    messageEl.textContent = message;
    confirmCallback = onConfirm;

    modal.classList.remove('hidden');
}

function hideConfirmModal() {
    const modal = document.getElementById('confirmModal');
    modal.classList.add('hidden');
    confirmCallback = null;
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (prefersDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }

    updateThemeButtons();
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateThemeButtons();
    
    if (currentView === 'transactions') {
        updateAllCharts(window.appState.transactions, window.appState.startingBalance);
    }
}

function updateThemeButtons() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    document.querySelectorAll('.theme-option').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === currentTheme);
    });
}

function formatTransactionDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderTransactionItem(transaction, balanceAfter) {
    const isPayment = transaction.paymentCents > 0;
    const isDeposit = transaction.depositCents > 0;
    
    let amountHtml = '';
    if (isPayment) {
        amountHtml = `<span class="transaction-amount payment">-${formatCurrency(transaction.paymentCents)}</span>`;
    } else if (isDeposit) {
        amountHtml = `<span class="transaction-amount deposit">+${formatCurrency(transaction.depositCents)}</span>`;
    }

    return `
        <div class="transaction-item" data-id="${transaction.id}">
            <div class="transaction-date">${formatTransactionDate(transaction.date)}</div>
            <div class="transaction-info">
                <div class="transaction-name">${transaction.name}</div>
                ${transaction.checkNumber ? `<div class="transaction-check">#${transaction.checkNumber}</div>` : ''}
            </div>
            ${amountHtml}
            <div class="transaction-balance">${formatCurrency(balanceAfter)}</div>
        </div>
    `;
}

function renderTransactionRow(transaction, balanceAfter) {
    const isPayment = transaction.paymentCents > 0;
    const isDeposit = transaction.depositCents > 0;
    
    return `
        <tr data-id="${transaction.id}">
            <td>${formatTransactionDate(transaction.date)}</td>
            <td>${transaction.checkNumber || '-'}</td>
            <td>${transaction.name}</td>
            <td>${transaction.category || '-'}</td>
            <td class="payment">${isPayment ? formatCurrency(transaction.paymentCents) : '-'}</td>
            <td class="deposit">${isDeposit ? formatCurrency(transaction.depositCents) : '-'}</td>
            <td>${formatCurrency(balanceAfter)}</td>
            <td class="actions">
                <button class="action-btn edit" data-id="${transaction.id}" aria-label="Edit transaction">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                </button>
                <button class="action-btn delete" data-id="${transaction.id}" aria-label="Delete transaction">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                </button>
            </td>
        </tr>
    `;
}
