const STORAGE_KEY = 'finance_tracker_data';

export function loadTransactions() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

export function saveTransactions(transactions) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}