import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/schemas/user.schema';
import { Post } from '../posts/schemas/post.schema';
import { Hashtag } from '../hashtags/schemas/hashtag.schema';

@Injectable()
export class SearchService {
    constructor(
        @InjectModel(User.name) private userModel: Model<any>,
        @InjectModel(Post.name) private postModel: Model<any>,
        @InjectModel(Hashtag.name) private hashtagModel: Model<any>,
    ) { }

    async searchUsers(query: string, limit = 20): Promise<any[]> {
        return this.userModel
            .find({
                $or: [
                    { username: { $regex: query, $options: 'i' } },
                    { fullName: { $regex: query, $options: 'i' } },
                ],
                isActive: true,
                deletedAt: null,
            })
            .select('username fullName avatar isVerified followersCount')
            .sort({ isVerified: -1, followersCount: -1 })
            .limit(limit)
            .exec();
    }

    async searchHashtags(query: string, limit = 20): Promise<any[]> {
        return this.hashtagModel
            .find({ name: { $regex: query, $options: 'i' } })
            .sort({ postsCount: -1 })
            .limit(limit)
            .exec();
    }

    async searchPosts(query: string, limit = 20): Promise<any[]> {
        return this.postModel
            .find({
                caption: { $regex: query, $options: 'i' },
                deletedAt: null,
                visibility: 'public',
            })
            .sort({ likesCount: -1, createdAt: -1 })
            .limit(limit)
            .populate('userId', 'username fullName avatar isVerified')
            .exec();
    }

    async globalSearch(query: string): Promise<{
        users: any[];
        hashtags: any[];
        posts: any[];
    }> {
        const [users, hashtags, posts] = await Promise.all([
            this.searchUsers(query, 10),
            this.searchHashtags(query, 10),
            this.searchPosts(query, 10),
        ]);

        return { users, hashtags, posts };
    }
}
