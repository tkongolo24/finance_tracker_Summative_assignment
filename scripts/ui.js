import { getTransactions } from './state.js';

// Render transactions to the page
export function renderTransactions(currentEditId = null) {
    const transactions = getTransactions();
    const container = document.getElementById('transaction-container');
    if (transactions.length === 0) {
        container.innerHTML = '<p>No transactions yet</p>';
        return;
    }

    let html = '';
    for (let t of transactions) {
        const editingClass = t.id === currentEditId ? 'editing' : '';
        html += `
        <div class="transaction-item ${editingClass}" id="txn-${t.id}">
            <p>${t.description}</p>
            <p>$${t.amount}</p>
            <p>${t.category}</p>
            <p>${t.date}</p>
            <button class="btn-edit" data-id="${t.id}">Edit</button>
            <button class="btn-delete" data-id="${t.id}">Delete</button>
        </div>`;
    }
    container.innerHTML = html;
}

// Set form to edit or add mode
export function setFormToEditMode(isEdit) {
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) submitBtn.textContent = isEdit ? 'Update Transaction' : 'Add Transaction';
}

// Clear form
export function clearForm() {
    document.getElementById('Add-form').reset();
    setFormToEditMode(false);
}

// Show error
export function showError(fieldId, message) {
    const errorElement = document.getElementById(fieldId + '-error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

// Clear error
export function clearError(fieldId) {
    const errorElement = document.getElementById(fieldId + '-error');
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }
}

// Update dashboard stats
export function updateDashboard() {
    const transactions = getTransactions();

    // Total count
    const totalCount = transactions.length;
    document.getElementById('total-count').textContent = totalCount;

    // Total spent
    const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
    document.getElementById('total-spent').textContent = `$${totalSpent.toFixed(2)}`;

    // Top category
    let categoryTotals = {};
    for (let t of transactions) {
        if (!categoryTotals[t.category]) categoryTotals[t.category] = 0;
        categoryTotals[t.category] += t.amount;
    }

    let topCategory = 'none';
    let maxAmount = 0;
    for (let cat in categoryTotals) {
        if (categoryTotals[cat] > maxAmount) {
            maxAmount = categoryTotals[cat];
            topCategory = cat;
        }
    }
    document.getElementById('top-category').textContent = topCategory;

    // Last 7 days
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last7Days = transactions.reduce((sum, t) => {
        const tDate = new Date(t.date);
        return tDate >= sevenDaysAgo ? sum + t.amount : sum;
    }, 0);
    document.getElementById('last-7-days').textContent = `$${last7Days.toFixed(2)}`;

    // Budget status
    const budgetInput = document.getElementById('budget-cap');
    const budget = parseFloat(budgetInput.value) || 0; 
    const remaining = budget - totalSpent;
    const statusEl = document.getElementById('budget-status');

    if (!budget || budget <= 0) {
        statusEl.textContent = 'Please set a valid budget.';
        statusEl.style.color = 'gray';
    } else if (remaining >= 0) {
        statusEl.textContent = `You have $${remaining.toFixed(2)} remaining.`;
        statusEl.style.color = 'green';
    } else {
        statusEl.textContent = `You are over budget by $${Math.abs(remaining).toFixed(2)}.`;
        statusEl.style.color = 'red';
    }
}

// Highlight search matches
export function highlightMatch(text, regex) {
    if (!regex) return text;
    return text.replace(regex, match => `<mark>${match}</mark>`);
}

// Cancel button handler
export function setupCancelButton(currentEditIdRef) {
    const cancelBtn = document.getElementById('cancel-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            clearForm();
            if (currentEditIdRef) currentEditIdRef.current = null;
        });
    }
}

// Save/load budget from localStorage
export function setupBudgetPersistence() {
    const budgetInput = document.getElementById('budget-cap');
    if (!budgetInput) return;

    // Save budget on input
    budgetInput.addEventListener('input', (e) => {
        localStorage.setItem('budget', e.target.value);
        updateDashboard();
    });

    // Load budget on page load
    document.addEventListener('DOMContentLoaded', () => {
        const savedBudget = localStorage.getItem('budget');
        if (savedBudget) {
            budgetInput.value = savedBudget;
            updateDashboard();
        }
    });
}
