const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

function formatCurrency(cents) {
    return currencyFormatter.format(cents / 100);
}

function parseCurrencyInput(value) {
    if (!value || value === '') return 0;
    
    const cleaned = value.toString().replace(/[^0-9.-]/g, '');
    const number = parseFloat(cleaned);
    
    if (isNaN(number)) return 0;
    if (number < 0) return 0;
    
    return Math.round(number * 100);
}

function formatCurrencyInput(cents) {
    if (cents === 0) return '';
    return (cents / 100).toFixed(2);
}

function calculateRunningBalances(transactions, startingBalanceCents) {
    const sorted = [...transactions].sort((a, b) => {
        const dateCompare = new Date(a.date) - new Date(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.createdAt - b.createdAt;
    });

    let balance = startingBalanceCents;
    const withBalances = sorted.map(t => {
        balance += t.depositCents - t.paymentCents;
        return { ...t, balanceAfter: balance };
    });

    return withBalances;
}

function calculateCurrentBalance(transactions, startingBalanceCents) {
    const withBalances = calculateRunningBalances(transactions, startingBalanceCents);
    if (withBalances.length === 0) return startingBalanceCents;
    return withBalances[withBalances.length - 1].balanceAfter;
}

function getMonthlyStats(transactions, year, month) {
    const monthTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return date.getFullYear() === year && date.getMonth() === month;
    });

    const deposits = monthTransactions.reduce((sum, t) => sum + t.depositCents, 0);
    const payments = monthTransactions.reduce((sum, t) => sum + t.paymentCents, 0);
    const netChange = deposits - payments;
    const count = monthTransactions.length;

    return { deposits, payments, netChange, count };
}

function getCurrentMonthStats(transactions) {
    const now = new Date();
    return getMonthlyStats(transactions, now.getFullYear(), now.getMonth());
}

function getRecentTransactions(transactions, days = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return transactions
        .filter(t => new Date(t.date) >= cutoff)
        .sort((a, b) => new Date(b.date) - new Date(a.date) || b.createdAt - a.createdAt)
        .slice(0, 10);
}

function getMonthlyCashFlow(transactions, months = 12) {
    const monthlyData = [];
    const now = new Date();
    
    for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const stats = getMonthlyStats(transactions, date.getFullYear(), date.getMonth());
        
        monthlyData.push({
            month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            deposits: stats.deposits,
            payments: stats.payments,
            netChange: stats.netChange
        });
    }
    
    return monthlyData;
}

function getBalanceOverTime(transactions, startingBalanceCents) {
    const withBalances = calculateRunningBalances(transactions, startingBalanceCents);
    
    return withBalances.map(t => ({
        date: t.date,
        balance: t.balanceAfter
    }));
}

function getCategoryBreakdown(transactions) {
    const categories = {};
    
    transactions.forEach(t => {
        if (t.paymentCents > 0 && t.category) {
            if (!categories[t.category]) {
                categories[t.category] = 0;
            }
            categories[t.category] += t.paymentCents;
        }
    });
    
    return Object.entries(categories).map(([category, amount]) => ({
        category,
        amount
    })).sort((a, b) => b.amount - a.amount);
}

function filterTransactions(transactions, filters) {
    let filtered = [...transactions];
    
    if (filters.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(t => 
            t.name.toLowerCase().includes(search) ||
            (t.checkNumber && t.checkNumber.toLowerCase().includes(search)) ||
            t.date.includes(search)
        );
    }
    
    if (filters.type === 'deposits') {
        filtered = filtered.filter(t => t.depositCents > 0);
    } else if (filters.type === 'payments') {
        filtered = filtered.filter(t => t.paymentCents > 0);
    }
    
    if (filters.dateRange === 'thisMonth') {
        const now = new Date();
        filtered = filtered.filter(t => {
            const date = new Date(t.date);
            return date.getMonth() === now.getMonth() && 
                   date.getFullYear() === now.getFullYear();
        });
    } else if (filters.dateRange === 'lastMonth') {
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
        filtered = filtered.filter(t => {
            const date = new Date(t.date);
            return date.getMonth() === lastMonth.getMonth() && 
                   date.getFullYear() === lastMonth.getFullYear();
        });
    } else if (filters.dateRange === 'custom' && filters.startDate && filters.endDate) {
        filtered = filtered.filter(t => {
            const date = new Date(t.date);
            return date >= new Date(filters.startDate) && date <= new Date(filters.endDate);
        });
    }
    
    return filtered;
}

function sortTransactions(transactions, sortBy) {
    const sorted = [...transactions];
    
    switch (sortBy) {
        case 'newest':
            sorted.sort((a, b) => new Date(b.date) - new Date(a.date) || b.createdAt - a.createdAt);
            break;
        case 'oldest':
            sorted.sort((a, b) => new Date(a.date) - new Date(b.date) || a.createdAt - b.createdAt);
            break;
        case 'largest':
            sorted.sort((a, b) => {
                const amountA = Math.max(a.depositCents, a.paymentCents);
                const amountB = Math.max(b.depositCents, b.paymentCents);
                return amountB - amountA;
            });
            break;
        case 'smallest':
            sorted.sort((a, b) => {
                const amountA = Math.max(a.depositCents, a.paymentCents);
                const amountB = Math.max(b.depositCents, b.paymentCents);
                return amountA - amountB;
            });
            break;
        case 'nameAZ':
            sorted.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'nameZA':
            sorted.sort((a, b) => b.name.localeCompare(a.name));
            break;
        default:
            sorted.sort((a, b) => new Date(b.date) - new Date(a.date) || b.createdAt - a.createdAt);
    }
    
    return sorted;
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
