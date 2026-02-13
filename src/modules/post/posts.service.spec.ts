import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PostsService } from './posts.service';
import { Post } from './schema/post.schema';
import { Types } from 'mongoose';
import { NotFoundException } from '@nestjs/common';

describe('PostsService', () => {
  let service: PostsService;

  const mockPostData = {
    _id: new Types.ObjectId(),
    user: new Types.ObjectId(),
    caption: 'Hello World',
    image: 'image.jpg',
    likes: [],
    comments: [],
  };

  class MockPostModel {
    constructor(private dto?: any) {
      Object.assign(this, mockPostData, dto);
    }

    save = jest.fn().mockImplementation(function () {
      return Promise.resolve(this);
    });

    toObject = jest.fn().mockImplementation(function () {
      return {
        ...mockPostData,
        ...this,
        likes: this.likes.map((id: Types.ObjectId) =>
          typeof id === 'string' ? id : id.toHexString(),
        ),
        image: this.image,
      };
    });

    static find = jest.fn();
    static findById = jest.fn();
    static findByIdAndUpdate = jest.fn();
    static findByIdAndDelete = jest.fn();
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: getModelToken(Post.name), useValue: MockPostModel },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('likePost()', () => {
    it('should add user to likes', async () => {
      const userId = new Types.ObjectId();
      const postId = new Types.ObjectId();

      const post = {
        ...mockPostData,
        _id: postId,
        likes: [],
        save: jest.fn().mockImplementation(function () {
          // After save, the post should have the userId in likes
          this.likes = [userId];
          return Promise.resolve(this);
        }),
        toObject: jest.fn().mockImplementation(function () {
          return {
            ...mockPostData,
            _id: this._id,
            likes: this.likes.map((id: Types.ObjectId) =>
              typeof id === 'string' ? id : id.toHexString()
            ),
            image: mockPostData.image,
          };
        }),
      };

      MockPostModel.findById.mockResolvedValue(post);

      const result = await service.likePost(postId.toHexString(), userId.toHexString());

      expect(result.likes).toContainEqual(userId.toHexString());
      expect(result.image).toBe(`http://localhost:3000/uploads/avatars/${mockPostData.image}`);
    });

    it('should not duplicate likes', async () => {
      const userId = new Types.ObjectId();
      const post = {
        ...mockPostData,
        likes: [userId],
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({
          ...mockPostData,
          likes: [userId.toHexString()],
          image: mockPostData.image,
        }),
      };
      MockPostModel.findById.mockResolvedValue(post);

      const result = await service.likePost(new Types.ObjectId().toHexString(), userId.toHexString());
      expect(result.likes.length).toBe(1); // ✅ duplicate prevented
    });

    it('should throw NotFoundException if post not found', async () => {
      MockPostModel.findById.mockResolvedValue(null);
      await expect(service.likePost(new Types.ObjectId().toHexString(), new Types.ObjectId().toHexString())).rejects.toThrow(NotFoundException);
    });
  });

  describe('unlikePost()', () => {
    it('should remove user from likes', async () => {
      const userId = new Types.ObjectId();
      const post = {
        ...mockPostData,
        likes: [userId],
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({
          ...mockPostData,
          likes: [],
          image: mockPostData.image,
        }),
      };
      MockPostModel.findById.mockResolvedValue(post);

      const result = await service.unlikePost(new Types.ObjectId().toHexString(), userId.toHexString());

      expect(result.likes).not.toContainEqual(userId.toHexString());
      expect(result.image).toBe(`http://localhost:3000/uploads/avatars/${mockPostData.image}`);
    });

    it('should throw NotFoundException if post not found', async () => {
      MockPostModel.findById.mockResolvedValue(null);
      await expect(service.unlikePost(new Types.ObjectId().toHexString(), new Types.ObjectId().toHexString())).rejects.toThrow(NotFoundException);
    });
  });
});
