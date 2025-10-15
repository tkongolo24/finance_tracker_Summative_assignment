// Validate description (no leading/trailing spaces)
export function validateDescription(desc) {
    const regex = /^\S(?:.*\S)?$/;  
    return regex.test(desc);
}

// Validate amount (number with optional 2 decimals)
export function validateAmount(amount) {
    const regex = /^(0|[1-9]\d*)(\.\d{1,2})?$/;  
    return regex.test(amount);
}

// Validate date (YYYY-MM-DD)
export function validateDate(date) {
    const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;  
    return regex.test(date);
}

// Validate category (letters, spaces, hyphens)
export function validateCategory(cat) {
    const regex = /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/;  
    return regex.test(cat);
}