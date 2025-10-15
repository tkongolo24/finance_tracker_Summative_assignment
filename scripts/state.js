import { loadTransactions, saveTransactions } from './storage.js';

// The main data array
let transactions = [];

// Initialize - load from storage
export function initState() {
    transactions = loadTransactions();
}
// Get all transactions
export function getTransactions() {
    return transactions;
}

// Add new transaction
export function addTransaction(transaction) {
    transactions.push(transaction);
    saveTransactions(transactions);  
}

// Delete transaction by id
export function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions(transactions);
}

// Generate unique ID
export function generateId() {
    return 'txn_' + Date.now();
}