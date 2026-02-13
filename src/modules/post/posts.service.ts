import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post } from './schema/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(@InjectModel(Post.name) private readonly postsModel: Model<Post>) {}

  // ---------------- Helper: build full image URL ----------------
  private buildImageUrl(filename?: string): string {
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    return filename ? `${baseUrl}/uploads/avatars/${filename}` : '';
  }

  // ---------------- CREATE POST ----------------
  async create(userId: string, dto: CreatePostDto, file: Express.Multer.File): Promise<Post> {
    if (!file) {
      throw new NotFoundException('Image file is required');
    }

    const post = new this.postsModel({
      caption: dto.caption,
      image: file.filename, // save filename in DB
      user: userId,
    });

    await post.save();

    const result = post.toObject();
    result.image = this.buildImageUrl(post.image); // return full URL
    return result;
  }

  // ---------------- GET ALL POSTS ----------------
  async findAll(): Promise<Post[]> {
    const posts = await this.postsModel.find().populate('user', 'name email').exec();
    return posts.map((p) => {
      const obj = p.toObject();
      obj.image = this.buildImageUrl(p.image);
      return obj;
    });
  }

  // ---------------- GET POST BY ID ----------------
  async findById(id: string): Promise<Post> {
    const post = await this.postsModel.findById(id).populate('user', 'name email').exec();
    if (!post) throw new NotFoundException('Post not found');

    const obj = post.toObject();
    obj.image = this.buildImageUrl(post.image);
    return obj;
  }

  // ---------------- UPDATE POST ----------------
  async update(id: string, dto: UpdatePostDto): Promise<Post> {
    const post = await this.postsModel.findByIdAndUpdate(id, dto, { new: true });
    if (!post) throw new NotFoundException('Post not found');

    const obj = post.toObject();
    obj.image = this.buildImageUrl(post.image);
    return obj;
  }

  // ---------------- DELETE POST ----------------
  async delete(id: string): Promise<void> {
    const post = await this.postsModel.findByIdAndDelete(id);
    if (!post) throw new NotFoundException('Post not found');
  }

  // ---------------- LIKE POST ----------------
  async likePost(id: string, userId: string): Promise<Post> {
    const post = await this.postsModel.findById(id);
    if (!post) throw new NotFoundException('Post not found');

    const userObjectId = new Types.ObjectId(userId);
    if (!post.likes.includes(userObjectId)) {
      post.likes.push(userObjectId);
      await post.save();
    }

    const obj = post.toObject();
    obj.image = this.buildImageUrl(post.image);
    return obj;
  }

  // ---------------- UNLIKE POST ----------------
  async unlikePost(id: string, userId: string): Promise<Post> {
    const post = await this.postsModel.findById(id);
    if (!post) throw new NotFoundException('Post not found');

    post.likes = post.likes.filter((uid) => uid.toString() !== userId);
    await post.save();

    const obj = post.toObject();
    obj.image = this.buildImageUrl(post.image);
    return obj;
  }
}
