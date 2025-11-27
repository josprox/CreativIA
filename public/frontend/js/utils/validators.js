/**
 * Client-side Validators
 * 
 * Validation utilities for forms.
 */

const Validators = {
    /**
     * Validate email format
     */
    isEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    /**
     * Validate minimum length
     */
    minLength(value, min) {
        return value.length >= min;
    },

    /**
     * Validate maximum length
     */
    maxLength(value, max) {
        return value.length <= max;
    },

    /**
     * Validate required field
     */
    required(value) {
        return value !== null && value !== undefined && value.trim() !== '';
    },

    /**
     * Validate numeric value
     */
    isNumeric(value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
    },

    /**
     * Validate file size
     */
    maxFileSize(file, maxBytes) {
        return file.size <= maxBytes;
    },

    /**
     * Validate file type
     */
    isFileType(file, allowedTypes) {
        return allowedTypes.includes(file.type);
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Validators;
}
