import {
  initState,
  addTransaction,
  deleteTransaction,
  generateId,
  getTransactions,
  sortTransactions
} from './state.js';

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

import {
  renderTransactions,
  updateDashboard,
  clearForm,
  showError,
  clearError,
  setFormToEditMode,
  setupCancelButton,
  setupBudgetPersistence
} from './ui.js';

// Globals
let currentFilteredTransactions = null;
let currentEditId = null;

// Populate form for edit
function populateFormForEdit(id) {
  const transactions = getTransactions();
  const t = transactions.find(tx => tx.id === id);
  if (!t) return;

  document.getElementById('description').value = t.description;
  document.getElementById('amount').value = t.amount;
  document.getElementById('category').value = t.category;
  document.getElementById('date').value = t.date;

  currentEditId = id;
  const submitBtn = document.querySelector('#Add-form button[type="submit"]');
  if (submitBtn) submitBtn.textContent = 'Update Transaction';
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Budget persistence
  const savedBudget = localStorage.getItem('budget');
  if (savedBudget) {
    document.getElementById('budget-cap').value = savedBudget;
  }

  initState();
  renderTransactions();
  updateDashboard();
  setupCancelButton();
  setupBudgetPersistence();

  const container = document.getElementById('transaction-container');

  // 🌙 Dark Mode
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
    });
  }

  // ===== BURGER MENU TOGGLE =====
document.addEventListener("DOMContentLoaded", () => {
  const burgerBtn = document.getElementById("burger-btn");
  const nav = document.querySelector("header nav");

  if (burgerBtn && nav) {
    burgerBtn.addEventListener("click", () => {
      nav.classList.toggle("active");
    });

    // Close menu when clicking a link (for mobile)
    const links = nav.querySelectorAll("a");
    links.forEach(link => {
      link.addEventListener("click", () => {
        nav.classList.remove("active");
      });
    });
  }
});


  // 📊 Charts (Chart.js)
  const topCategoryCtx = document.getElementById('top-category-graph')?.getContext('2d');
  const last7DaysCtx = document.getElementById('last-7-days-graph')?.getContext('2d');

  let topCategoryChart, last7DaysChart;
  if (topCategoryCtx && last7DaysCtx && typeof Chart !== 'undefined') {
    topCategoryChart = new Chart(topCategoryCtx, {
      type: 'bar',
      data: { labels: [], datasets: [{ label: 'Amount', data: [], backgroundColor: '#2e7d32' }] },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });

    last7DaysChart = new Chart(last7DaysCtx, {
      type: 'line',
      data: { labels: [], datasets: [{ label: 'Spent', data: [], borderColor: '#2e7d32', backgroundColor: 'rgba(46,125,50,0.2)', fill: true }] },
      options: { responsive: true }
    });
  }

  function updateGraphs() {
    if (!topCategoryChart || !last7DaysChart) return;

    const transactions = getTransactions();

    // Top Category
    const categoryTotals = {};
    transactions.forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    topCategoryChart.data.labels = Object.keys(categoryTotals);
    topCategoryChart.data.datasets[0].data = Object.values(categoryTotals);
    topCategoryChart.update();

    // Last 7 Days
    const today = new Date();
    const last7DaysLabels = [];
    const last7DaysData = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      const dayStr = day.toISOString().split('T')[0];
      last7DaysLabels.push(dayStr);
      const daySpent = transactions
        .filter(t => t.date === dayStr)
        .reduce((sum, t) => sum + t.amount, 0);
      last7DaysData.push(daySpent);
    }

    last7DaysChart.data.labels = last7DaysLabels;
    last7DaysChart.data.datasets[0].data = last7DaysData;
    last7DaysChart.update();
  }

  updateGraphs();

  // ✏️ Edit/Delete
  container.addEventListener('click', e => {
    if (e.target.classList.contains('btn-edit')) {
      populateFormForEdit(e.target.dataset.id);
    } else if (e.target.classList.contains('btn-delete')) {
      deleteTransaction(e.target.dataset.id);
      renderTransactions();
      updateDashboard();
    }
  });

  // 📝 Form submit
  const form = document.getElementById('Add-form');
  form.addEventListener('submit', e => handleFormSubmit(e, updateGraphs));

  // 💰 Budget input
  const budgetInput = document.getElementById('budget-cap');
  budgetInput.addEventListener('input', e => {
    localStorage.setItem('budget', e.target.value);
    updateDashboard();
  });

  // 🔍 Search
  document.getElementById('search-btn').addEventListener('click', handleSearch);
  document.getElementById('clear-search-btn').addEventListener('click', handleClearSearch);
});

// ✅ Handle form submission
function handleFormSubmit(event, updateGraphs) {
  event.preventDefault();

  const description = document.getElementById('description').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);
  let category = document.getElementById('category').value.trim();
  const date = document.getElementById('date').value;
  const budget = parseFloat(document.getElementById('budget-cap').value);
  const transactions = getTransactions();

  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
  if (!currentEditId && totalSpent + amount > budget) {
    return showError('amount', 'Adding this transaction exceeds your budget');
  }

  if (!validateDescription(description)) return showError('description', 'Invalid description');
  if (!validateAmount(amount)) return showError('amount', 'Invalid amount');
  if (!validateCategory(category)) return showError('category', 'Invalid category');
  if (!validateDate(date)) return showError('date', 'Invalid date');

  category = category[0].toUpperCase() + category.slice(1).toLowerCase();

  const newTransaction = {
    id: currentEditId || generateId(),
    description,
    amount,
    category,
    date,
    updatedAt: new Date().toISOString()
  };

  if (currentEditId) {
    deleteTransaction(currentEditId);
  }

  addTransaction(newTransaction);
  saveTransactions(getTransactions());
  renderTransactions();
  updateDashboard();
  updateGraphs();
  clearForm();

  currentEditId = null;
  document.querySelector('#Add-form button[type="submit"]').textContent = 'Save';
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
  if (!regex) {
    errorEl.textContent = 'Invalid regex pattern';
    return;
  }

  const filtered = searchTransactions(getTransactions(), regex);
  renderFilteredResults(filtered, regex);
}

function handleClearSearch() {
  document.getElementById('search-input').value = '';
  document.getElementById('case-sensitive').checked = false;
  currentFilteredTransactions = null;
  document.getElementById('search-error').textContent = '';
  renderTransactions();
}

function renderFilteredResults(transactions, regex) {
  const container = document.getElementById('transaction-container');
  currentFilteredTransactions = transactions;

  if (transactions.length === 0) {
    container.innerHTML = '<p>No transactions match your search.</p>';
    return;
  }

  container.innerHTML = transactions
    .map(t => `
      <div class="transaction">
        <p>${highlightMatch(t.description, regex)}</p>
        <p>$${highlightMatch(String(t.amount), regex)}</p>
        <p>${highlightMatch(t.category, regex)}</p>
        <p>${t.date}</p>
        <button class="btn-edit" data-id="${t.id}">Edit</button>
        <button class="btn-delete" data-id="${t.id}">Delete</button>
      </div>
    `)
    .join('');
}
