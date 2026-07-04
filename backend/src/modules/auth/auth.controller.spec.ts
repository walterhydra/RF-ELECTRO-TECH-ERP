import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn().mockResolvedValue({
      accessToken: 'test-jwt-token',
      user: { id: 'usr-1', email: 'admin@rfelectro.com', role: 'SUPER_ADMIN' },
    }),
    getProfile: jest.fn().mockResolvedValue({
      id: 'usr-1',
      email: 'admin@rfelectro.com',
      role: 'SUPER_ADMIN',
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return token and user on login', async () => {
    const result = await controller.login({ email: 'admin@rfelectro.com', password: 'password123' });
    expect(result.accessToken).toBe('test-jwt-token');
    expect(result.user.email).toBe('admin@rfelectro.com');
  });

  it('should return profile on getProfile', async () => {
    const result = await controller.getProfile({ user: { id: 'usr-1' } });
    expect(result.id).toBe('usr-1');
  });
});
