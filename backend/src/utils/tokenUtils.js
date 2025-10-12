const jwt = require('jsonwebtoken');

/**
 * JWT token utilities
 */
class TokenUtils {
  /**
   * Generate JWT token for user
   * @param {Object} user - User object
   * @returns {string} JWT token
   */
  static generateToken(user) {
    const payload = {
      id: user._id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      branch: user.branch?._id || user.branch // Include branch ID if available
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      issuer: 'inventory-supermarkets',
      audience: 'supermarket-users'
    });
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @returns {Object} Decoded token payload
   */
  static verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'inventory-supermarkets',
      audience: 'supermarket-users'
    });
  }

  /**
   * Extract token from Authorization header
   * @param {string} authHeader - Authorization header value
   * @returns {string|null} Token or null
   */
  static extractToken(authHeader) {
    if (!authHeader) return null;

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

    return parts[1];
  }

  /**
   * Generate refresh token
   * @param {Object} user - User object
   * @returns {string} Refresh token
   */
  static generateRefreshToken(user) {
    const payload = {
      id: user._id,
      type: 'refresh'
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '7d',
      issuer: 'inventory-supermarkets'
    });
  }
}

module.exports = TokenUtils;
