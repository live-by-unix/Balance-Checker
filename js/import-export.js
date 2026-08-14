function exportToCSV(transactions) {
    if (transactions.length === 0) {
        showToast('No transactions to export', 'error');
        return;
    }

    const headers = ['Date', 'Check Number', 'Name', 'Category', 'Payment', 'Deposit'];
    const rows = transactions.map(t => [
        t.date,
        t.checkNumber || '',
        t.name,
        t.category || '',
        t.paymentCents > 0 ? formatCurrency(t.paymentCents) : '',
        t.depositCents > 0 ? formatCurrency(t.depositCents) : ''
    ]);

    const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `balance-checker-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    showToast('CSV exported successfully', 'success');
}

function exportToJSON(transactions, startingBalanceCents) {
    const data = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        startingBalance: startingBalanceCents,
        transactions: transactions
    };

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `balance-checker-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    showToast('JSON backup exported successfully', 'success');
}

async function importFromJSON(file, mode = 'replace') {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (!data.version || !Array.isArray(data.transactions)) {
                    throw new Error('Invalid backup file format');
                }

                const existingTransactions = await getAllTransactions();
                const existingIds = new Set(existingTransactions.map(t => t.id));
                
                let transactionsToImport = data.transactions;
                
                if (mode === 'merge') {
                    transactionsToImport = data.transactions.filter(t => !existingIds.has(t.id));
                }

                if (transactionsToImport.length === 0 && mode === 'merge') {
                    showToast('No new transactions to import', 'info');
                    resolve({ imported: 0, skipped: data.transactions.length });
                    return;
                }

                for (const transaction of transactionsToImport) {
                    await updateTransaction(transaction);
                }

                if (data.startingBalance !== undefined && mode === 'replace') {
                    await setSetting('startingBalance', data.startingBalance);
                }

                showToast(`Imported ${transactionsToImport.length} transaction(s)`, 'success');
                resolve({ 
                    imported: transactionsToImport.length, 
                    skipped: mode === 'merge' ? data.transactions.length - transactionsToImport.length : 0 
                });
            } catch (error) {
                showToast('Failed to import: ' + error.message, 'error');
                reject(error);
            }
        };

        reader.onerror = () => {
            showToast('Failed to read file', 'error');
            reject(new Error('Failed to read file'));
        };

        reader.readAsText(file);
    });
}

function validateImportFile(file) {
    if (!file) return false;
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        showToast('Please select a JSON file', 'error');
        return false;
    }
    return true;
}
