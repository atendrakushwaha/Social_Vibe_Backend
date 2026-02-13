import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
    let service: AuthService;
    let usersService: UsersService;
    let jwtService: JwtService;

    const mockUser = {
        _id: '123',
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashedPassword123',
        role: 'user',
    };

    const mockUsersService = {
        findByEmail: jest.fn(),
        findByEmailWithPassword: jest.fn(),
        create: jest.fn(),
    };

    const mockJwtService = {
        sign: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: UsersService,
                    useValue: mockUsersService,
                },
                {
                    provide: JwtService,
                    useValue: mockJwtService,
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        usersService = module.get<UsersService>(UsersService);
        jwtService = module.get<JwtService>(JwtService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('login', () => {
        it('should return access token and user data for valid credentials', async () => {
            const loginDto = {
                email: 'test@example.com',
                password: 'password123',
            };

            mockUsersService.findByEmailWithPassword.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            mockJwtService.sign.mockReturnValue('mock-jwt-token');

            const result = await service.login(loginDto);

            expect(result).toEqual({
                accessToken: 'mock-jwt-token',
                user: {
                    id: mockUser._id,
                    name: mockUser.name,
                    email: mockUser.email,
                    role: mockUser.role,
                },
            });
            expect(usersService.findByEmailWithPassword).toHaveBeenCalledWith(loginDto.email);
            expect(bcrypt.compare).toHaveBeenCalledWith(
                loginDto.password,
                mockUser.password,
            );
            expect(jwtService.sign).toHaveBeenCalledWith({
                sub: mockUser._id,
                email: mockUser.email,
            });
        });

        it('should throw UnauthorizedException if user not found', async () => {
            mockUsersService.findByEmailWithPassword.mockResolvedValue(null);

            await expect(
                service.login({ email: 'nonexistent@example.com', password: 'pass' }),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException if password is invalid', async () => {
            mockUsersService.findByEmailWithPassword.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            await expect(
                service.login({ email: 'test@example.com', password: 'wrongpass' }),
            ).rejects.toThrow(UnauthorizedException);
        });
    });
});
