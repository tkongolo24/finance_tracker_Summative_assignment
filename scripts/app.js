import {
  initState,
  addTransaction,
  deleteTransaction,
  generateId,
  getTransactions
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
  setupCancelButton,
  setupBudgetPersistence
} from './ui.js';

import { initTheme } from './theme.js';

// 🌍 GLOBALS

let currentFilteredTransactions = null;
let currentEditId = null;

// ✏️ POPULATE FORM FOR EDIT

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

// 🚀 INITIALIZE

document.addEventListener('DOMContentLoaded', () => {
  // Load saved budget
  const savedBudget = localStorage.getItem('budget');
  if (savedBudget) {
    document.getElementById('budget-cap').value = savedBudget;
  }

  // 🔧 Initialize app
  initTheme();
  initState();
  renderTransactions();
  updateDashboard();
  setupCancelButton();
  setupBudgetPersistence();

  const container = document.getElementById('transaction-container');

  // DARK MODE
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
    });
  }

  // BURGER MENU TOGGLE (Fixed)
  const burgerBtn = document.getElementById('burger-btn');
  const nav = document.querySelector('header nav');
  if (burgerBtn && nav) {
    burgerBtn.addEventListener('click', () => {
      nav.classList.toggle('active');
    });
    const links = nav.querySelectorAll('a');
    links.forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('active');
      });
    });
  }

  // CHARTS (Chart.js)
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

  // Update chart data
  function updateGraphs() {
    if (!topCategoryChart || !last7DaysChart) return;
    const transactions = getTransactions();

    // Top Category chart
    const categoryTotals = {};
    transactions.forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });
    topCategoryChart.data.labels = Object.keys(categoryTotals);
    topCategoryChart.data.datasets[0].data = Object.values(categoryTotals);
    topCategoryChart.update();

    // Last 7 Days chart
    const today = new Date();
    const labels = [];
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      const dateStr = day.toISOString().split('T')[0];
      labels.push(dateStr);
      const dailySpent = transactions
        .filter(t => t.date === dateStr)
        .reduce((sum, t) => sum + t.amount, 0);
      data.push(dailySpent);
    }
    last7DaysChart.data.labels = labels;
    last7DaysChart.data.datasets[0].data = data;
    last7DaysChart.update();
  }

  updateGraphs();

  //  Edit/Delete Transaction
  container.addEventListener('click', e => {
    if (e.target.classList.contains('btn-edit')) {
      populateFormForEdit(e.target.dataset.id);
    } else if (e.target.classList.contains('btn-delete')) {
      deleteTransaction(e.target.dataset.id);
      renderTransactions();
      updateDashboard();
      updateGraphs();
    }
  });

  // Handle form submission
  const form = document.getElementById('Add-form');
  form.addEventListener('submit', e => handleFormSubmit(e, updateGraphs));

  // Budget input
  const budgetInput = document.getElementById('budget-cap');
  budgetInput.addEventListener('input', e => {
    localStorage.setItem('budget', e.target.value);
    updateDashboard();
  });

  // Search
  document.getElementById('search-btn').addEventListener('click', handleSearch);
  document.getElementById('clear-search-btn').addEventListener('click', handleClearSearch);

  // Theme Toggle
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        // Check saved theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        // Update button emoji
        themeBtn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
        
        // Toggle on click
        themeBtn.addEventListener('click', function() {
            const html = document.documentElement;
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            themeBtn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        });
    }
});

// HANDLE FORM SUBMISSION

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

  if (currentEditId) deleteTransaction(currentEditId);

  addTransaction(newTransaction);
  saveTransactions(getTransactions());
  renderTransactions();
  updateDashboard();
  updateGraphs();
  clearForm();

  currentEditId = null;
  document.querySelector('#Add-form button[type="submit"]').textContent = 'Save';
}

// SEARCH SYSTEM

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

// IMPORT / EXPORT SYSTEM

// Handle Export
document.addEventListener('DOMContentLoaded', () => {
  const exportBtn = document.getElementById('export-btn');
  const importInput = document.getElementById('import-file');
  const importStatus = document.getElementById('import-status');

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const transactions = getTransactions();
      const json = JSON.stringify(transactions, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'student_finance_data.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      importStatus.textContent = 'Data exported successfully!';
      setTimeout(() => (importStatus.textContent = ''), 3000);
    });
  }

  // Handle Import
  if (importInput) {
    importInput.addEventListener('change', event => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = e => {
        try {
          const data = JSON.parse(e.target.result);
          if (Array.isArray(data)) {
            // Save to localStorage and update UI
            localStorage.setItem('finance_tracker_data', JSON.stringify(data));
            renderTransactions();
            updateDashboard();
            importStatus.textContent = 'Data imported successfully!';
          } else {
            importStatus.textContent = 'Invalid file format.';
          }
        } catch (err) {
          console.error('Import error:', err);
          importStatus.textContent = 'Failed to import file.';
        }

        // Clear file input so same file can be re-imported later
        importInput.value = '';
        setTimeout(() => (importStatus.textContent = ''), 3000);
      };
      reader.readAsText(file);
    });
  }
});

// Theme toggle at the end
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const html = document.documentElement;
        const savedTheme = localStorage.getItem('theme') || 'light';
        html.setAttribute('data-theme', savedTheme);
        
        themeToggle.addEventListener('click', function() {
            const current = html.getAttribute('data-theme');
            const newTheme = current === 'light' ? 'dark' : 'light';
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
        });
    } else {
        console.log('Theme toggle button not found!');
    }


