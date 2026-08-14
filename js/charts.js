let balanceChart = null;
let comparisonChart = null;
let cashFlowChart = null;
let categoryChart = null;

function getChartColors() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
        text: isDark ? '#cbd5e1' : '#475569',
        grid: isDark ? '#334155' : '#e2e8f0',
        positive: '#10b981',
        negative: '#ef4444',
        accent: '#3b82f6'
    };
}

function destroyCharts() {
    if (balanceChart) {
        balanceChart.destroy();
        balanceChart = null;
    }
    if (comparisonChart) {
        comparisonChart.destroy();
        comparisonChart = null;
    }
    if (cashFlowChart) {
        cashFlowChart.destroy();
        cashFlowChart = null;
    }
    if (categoryChart) {
        categoryChart.destroy();
        categoryChart = null;
    }
}

function updateBalanceChart(transactions, startingBalanceCents) {
    const canvas = document.getElementById('balanceChart');
    const emptyState = document.getElementById('balanceChartEmpty');
    
    if (!canvas) return;

    const balanceData = getBalanceOverTime(transactions, startingBalanceCents);
    
    if (balanceData.length < 2) {
        if (balanceChart) {
            balanceChart.destroy();
            balanceChart = null;
        }
        canvas.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }

    canvas.classList.remove('hidden');
    emptyState.classList.add('hidden');

    const colors = getChartColors();

    if (balanceChart) {
        balanceChart.destroy();
    }

    balanceChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels: balanceData.map(d => {
                const date = new Date(d.date);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }),
            datasets: [{
                label: 'Balance',
                data: balanceData.map(d => d.balance / 100),
                borderColor: colors.accent,
                backgroundColor: colors.accent + '20',
                fill: true,
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                    return 'Balance: ' + formatCurrency(context.raw * 100);
                }
            }
        }
    },
    scales: {
        x: {
            grid: {
                display: false
            },
            ticks: {
                color: colors.text,
                maxTicksLimit: 10
            }
        },
        y: {
            grid: {
                color: colors.grid
            },
            ticks: {
                color: colors.text,
                callback: function(value) {
                    return '$' + value.toLocaleString();
                }
            }
        }
    }
}
    });
}

function updateComparisonChart(transactions) {
    const canvas = document.getElementById('comparisonChart');
    const emptyState = document.getElementById('comparisonChartEmpty');
    
    if (!canvas) return;

    const monthlyData = getMonthlyCashFlow(transactions, 6);
    const hasData = monthlyData.some(m => m.deposits > 0 || m.payments > 0);
    
    if (!hasData) {
        if (comparisonChart) {
            comparisonChart.destroy();
            comparisonChart = null;
        }
        canvas.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }

    canvas.classList.remove('hidden');
    emptyState.classList.add('hidden');

    const colors = getChartColors();

    if (comparisonChart) {
        comparisonChart.destroy();
    }

    comparisonChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: monthlyData.map(m => m.month),
            datasets: [
                {
                    label: 'Deposits',
                    data: monthlyData.map(m => m.deposits / 100),
                    backgroundColor: colors.positive,
                    borderRadius: 4
                },
                {
                    label: 'Payments',
                    data: monthlyData.map(m => m.payments / 100),
                    backgroundColor: colors.negative,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: colors.text
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + formatCurrency(context.raw * 100);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: colors.text
                    }
                },
                y: {
                    grid: {
                        color: colors.grid
                    },
                    ticks: {
                        color: colors.text,
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function updateCashFlowChart(transactions) {
    const canvas = document.getElementById('cashFlowChart');
    const emptyState = document.getElementById('cashFlowChartEmpty');
    
    if (!canvas) return;

    const monthlyData = getMonthlyCashFlow(transactions, 6);
    const hasData = monthlyData.some(m => m.netChange !== 0);
    
    if (!hasData) {
        if (cashFlowChart) {
            cashFlowChart.destroy();
            cashFlowChart = null;
        }
        canvas.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }

    canvas.classList.remove('hidden');
    emptyState.classList.add('hidden');

    const colors = getChartColors();

    if (cashFlowChart) {
        cashFlowChart.destroy();
    }

    cashFlowChart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: monthlyData.map(m => m.month),
            datasets: [{
                label: 'Net Change',
                data: monthlyData.map(m => m.netChange / 100),
                backgroundColor: monthlyData.map(m => m.netChange >= 0 ? colors.positive : colors.negative),
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Net: ' + formatCurrency(context.raw * 100);
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: colors.text
                    }
                },
                y: {
                    grid: {
                        color: colors.grid
                    },
                    ticks: {
                        color: colors.text,
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function updateCategoryChart(transactions) {
    const canvas = document.getElementById('categoryChart');
    const emptyState = document.getElementById('categoryChartEmpty');
    
    if (!canvas) return;

    const categoryData = getCategoryBreakdown(transactions);
    
    if (categoryData.length === 0) {
        if (categoryChart) {
            categoryChart.destroy();
            categoryChart = null;
        }
        canvas.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }

    canvas.classList.remove('hidden');
    emptyState.classList.add('hidden');

    const colors = getChartColors();
    const categoryColors = [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
        '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
    ];

    if (categoryChart) {
        categoryChart.destroy();
    }

    categoryChart = new Chart(canvas, {
        type: 'doughnut',
        data: {
            labels: categoryData.map(c => c.category),
            datasets: [{
                data: categoryData.map(c => c.amount / 100),
                backgroundColor: categoryColors.slice(0, categoryData.length),
                borderWidth: 2,
                borderColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#1e293b' : '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: colors.text,
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.raw / total) * 100).toFixed(1);
                            return context.label + ': ' + formatCurrency(context.raw * 100) + ' (' + percentage + '%)';
                        }
                    }
                }
            }
        }
    });
}

function updateAllCharts(transactions, startingBalanceCents) {
    updateBalanceChart(transactions, startingBalanceCents);
    updateComparisonChart(transactions);
    updateCashFlowChart(transactions);
    updateCategoryChart(transactions);
}
