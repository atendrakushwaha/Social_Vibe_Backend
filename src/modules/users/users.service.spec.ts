import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let model: any;

  const mockUser = {
    _id: '123',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedPassword',
    role: 'user',
  };

  // ✅ MONGOOSE MODEL CONSTRUCTOR MOCK + STATIC METHODS
  const mockUserModel: any = jest.fn().mockImplementation((dto) => ({
    ...dto,
    save: jest.fn().mockResolvedValue({
      _id: '456',
      ...dto,
    }),
  }));

  mockUserModel.findOne = jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    model = module.get(getModelToken(User.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------- CREATE ----------------
  describe('create()', () => {
    it('should create a new user with hashed password', async () => {
      const createUserDto = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
        role: 'user' as any,
      };

      model.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');

      const result = await service.create(createUserDto);

      expect(model.findOne).toHaveBeenCalledWith({
        email: createUserDto.email,
      });

      expect(bcrypt.hash).toHaveBeenCalledWith(
        createUserDto.password,
        10,
      );

      expect(result).toEqual(
        expect.objectContaining({
          email: createUserDto.email,
          password: 'hashedPassword123',
        }),
      );
    });

    it('should throw ConflictException if email already exists', async () => {
      model.findOne.mockResolvedValue(mockUser);

      await expect(
        service.create({
          name: 'Duplicate User',
          email: 'test@example.com',
          password: '123',
          role: 'user' as any,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ---------------- FIND BY EMAIL ----------------
  describe('findByEmail()', () => {
    it('should return user if found', async () => {
      model.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(model.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });

    it('should return null if user not found', async () => {
      model.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('no@example.com');

      expect(result).toBeNull();
    });
  });
});
