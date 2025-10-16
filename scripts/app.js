import { 
    initState, 
    addTransaction, 
    deleteTransaction, 
    generateId, 
    getTransactions, 
    sortTransactions 
} from './state.js';

import { 
    renderTransactions, 
    updateDashboard, 
    clearForm, 
    showError, 
    clearError 
} from './ui.js';

import { 
    validateDescription, 
    validateAmount, 
    validateDate, 
    validateCategory 
} from './validators.js';

import { 
    compileRegex, 
    searchTransactions, 
    highlightMatch 
} from './search.js';

import { saveTransactions } from './storage.js';

let currentFilteredTransactions = null; 
let currentEditId = null;

// ✅ Used for editing
function populateFormForEdit(id) {
    const transactions = getTransactions();
    const t = transactions.find(tx => tx.id === id);
    if (!t) return;

    document.getElementById('description').value = t.description;
    document.getElementById('amount').value = t.amount;
    document.getElementById('category').value = t.category;
    document.getElementById('date').value = t.date;

    currentEditId = id;

    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) submitBtn.textContent = 'Update Transaction';
}

// ✅ Initialize everything
document.addEventListener('DOMContentLoaded', function() {
    initState();
    renderTransactions();
    updateDashboard();

    const container = document.getElementById('transaction-container');

    // ✅ Edit button handler
    container.addEventListener('click', function(event) {
        if (event.target.classList.contains('btn-edit')) {
            const id = event.target.getAttribute('data-id');
            populateFormForEdit(id);
        }
    });

    // ✅ Delete button handler
    container.addEventListener('click', handleDelete);

    // ✅ Form submit
    document.getElementById('Add-form').addEventListener('submit', handleFormSubmit);

    // ✅ Budget update
    const budgetInput = document.getElementById('budget-cap');
    budgetInput.addEventListener('input', updateDashboard);

    // ✅ Clear errors while typing
    document.getElementById('description').addEventListener('input', () => clearError('description'));
    document.getElementById('amount').addEventListener('input', () => clearError('amount'));
    document.getElementById('category').addEventListener('input', () => clearError('category'));
    document.getElementById('date').addEventListener('input', () => clearError('date'));

    // ✅ Sort
    const sortSelect = document.getElementById('sort-by');
    sortSelect.addEventListener('change', function() {
        const sortValue = this.value;
        sortTransactions(sortValue);
        renderTransactions();
    });

    // ✅ Export
    const exportBtn = document.getElementById('export-btn');
    exportBtn.addEventListener('click', () => {
        handleExport(currentFilteredTransactions || getTransactions());
    });

    // ✅ Import
    const importFile = document.getElementById('import-file');
    importFile.addEventListener('change', handleImport);

    // ✅ Search
    const searchBtn = document.getElementById('search-btn');
    searchBtn.addEventListener('click', handleSearch);

    const clearSearchBtn = document.getElementById('clear-search-btn');
    clearSearchBtn.addEventListener('click', handleClearSearch);

    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleSearch();
    });
});

// ✅ Form Submit Handler
function handleFormSubmit(event) {
    event.preventDefault();

    const description = document.getElementById('description').value;
    const amount = document.getElementById('amount').value;
    let category = document.getElementById('category').value;
    const date = document.getElementById('date').value;
    const budget = parseFloat(document.getElementById('budget-cap').value);
    const transactions = getTransactions();

    let totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);

    // Prevent overspending
    if (!currentEditId && totalSpent + parseFloat(amount) > budget) {
        showError('amount', 'Adding this transaction exceeds your budget');
        return;
    }

    // Normalize category
    category = category.trim();
    category = category[0].toUpperCase() + category.slice(1).toLowerCase();

    // Validation
    if (!validateDescription(description)) return showError('description', 'Invalid description');
    if (!validateAmount(amount)) return showError('amount', 'Invalid amount');
    if (!validateCategory(category)) return showError('category', 'Invalid category');
    if (!validateDate(date)) return showError('date', 'Invalid date');

    // ✅ Edit existing transaction
    if (currentEditId) {
        const index = transactions.findIndex(t => t.id === currentEditId);
        if (index !== -1) {
            transactions[index] = {
                ...transactions[index],
                description,
                amount: parseFloat(amount),
                category,
                date,
                updatedAt: new Date().toISOString()
            };
            saveTransactions(transactions);
            renderTransactions();
            updateDashboard();
            clearForm();
            currentEditId = null;
            document.getElementById('submit-btn').textContent = 'Add Transaction';
            alert('Transaction updated successfully!');
        }
        return;
    }

    // ✅ Add new transaction
    const transaction = {
        id: generateId(),
        description,
        amount: parseFloat(amount),
        category,
        date,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    addTransaction(transaction);
    renderTransactions();
    updateDashboard();
    clearForm();
}

