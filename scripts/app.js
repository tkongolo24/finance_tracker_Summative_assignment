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
    });

    // Search handlers (same level as sort!)
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
    const pattern = document.getElementById('search-input').value;
    const isCaseSensitive = document.getElementById('case-sensitive').checked;
    
    const regex = compileRegex(pattern, isCaseSensitive);
    
    if (pattern && !regex) {
        document.getElementById('search-error').textContent = 'Invalid regex pattern';
        return;
    }
    
    document.getElementById('search-error').textContent = '';
    
    const allTransactions = getTransactions();
    const filtered = searchTransactions(allTransactions, regex);
    
    renderFilteredResults(filtered, regex);
}

function handleClearSearch() {
    document.getElementById('search-input').value = '';
    document.getElementById('case-sensitive').checked = false;
    document.getElementById('search-error').textContent = '';
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
