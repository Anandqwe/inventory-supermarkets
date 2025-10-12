/**
 * Validation utility functions for data validation
 */
const mongoose = require('mongoose');

class ValidationUtils {
  /**
   * Check if string is valid email format
   * @param {string} email - Email to validate
   * @returns {boolean} - True if valid email
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if string is valid phone number
   * @param {string} phone - Phone number to validate
   * @returns {boolean} - True if valid phone
   */
  static isValidPhone(phone) {
    // Indian phone number: 10 digits starting with 6-9
    // Accept formats: 9876543210, +919876543210, +91 9876543210, 91 9876543210
    const phoneRegex = /^[6-9]\d{9}$/;

    // Clean phone number: remove spaces, +, and country code
    const cleanedPhone = phone
      .replace(/\s+/g, '')        // Remove spaces
      .replace(/^\+91/, '')       // Remove +91 prefix
      .replace(/^91/, '')         // Remove 91 prefix
      .replace(/^\+/, '');        // Remove any other + prefix

    return phoneRegex.test(cleanedPhone);
  }

  /**
   * Check if string is valid password
   * @param {string} password - Password to validate
   * @returns {Object} - Validation result with isValid and errors
   */
  static validatePassword(password) {
    const errors = [];

    if (!password || password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if value is valid MongoDB ObjectId
   * @param {string} id - ID to validate
   * @returns {boolean} - True if valid ObjectId
   */
  static isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
  }

  /**
   * Sanitize string by removing special characters
   * @param {string} str - String to sanitize
   * @returns {string} - Sanitized string
   */
  static sanitizeString(str) {
    if (!str || typeof str !== 'string') return '';
    return str.trim().replace(/[<>\"']/g, '');
  }

  /**
   * Validate price value
   * @param {number} price - Price to validate
   * @returns {Object} - Validation result
   */
  static validatePrice(price) {
    const errors = [];

    if (price === undefined || price === null) {
      errors.push('Price is required');
    } else if (typeof price !== 'number') {
      errors.push('Price must be a number');
    } else if (price < 0) {
      errors.push('Price cannot be negative');
    } else if (price > 1000000) {
      errors.push('Price cannot exceed ₹10,00,000');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate quantity value
   * @param {number} quantity - Quantity to validate
   * @returns {Object} - Validation result
   */
  static validateQuantity(quantity) {
    const errors = [];

    if (quantity === undefined || quantity === null) {
      errors.push('Quantity is required');
    } else if (typeof quantity !== 'number') {
      errors.push('Quantity must be a number');
    } else if (quantity < 0) {
      errors.push('Quantity cannot be negative');
    } else if (!Number.isInteger(quantity)) {
      errors.push('Quantity must be a whole number');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate date string
   * @param {string} dateStr - Date string to validate
   * @returns {Object} - Validation result
   */
  static validateDate(dateStr) {
    const errors = [];
    const date = new Date(dateStr);

    if (!dateStr) {
      errors.push('Date is required');
    } else if (isNaN(date.getTime())) {
      errors.push('Invalid date format');
    }

    return {
      isValid: errors.length === 0,
      errors,
      date: errors.length === 0 ? date : null
    };
  }

  /**
   * Validate pagination parameters
   * @param {Object} params - Pagination parameters {page, limit}
   * @returns {Object} - Validated pagination parameters
   */
  static validatePagination(params) {
    const page = Math.max(1, parseInt(params.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(params.limit) || 10));

    return { page, limit };
  }

  /**
   * Validate sort parameters
   * @param {string} sortBy - Sort field
   * @param {string} sortOrder - Sort order (asc/desc)
   * @param {Array} allowedFields - Allowed sort fields
   * @returns {Object} - Validated sort parameters
   */
  static validateSort(sortBy, sortOrder, allowedFields = []) {
    const validSortBy = allowedFields.includes(sortBy) ? sortBy : 'createdAt';
    const validSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc';

    return {
      sortBy: validSortBy,
      sortOrder: validSortOrder,
      sortObj: { [validSortBy]: validSortOrder === 'asc' ? 1 : -1 }
    };
  }

  /**
   * Validate required fields in object
   * @param {Object} obj - Object to validate
   * @param {Array} requiredFields - Array of required field names
   * @returns {Object} - Validation result
   */
  static validateRequiredFields(obj, requiredFields) {
    const errors = [];
    const missing = [];

    for (const field of requiredFields) {
      if (!obj.hasOwnProperty(field) || obj[field] === undefined || obj[field] === null || obj[field] === '') {
        missing.push(field);
        errors.push(`${field} is required`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      missing
    };
  }

  /**
   * Validate Indian GST number format
   * @param {string} gst - GST number to validate
   * @returns {Object} - Validation result
   */
  static validateGST(gst) {
    const errors = [];

    if (!gst) {
      errors.push('GST number is required');
    } else {
      // GST format: 2 digits (state) + 10 digits (PAN) + 1 digit (entity) + 1 alphabet + 1 digit/alphabet
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(gst.toUpperCase())) {
        errors.push('Invalid GST number format');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Clean and validate search query
   * @param {string} query - Search query
   * @returns {string} - Cleaned search query
   */
  static cleanSearchQuery(query) {
    if (!query || typeof query !== 'string') return '';

    // Remove special regex characters and trim
    return query.trim()
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .slice(0, 100); // Limit length
  }
}

module.exports = ValidationUtils;
