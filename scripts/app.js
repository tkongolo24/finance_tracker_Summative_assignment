import { initState, addTransaction, deleteTransaction, generateId, getTransactions } from './state.js';
import { renderTransactions, updateDashboard, clearForm, showError } from './ui.js';
import { validateDescription, validateAmount, validateDate, validateCategory } from './validators.js';

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', function() {
    initState();
    renderTransactions();
    updateDashboard();
    
    //set up form submit handler
    const form = document.getElementById('Add-form');
    form.addEventListener('submit', handleFormSubmit);

    //set up delete button handler  
    const container = document.getElementById('transaction-container');
    container.addEventListener('click', handleDelete);
});

// Handle form submission
function handleFormSubmit(event) {
    event.preventDefault();  
    
    // 1. Get form values
    const description = document.getElementById('description').value;
    const amount = document.getElementById('amount').value;
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;
    
    // 2. Validate each field
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
    
    // 3. Create transaction object
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
    return false;
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