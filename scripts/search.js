export function compileRegex(pattern, isCaseSensitive) {
    if (!pattern.trim()) return null; 
    try {
        return new RegExp(pattern, isCaseSensitive ? '' : 'i');
    } catch (err) {
        return null; 
    }
}

export function searchTransactions(transactions, regex) {
    if (!regex) return transactions; 
    return transactions.filter(t =>
        regex.test(t.description) ||
        regex.test(t.category) ||
        regex.test(String(t.amount))
    );
}

export function highlightMatch(text, regex) {
    if (!regex) return text;
    return text.replace(regex, match => `<mark>${match}</mark>`);
}
