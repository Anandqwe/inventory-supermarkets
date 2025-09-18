const DOMPurify = require('isomorphic-dompurify');
const validator = require('validator');

/**
 * Input Sanitization Middleware
 * Sanitizes and validates input data to prevent XSS, injection attacks, and data corruption
 */

/**
 * Main sanitization middleware
 */
const sanitizeInput = (options = {}) => {
  return (req, res, next) => {
    try {
      // Sanitize request body
      if (req.body && typeof req.body === 'object') {
        req.body = sanitizeObject(req.body, options);
      }
      
      // Sanitize query parameters
      if (req.query && typeof req.query === 'object') {
        req.query = sanitizeObject(req.query, options);
      }
      
      // Sanitize route parameters
      if (req.params && typeof req.params === 'object') {
        req.params = sanitizeObject(req.params, options);
      }
      
      next();
    } catch (error) {
      console.error('Input sanitization error:', error);
      res.status(400).json({
        success: false,
        message: 'Invalid input data format'
      });
    }
  };
};

/**
 * Sanitize object recursively
 */
function sanitizeObject(obj, options = {}) {
  if (!obj || typeof obj !== 'object') {
    return sanitizeValue(obj, options);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, options));
  }
  
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    const sanitizedKey = sanitizeKey(key);
    
    if (sanitizedKey) {
      if (typeof value === 'object' && value !== null) {
        sanitized[sanitizedKey] = sanitizeObject(value, options);
      } else {
        sanitized[sanitizedKey] = sanitizeValue(value, options, sanitizedKey);
      }
    }
  }
  
  return sanitized;
}

/**
 * Sanitize object key
 */
function sanitizeKey(key) {
  if (typeof key !== 'string') {
    return null;
  }
  
  // Remove potentially dangerous characters from keys
  const sanitized = key.replace(/[^a-zA-Z0-9_\-\.]/g, '');
  
  // Reject if key is empty after sanitization
  if (!sanitized) {
    return null;
  }
  
  // Reject keys that are too long
  if (sanitized.length > 100) {
    return null;
  }
  
  return sanitized;
}

/**
 * Sanitize individual value
 */
function sanitizeValue(value, options = {}, key = '') {
  if (value === null || value === undefined) {
    return value;
  }
  
  // Handle different data types
  switch (typeof value) {
    case 'string':
      return sanitizeString(value, options, key);
    
    case 'number':
      return sanitizeNumber(value, options);
    
    case 'boolean':
      return value;
    
    case 'object':
      if (value instanceof Date) {
        return value;
      }
      // For objects, recursively sanitize
      return sanitizeObject(value, options);
    
    default:
      return value;
  }
}

/**
 * Sanitize string values
 */
function sanitizeString(str, options = {}, key = '') {
  if (typeof str !== 'string') {
    return str;
  }
  
  // Length validation
  const maxLength = options.maxStringLength || 10000;
  if (str.length > maxLength) {
    throw new Error(`String too long for field '${key}': ${str.length} > ${maxLength}`);
  }
  
  // Check for specific field types
  const fieldType = getFieldType(key);
  
  switch (fieldType) {
    case 'email':
      return sanitizeEmail(str);
    
    case 'url':
      return sanitizeUrl(str);
    
    case 'phone':
      return sanitizePhone(str);
    
    case 'password':
      // Don't sanitize passwords, just validate length and characters
      return validatePassword(str);
    
    case 'html':
      return sanitizeHtml(str, options);
    
    case 'text':
    default:
      return sanitizeText(str, options);
  }
}

/**
 * Get field type based on key name
 */
function getFieldType(key) {
  key = key.toLowerCase();
  
  if (key.includes('email')) return 'email';
  if (key.includes('url') || key.includes('website') || key.includes('link')) return 'url';
  if (key.includes('phone') || key.includes('mobile') || key.includes('tel')) return 'phone';
  if (key.includes('password') || key.includes('pwd')) return 'password';
  if (key.includes('description') || key.includes('content') || key.includes('html')) return 'html';
  
  return 'text';
}

/**
 * Sanitize email
 */
function sanitizeEmail(email) {
  if (!email) return email;
  
  // Basic email sanitization
  email = email.trim().toLowerCase();
  
  // Validate email format
  if (!validator.isEmail(email)) {
    throw new Error('Invalid email format');
  }
  
  return email;
}

/**
 * Sanitize URL
 */
function sanitizeUrl(url) {
  if (!url) return url;
  
  url = url.trim();
  
  // Validate URL format
  if (!validator.isURL(url, {
    protocols: ['http', 'https'],
    require_protocol: true
  })) {
    throw new Error('Invalid URL format');
  }
  
  return url;
}

/**
 * Sanitize phone number
 */
function sanitizePhone(phone) {
  if (!phone) return phone;
  
  // Remove all non-digit and non-plus characters
  phone = phone.replace(/[^\d+\-\s\(\)]/g, '');
  
  // Basic length validation
  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    throw new Error('Invalid phone number length');
  }
  
  return phone.trim();
}

/**
 * Validate password
 */
