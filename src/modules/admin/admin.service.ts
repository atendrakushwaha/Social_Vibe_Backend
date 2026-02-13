
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Post, PostDocument } from '../posts/schemas/post.schema';

@Injectable()
export class AdminService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Post.name) private postModel: Model<PostDocument>,
    ) { }

    async getDashboardStats() {
        const totalUsers = await this.userModel.countDocuments();
        const totalPosts = await this.postModel.countDocuments();
        const activeUsers = await this.userModel.countDocuments({ isActive: true });

        // Group recent signups by day (last 7 days logic could be added)
        const recentUsers = await this.userModel.find().sort({ createdAt: -1 }).limit(5);

        return {
            totalUsers,
            totalPosts,
            activeUsers,
            recentUsers,
        };
    }

    async getAllUsers(page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const users = await this.userModel.find()
            .skip(skip)
            .limit(limit)
            .select('-password');
        const total = await this.userModel.countDocuments();
        return { users, total };
    }

    async banUser(userId: string) {
        const user = await this.userModel.findByIdAndUpdate(userId, { isActive: false }, { new: true });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async unbanUser(userId: string) {
        const user = await this.userModel.findByIdAndUpdate(userId, { isActive: true }, { new: true });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async getAllPosts(page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const posts = await this.postModel.find()
            .populate('userId', 'username avatar')
            .skip(skip)
            .limit(limit);
        const total = await this.postModel.countDocuments();
        return { posts, total };
    }

    async deletePost(postId: string) {
        const post = await this.postModel.findByIdAndDelete(postId);
        if (!post) throw new NotFoundException('Post not found');
        return { message: 'Post deleted successfully' };
    }
}
