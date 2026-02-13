import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Model } from 'mongoose';

import { ProfileService } from './profile.service';
import { Profile } from './schema/profile.schema';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

describe('ProfileService', () => {
  let service: ProfileService;
  let model: Model<Profile>;

  const mockProfile = {
    _id: 'profileId',
    name: 'Atendra',
    age: 25,
    address: 'Delhi',
    phone: '+919876543210',
    avatar: 'avatar.png',
    user: 'userId',

    // ✅ mongoose document mock
    toObject: jest.fn().mockReturnValue({
      _id: 'profileId',
      name: 'Atendra',
      age: 25,
      address: 'Delhi',
      phone: '+919876543210',
      avatar: 'avatar.png',
      user: 'userId',
    }),
  };

  const mockProfileModel = {
    findOne: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: getModelToken(Profile.name),
          useValue: mockProfileModel,
        },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
    model = module.get<Model<Profile>>(getModelToken(Profile.name));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------- CREATE ----------------
  describe('create()', () => {
    it('should create profile successfully', async () => {
      mockProfileModel.findOne.mockResolvedValue(null);
      mockProfileModel.create.mockResolvedValue(mockProfile);

      const dto: CreateProfileDto = {
        name: 'Atendra',
        age: 25,
        address: 'Delhi',
        phone: '+919876543210',
      };

      const result = await service.create('userId', dto, 'avatar.png');

      expect(result).toEqual({
        ...mockProfile.toObject(),
        avatar: expect.any(String),
      });

      expect(model.create).toHaveBeenCalled();
    });

    it('should throw error if profile already exists', async () => {
      mockProfileModel.findOne.mockResolvedValue(mockProfile);

      await expect(
        service.create('userId', {} as CreateProfileDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ---------------- GET ----------------
  describe('getMyProfile()', () => {
    it('should return profile', async () => {
      mockProfileModel.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockProfile),
      });

      const result = await service.getMyProfile('userId');

      expect(result).toEqual({
        ...mockProfile.toObject(),
        avatar: expect.any(String),
      });
    });

    it('should throw error if profile not found', async () => {
      mockProfileModel.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.getMyProfile('userId'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------- UPDATE ----------------
  describe('update()', () => {
    it('should update profile', async () => {
      mockProfileModel.findOneAndUpdate.mockResolvedValue(mockProfile);

      const dto: UpdateProfileDto = {
        address: 'Mumbai',
      };

      const result = await service.update('userId', dto, 'new-avatar.png');

      expect(result).toEqual({
        ...mockProfile.toObject(),
        avatar: expect.any(String),
      });

      expect(model.findOneAndUpdate).toHaveBeenCalled();
    });

    it('should throw error if profile not found', async () => {
      mockProfileModel.findOneAndUpdate.mockResolvedValue(null);

      await expect(
        service.update('userId', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------- DELETE ----------------
  describe('remove()', () => {
    it('should delete profile', async () => {
      mockProfileModel.findOneAndDelete.mockResolvedValue(mockProfile);

      const result = await service.remove('userId');

      expect(result).toEqual({
        message: 'Profile deleted successfully',
      });
    });

    it('should throw error if profile not found', async () => {
      mockProfileModel.findOneAndDelete.mockResolvedValue(null);

      await expect(
        service.remove('userId'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
