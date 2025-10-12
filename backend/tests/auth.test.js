const request = require('supertest');
const app = require('../app');
const User = require('../src/models/User');

describe('Auth Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      // Create a manager user first
      const managerUser = await global.testHelpers.createTestUser({
        role: 'Manager',
        email: 'manager@example.com'
      });
      const managerToken = global.testHelpers.generateTestToken(managerUser._id, 'Manager');

      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123!',
        role: 'Cashier',
        branch: '507f1f77bcf86cd799439011'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.data.token).toBeDefined();
    });

    it('should not register user with duplicate email', async () => {
      // Create a manager user first
      const managerUser = await global.testHelpers.createTestUser({
        role: 'Manager',
        email: 'manager@example.com'
      });
      const managerToken = global.testHelpers.generateTestToken(managerUser._id, 'Manager');

      // Create user first
      await global.testHelpers.createTestUser({ email: 'test@example.com' });

      const userData = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'Password123!',
        role: 'Cashier',
        branch: '507f1f77bcf86cd799439011'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should validate required fields', async () => {
      // Create a manager user first
      const managerUser = await global.testHelpers.createTestUser({
        role: 'Manager',
        email: 'manager@example.com'
      });
      const managerToken = global.testHelpers.generateTestToken(managerUser._id, 'Manager');

      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          firstName: 'John',
          lastName: 'Doe'
          // Missing email and password
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user with valid credentials', async () => {
      const user = await global.testHelpers.createTestUser({
        email: 'john@example.com'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'Password123!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('john@example.com');
      expect(response.body.data.token).toBeDefined();
    });

    it('should not login with invalid credentials', async () => {
      await global.testHelpers.createTestUser({
        email: 'john@example.com'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid');
    });

    it('should not login non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should get user profile with valid token', async () => {
      const user = await global.testHelpers.createTestUser();
      const token = global.testHelpers.generateTestToken(user._id);

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(user.email);
      expect(response.body.data.password).toBeUndefined();
    });

    it('should not get profile without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should not get profile with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update user profile', async () => {
      const user = await global.testHelpers.createTestUser();
      const token = global.testHelpers.generateTestToken(user._id);

      const updateData = {
        fullName: 'Updated Name',
        phone: '9876543210'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('Updated');
      expect(response.body.data.lastName).toBe('Name');
      expect(response.body.data.phone).toBe('9876543210');
    });

    it('should change password with valid current password', async () => {
      const user = await global.testHelpers.createTestUser();
      const token = global.testHelpers.generateTestToken(user._id);

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'Password123!',
          newPassword: 'NewPassword123!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should not change password with invalid current password', async () => {
      const user = await global.testHelpers.createTestUser();
      const token = global.testHelpers.generateTestToken(user._id);

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewPassword123!'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user successfully', async () => {
      const user = await global.testHelpers.createTestUser();
      const token = global.testHelpers.generateTestToken(user._id);

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
