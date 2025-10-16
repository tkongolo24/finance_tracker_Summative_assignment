export function compileRegex(pattern, isCaseSensitive) {
    if (!pattern) return null;

    try {
        const flags = isCaseSensitive ? 'g' : 'gi';
        return new RegExp(pattern, flags);
    }   catch (error) {
        return null;
    }
}

export function searchTransactions(transactions, regex) {
    if (!regex) return transactions;
    return transactions.filter(t => {
        regex.test(t.description)
        regex.test(t.category)
        regex.test(t.date)
    });
}

export function highlightMatch(text, regex) {
    if (!regex) return text;
    return text.replace(regex, match => `<mark>${match}</mark>`);
}