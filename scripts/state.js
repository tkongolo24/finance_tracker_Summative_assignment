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

export function sortTransactions(sortBy) {
    if (sortBy === 'date-desc') {
        transactions.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB - dateA;
        });
    }
    else if (sortBy === 'date-asc') {
        transactions.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateA - dateB;
        });
    }
    else if (sortBy === 'amount-desc') {
        transactions.sort((a, b) => {
            return b.amount - a.amount;
        });
    }
    else if (sortBy === 'amount-asc') {
        transactions.sort((a, b) => {
            return a.amount - b.amount;
        });
    }
    else if (sortBy === 'description-asc') {
        transactions.sort((a, b) => {
             return a.description.localeCompare(b.description);
        });
    }
    else if (sortBy === 'description-desc') {
        transactions.sort((a, b) => {
            return b.description.localeCompare(a.description);
        });
    }
}
export function getTransactionsById(id) {
    return transactions.find(t => t.id === id);
}

export function updateTransaction(updatedTransaction) {
    transactions = transactions.map(t =>{
        if (t.id === id) {
            return {...t, ...updatedTransaction, updatedAt: new Date().toISOString()};
        }
        return t;
    });
    saveTransactions(transactions);
    }