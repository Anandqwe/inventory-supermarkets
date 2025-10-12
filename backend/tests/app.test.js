const request = require('supertest');
const app = require('../app');

describe('Application Health', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Server is running');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.environment).toBeDefined();
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should include rate limit headers', async () => {
      // Make a simple GET request to a public endpoint to trigger rate limiting
      const response = await request(app)
        .get('/health')
        .expect(200);

      // Check for rate limit headers (either standard or legacy format)
      const hasRateLimit = response.headers['ratelimit-limit'] ||
                          response.headers['x-ratelimit-limit'] ||
                          response.headers['x-rate-limit-limit'];
      const hasRemaining = response.headers['ratelimit-remaining'] ||
                          response.headers['x-ratelimit-remaining'] ||
                          response.headers['x-rate-limit-remaining'];

      // At least one rate limit header should be present
      expect(hasRateLimit || hasRemaining).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should handle invalid JSON', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});