function validatePassword(password) {
  if (!password) return password;
  
  // Length validation
  if (password.length < 6 || password.length > 128) {
    throw new Error('Password length must be between 6 and 128 characters');
  }
  
  // Check for null bytes and other dangerous characters
  if (password.includes('\0') || password.includes('\u0000')) {
    throw new Error('Password contains invalid characters');
  }
  
  return password;
}

/**
 * Sanitize HTML content
 */
function sanitizeHtml(html, options = {}) {
  if (!html) return html;
  
  const allowedTags = options.allowedHtmlTags || [
    'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote'
  ];
  
  const allowedAttributes = options.allowedHtmlAttributes || ['class', 'id'];
  
  // Use DOMPurify to sanitize HTML
  const config = {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: allowedAttributes,
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false
  };
  
  return DOMPurify.sanitize(html, config);
}

/**
 * Sanitize regular text
 */
function sanitizeText(text, options = {}) {
  if (!text) return text;
  
  // Trim whitespace
  text = text.trim();
  
  // Remove null bytes
  text = text.replace(/\0/g, '');
  
  // Remove or escape potentially dangerous characters
  if (options.strictMode) {
    // In strict mode, only allow alphanumeric, spaces, and basic punctuation
    text = text.replace(/[^a-zA-Z0-9\s\.\,\!\?\-\_\(\)\[\]]/g, '');
  } else {
    // Remove only the most dangerous characters
    text = text.replace(/[\<\>\"\'\&]/g, (match) => {
      const entityMap = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entityMap[match];
    });
  }
  
  // Normalize whitespace
  text = text.replace(/\s+/g, ' ');
  
  return text;
}

/**
 * Sanitize number values
 */
function sanitizeNumber(num, options = {}) {
  if (typeof num !== 'number') {
    return num;
  }
  
  // Check for infinity and NaN
  if (!isFinite(num)) {
    throw new Error('Invalid number: must be finite');
  }
  
  // Range validation
  const min = options.minNumber || Number.MIN_SAFE_INTEGER;
  const max = options.maxNumber || Number.MAX_SAFE_INTEGER;
  
  if (num < min || num > max) {
    throw new Error(`Number out of range: ${num} not between ${min} and ${max}`);
  }
  
  return num;
}

/**
 * Middleware for specific data type validation
 */
const validateDataTypes = (schema) => {
  return (req, res, next) => {
    try {
      if (req.body && schema) {
        validateObjectSchema(req.body, schema);
      }
      next();
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Data validation failed',
        errors: [error.message]
      });
    }
  };
};

/**
 * Validate object against schema
 */
function validateObjectSchema(obj, schema) {
  for (const [key, rules] of Object.entries(schema)) {
    const value = obj[key];
    
    // Check required fields
    if (rules.required && (value === undefined || value === null || value === '')) {
      throw new Error(`Field '${key}' is required`);
    }
    
    // Skip validation if field is not present and not required
    if (value === undefined || value === null) {
      continue;
    }
    
    // Type validation
    if (rules.type && typeof value !== rules.type) {
      throw new Error(`Field '${key}' must be of type ${rules.type}`);
    }
    
    // String-specific validations
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        throw new Error(`Field '${key}' must be at least ${rules.minLength} characters long`);
      }
      
      if (rules.maxLength && value.length > rules.maxLength) {
        throw new Error(`Field '${key}' must be no more than ${rules.maxLength} characters long`);
      }
      
      if (rules.pattern && !rules.pattern.test(value)) {
        throw new Error(`Field '${key}' does not match required pattern`);
      }
    }
    
    // Number-specific validations
    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        throw new Error(`Field '${key}' must be at least ${rules.min}`);
      }
      
      if (rules.max !== undefined && value > rules.max) {
        throw new Error(`Field '${key}' must be no more than ${rules.max}`);
      }
    }
    
    // Array-specific validations
    if (Array.isArray(value)) {
      if (rules.minItems && value.length < rules.minItems) {
        throw new Error(`Field '${key}' must have at least ${rules.minItems} items`);
      }
      
      if (rules.maxItems && value.length > rules.maxItems) {
        throw new Error(`Field '${key}' must have no more than ${rules.maxItems} items`);
      }
    }
    
    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      throw new Error(`Field '${key}' must be one of: ${rules.enum.join(', ')}`);
    }
  }
}

/**
 * Rate limiting for input validation failures
 */
const validationRateLimit = new Map();

const trackValidationFailure = (req) => {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  
  if (!validationRateLimit.has(ip)) {
    validationRateLimit.set(ip, []);
  }
  
  const failures = validationRateLimit.get(ip);
  
  // Remove old failures outside the window
  const recentFailures = failures.filter(time => now - time < windowMs);
  recentFailures.push(now);
  
  validationRateLimit.set(ip, recentFailures);
  
  // Check if too many failures
  if (recentFailures.length > 10) {
    throw new Error('Too many validation failures. Please try again later.');
  }
};

module.exports = {
  sanitizeInput,
  validateDataTypes,
  trackValidationFailure
};