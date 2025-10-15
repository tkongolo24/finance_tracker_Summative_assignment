import { getTransactions } from './state.js';

// Render transactions to the page
export function renderTransactions() {
    const transactions = getTransactions();
    const container = document.getElementById('transaction-container');
    if (transactions.length === 0) {
        container.innerHTML = '<p>No transactions yet</p>';
        return;
    }
    let html = '';
    for (let t of transactions) {
        html += `<div>`;
        html +='<p>' + t.description + '</p>';
        html +='<p>$' + t.amount + '</p>';
        html +='<p>' + t.category + '</p>';
        html +='<p>' + t.date + '</p>';
        html += '<button data-id="' + t.id + '">Delete</button>';
        html += '</div>';
    }
    container.innerHTML = html;
}
export function clearForm() {
    document.getElementById('Add-form').reset();
}
export function showError(fieldId, message) {
    const errorElement = document.getElementById(fieldId + '-error');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

// Update dashboard stats
export function updateDashboard() {
    const transactions = getTransactions();
    
    // 1. Total count
    const totalCount = transactions.length;
    document.getElementById('total-count').textContent = totalCount;
    
    // 2. Total spent
    let totalSpent = 0;
    for (let t of transactions) {
        totalSpent += t.amount;
    }
    document.getElementById('total-spent').textContent = '$' + totalSpent.toFixed(2);
    
    // 3. Top category (harder - skip for now if confused)
    let categoryTotals = {};
    for (let t of transactions) {
        if (!categoryTotals[t.category]) {
            categoryTotals[t.category] = 0;
        }
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
    
    // 4. Last 7 days
    const today = new Date();
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    let last7Days = 0;
    for (let t of transactions) {
        const tDate = new Date(t.date);
        if (tDate >= sevenDaysAgo) {
            last7Days += t.amount;  
        }
    }
    document.getElementById('last-7-days').textContent = '$' + last7Days.toFixed(2);
}