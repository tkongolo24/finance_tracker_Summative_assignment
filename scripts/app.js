import { initState, addTransaction, deleteTransaction, generateId, getTransactions, sortTransactions } from './state.js';
import { renderTransactions, updateDashboard, clearForm, showError, clearError } from './ui.js';
import { validateDescription, validateAmount, validateDate, validateCategory } from './validators.js';
import { compileRegex, searchTransactions, highlightMatch } from './search.js';

document.addEventListener('DOMContentLoaded', function() {
    initState();
    renderTransactions();
    updateDashboard();
    
    // Form handler
    const form = document.getElementById('Add-form');
    form.addEventListener('submit', handleFormSubmit);

    // Delete handler  
    const container = document.getElementById('transaction-container');
    container.addEventListener('click', handleDelete);

    // Budget handler
    const budgetInput = document.getElementById('budget-cap');
    budgetInput.addEventListener('input', updateDashboard);
    
    // Error clearing
    document.getElementById('description').addEventListener('input', () => clearError('description'));
    document.getElementById('amount').addEventListener('input', () => clearError('amount'));
    document.getElementById('category').addEventListener('input', () => clearError('category'));
    document.getElementById('date').addEventListener('input', () => clearError('date'));

    // Sort handler
    const sortSelect = document.getElementById('sort-by');
    sortSelect.addEventListener('change', function() {
        const sortValue = this.value;
        sortTransactions(sortValue);
        renderTransactions();


// export button
const exportBtn =document.getElementById ('exportBtn');
exportBtn.addEventListener('click', handleExport);
 // Import button 
 const importFile = document.getElementById('import-file') 
 importFile.addEventListener('change', handleImport);   

function handleExport() {
    const transactions = getTransactions();
    const jsonString = JSON.stringify(transactions, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    link.href = url;
    link.download = 'transactions.json';

    link.click();
    URL.revokeObjectURL(url);

function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (Array.isArray(data)) {
                showImportError('Invalid file format');
                return;
            }
            for (let t of data) {
                if (!t.id || !t.description || !t.amount || !t.category || !t.date) {
                    showImportError('Invalid transaction data');
                    return;
                }
            }
        // saveto local storage

        // re-render
        renderTransactions();
        updateDashboard();
        }

        showImportSuccess('Imported ${data.length} transactions successfully');

    }catch (error) {
        showImportError('Error reading file');
    }
    reader.readAsText(file);
}
function showImportError(message) {
    const importErrorEl = document.getElementById('import-error');
    importErrorEl.textContent = message;
    importErrorEl.style.display = 'block';
    importErrorEl.style.color = 'red';
}
function showImportSuccess(message) {
    const statusEl = document.getElementById('import-status');
    statusEl.textContent = message;
    statusEl.style.display = 'block';
    statusEl.style.color = 'green';

    setTimeout(() => {
        statusEl.style.display = '';
    }, 3000);
}
});


    // Search handlers 
    const searchBtn = document.getElementById('search-btn');
    searchBtn.addEventListener('click', handleSearch);

    const clearSearchBtn = document.getElementById('clear-search-btn');
    clearSearchBtn.addEventListener('click', handleClearSearch);

    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
});

// Functions OUTSIDE DOMContentLoaded

function handleSearch() {
    const pattern = document.getElementById('search-input').value.trim();
    const isCaseSensitive = document.getElementById('case-sensitive').checked;
    const errorEl = document.getElementById('search-error');

    // If input is empty → show all transactions
    if (!pattern) {
        errorEl.textContent = '';
        renderTransactions();
        return;
    }

    const regex = compileRegex(pattern, isCaseSensitive);

    // If regex is invalid
    if (!regex && pattern) {
        errorEl.textContent = 'Invalid regex pattern';
        return;
    }

    // If regex is valid
    errorEl.textContent = '';

    const allTransactions = getTransactions();
    const filtered = searchTransactions(allTransactions, regex);
    renderFilteredResults(filtered, regex);
}

function handleClearSearch() {
    document.getElementById('search-input').value = '';
    document.getElementById('case-sensitive').checked = false;
    const searchErrorEl = document.getElementById('search-error');
    if (searchErrorEl) {
    searchErrorEl.textContent = '';
    searchErrorEl.style.display = 'none';
}

    renderTransactions();  // Show all again
}

function renderFilteredResults(transactions, regex) {
    const container = document.getElementById('transaction-container');
    
    if (transactions.length === 0) {
        container.innerHTML = '<p>No transactions match your search.</p>';
        return;
    }
    
    let html = '';
    for (let t of transactions) {
        const highlightedDesc = highlightMatch(t.description, regex);  // ✅ Correct variable name
        
        html += `
        <div>
            <p>${highlightedDesc}</p>
            <p>$${t.amount}</p>
            <p>${t.category}</p>
            <p>${t.date}</p>
            <button class="btn-delete" data-id="${t.id}">Delete</button>
        </div>`;
    }
    container.innerHTML = html;
}




// Handle form submission
function handleFormSubmit(event) {
    event.preventDefault();  
    
    // Get form values
    const description = document.getElementById('description').value;
    const amount = document.getElementById('amount').value;
    let category = document.getElementById('category').value;
    const date = document.getElementById('date').value;
    const budget = parseFloat(document.getElementById('budget-cap').value);
    const transactions = getTransactions();
    let totalSpent = 0;
    for (let t of transactions) {
        totalSpent += t.amount;
    }
    if (totalSpent + parseFloat(amount) > budget) {
        showError('amount', 'Adding this transaction exceeds your budget');
        return;
    }

    // Normalize category
category = category.trim(); 
category = category[0].toUpperCase() + category.slice(1).toLowerCase();


    // Validate each field
    if (!validateDescription(description)) {
        showError('description', 'Invalid description');
        return;
    }
    if (!validateAmount(amount)) {
        showError('amount', 'Invalid amount');
        return;
    }
    if (!validateCategory(category)) {
        showError('category', 'Invalid category');
        return;
    }   
    if (!validateDate(date)) {
        showError('date', 'Invalid date');
        return;
    }
    
    // Create transaction object
    const transaction = {
        id: generateId(),
        description: description,
        amount: parseFloat(amount),
        category: category,
        date: date,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    
    addTransaction(transaction);
    renderTransactions();
    updateDashboard();
    clearForm();
}

// Handle delete button clicks
function handleDelete(event) {
    if (event.target.classList.contains('btn-delete')) {
        const id = event.target.getAttribute('data-id');
        deleteTransaction(id);
        renderTransactions();
        updateDashboard(); 
    }
}