// ✅ Delete
function handleDelete(event) {
    if (event.target.classList.contains('btn-delete')) {
        const id = event.target.getAttribute('data-id');
        deleteTransaction(id);
        renderTransactions();
        updateDashboard();
    }
}

// ✅ Export
function handleExport() {
    const transactions = getTransactions();
    const jsonString = JSON.stringify(transactions, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a'); 
    link.href = url;      
    link.download = 'transactions.json';
    link.click();
    URL.revokeObjectURL(url);
} 

// ✅ Import (fixed merging logic)
function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);

            if (!Array.isArray(data)) {
                showImportError('Invalid file format');
                return;
            }

            for (let t of data) {
                if (!t.id || !t.description || !t.amount || !t.category || !t.date) {
                    showImportError('Invalid transaction data');
                    return;
                }
            }

            const existingTransactions = getTransactions();
            const mergedTransactions = [...existingTransactions];

            for (let t of data) {
                if (!existingTransactions.some(et => et.id === t.id)) {
                    mergedTransactions.push(t);
                }
            }

            saveTransactions(mergedTransactions);
            initState();
            renderTransactions();
            updateDashboard();
            showImportSuccess(`Imported ${data.length} transactions successfully`);
        } catch (error) {
            showImportError('Error reading file');
        }
    };
    reader.readAsText(file);
}

// ✅ Import feedback
function showImportError(message) {
    const statusEl = document.getElementById('import-status');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.style.color = 'red';
        statusEl.style.display = 'block';
    }
}

function showImportSuccess(message) {
    const statusEl = document.getElementById('import-status');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.style.color = 'green';
        statusEl.style.display = 'block';
        setTimeout(() => {
            statusEl.textContent = '';
            statusEl.style.display = 'none';
        }, 3000);
    }
}

// ✅ Search
function handleSearch() {
    const pattern = document.getElementById('search-input').value.trim();
    const isCaseSensitive = document.getElementById('case-sensitive').checked;
    const errorEl = document.getElementById('search-error');

    if (!pattern) {
        errorEl.textContent = '';
        renderTransactions();
        return;
    }

    const regex = compileRegex(pattern, isCaseSensitive);
    if (!regex && pattern) {
        errorEl.textContent = 'Invalid regex pattern';
        return;
    }

    errorEl.textContent = '';
    const allTransactions = getTransactions();
    const filtered = searchTransactions(allTransactions, regex);
    renderFilteredResults(filtered, regex);
}

function handleClearSearch() {
    document.getElementById('search-input').value = '';
    document.getElementById('case-sensitive').checked = false;
    currentFilteredTransactions = null;

    const searchErrorEl = document.getElementById('search-error');
    if (searchErrorEl) {
        searchErrorEl.textContent = '';
        searchErrorEl.style.display = 'none';
    }

    renderTransactions(); 
}

function renderFilteredResults(transactions, regex) {
    const container = document.getElementById('transaction-container');
    currentFilteredTransactions = transactions; 

    if (transactions.length === 0) {
        container.innerHTML = '<p>No transactions match your search.</p>';
        return;
    }
    
    let html = '';
    for (let t of transactions) {
        const highlightedDesc = highlightMatch(t.description, regex);
        const highlightedAmount = highlightMatch(String(t.amount), regex);
        const highlightedCategory = highlightMatch(t.category, regex);

        html += `
            <div>
                <p>${highlightedDesc}</p>
                <p>$${highlightedAmount}</p>
                <p>${highlightedCategory}</p>
                <p>${t.date}</p>
                <button class="btn-edit" data-id="${t.id}">Edit</button>
                <button class="btn-delete" data-id="${t.id}">Delete</button>
            </div>`;
    }
    container.innerHTML = html;
}
