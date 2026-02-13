import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
const request = require('supertest');

describe('NestJS Application E2E Tests', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ==================== HEALTH CHECKS ====================
  describe('Health Module', () => {
    it('/api/health/ping (GET) - should return pong with server info', () => {
      return request(app.getHttpServer())
        .get('/api/health/ping')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('message', 'pong');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('serverMemory');
          expect(res.body).toHaveProperty('platform');
          expect(res.body).toHaveProperty('cpuCores');
        });
    });

    it('/api/health (GET) - should return complete health status', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('info');
          expect(res.body.info).toHaveProperty('database');
          expect(res.body.info).toHaveProperty('memory_heap');
          expect(res.body.info).toHaveProperty('memory_rss');
        });
    });
  });

  // ==================== AUTHENTICATION MODULE ====================
  describe('Auth Module', () => {
    const testUser = {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      role: 'user',
    };

    it('/api/auth/register (POST) - should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body).toHaveProperty('email', testUser.email);
          expect(res.body).toHaveProperty('name', testUser.name);
          expect(res.body).not.toHaveProperty('password'); // Should not return password
          userId = res.body._id;
        });
    });

    it('/api/auth/register (POST) - should fail with duplicate email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(409); // Conflict
    });

    it('/api/auth/register (POST) - should fail with invalid email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          ...testUser,
          email: 'invalid-email',
        })
        .expect(400);
    });

    it('/api/auth/login (POST) - should login successfully', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('email', testUser.email);
          authToken = res.body.accessToken;
        });
    });

    it('/api/auth/login (POST) - should fail with wrong password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('/api/auth/login (POST) - should fail with non-existent email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
        .expect(401);
    });
  });

  // ==================== USERS MODULE ====================
  describe('Users Module (Protected Routes)', () => {
    it('/api/users/profile (GET) - should fail without token', () => {
      return request(app.getHttpServer())
        .get('/api/users/profile')
        .expect(401);
    });

    it('/api/users/profile (GET) - should return user profile with valid token', () => {
      return request(app.getHttpServer())
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('userId');
          expect(res.body).toHaveProperty('email');
        });
    });

    it('/api/users/profile (GET) - should fail with invalid token', () => {
      return request(app.getHttpServer())
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  // ==================== PROFILE MODULE ====================
  describe('Profile Module', () => {
    const profileData = {
      name: 'John Doe',
      age: 30,
      address: '123 Main St',
      phone: '1234567890',
      avatar: 'https://example.com/avatar.jpg',
    };

    it('/api/profile (POST) - should create profile with valid token', () => {
      return request(app.getHttpServer())
        .post('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(profileData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('name', profileData.name);
          expect(res.body).toHaveProperty('age', profileData.age);
        });
    });

    it('/api/profile (GET) - should get user profile', () => {
      return request(app.getHttpServer())
        .get('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('name', profileData.name);
          expect(res.body).toHaveProperty('age', profileData.age);
        });
    });

    it('/api/profile (PATCH) - should update profile', () => {
      return request(app.getHttpServer())
        .patch('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ age: 31, address: '456 New St' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('age', 31);
          expect(res.body).toHaveProperty('address', '456 New St');
        });
    });

    it('/api/profile (DELETE) - should delete profile', () => {
      return request(app.getHttpServer())
        .delete('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('/api/profile (POST) - should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/profile')
        .send(profileData)
        .expect(401);
    });
  });
});
