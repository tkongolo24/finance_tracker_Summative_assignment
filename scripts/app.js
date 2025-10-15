import { initState, addTransaction, deleteTransaction, generateId, getTransactions } from './state.js';
import { renderTransactions, updateDashboard, clearForm, showError, clearError } from './ui.js';
import { validateDescription, validateAmount, validateDate, validateCategory } from './validators.js';

// Initialize app when page loads
document.addEventListener('DOMContentLoaded', function() {
    initState();
    renderTransactions();
    updateDashboard();
    
    // Set up form submit handler
    const form = document.getElementById('Add-form');
    form.addEventListener('submit', handleFormSubmit);

    // Set up delete button handler  
    const container = document.getElementById('transaction-container');
    container.addEventListener('click', handleDelete);
    
    // Set up error clearing
    document.getElementById('description').addEventListener('input', () => clearError('description'));
    document.getElementById('amount').addEventListener('input', () => clearError('amount'));
    document.getElementById('category').addEventListener('input', () => clearError('category'));
    document.getElementById('date').addEventListener('input', () => clearError('date'));
});
// For debugging - remove later
console.log("Form values:", description, amount, category, date);

// Handle form submission
function handleFormSubmit(event) {
    event.preventDefault();  
    
    // Get form values
    const description = document.getElementById('description').value;
    const amount = document.getElementById('amount').value;
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;
    
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