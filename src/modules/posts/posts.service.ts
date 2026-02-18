import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
    // ... imports
    import { EventsGateway } from '../events/events.gateway';

@Injectable()
export class PostsService {
    constructor(
        @InjectModel(Post.name) private postModel: Model<PostDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private eventsGateway: EventsGateway,
    ) { }

    /**
     * Create a new post
     */
    async create(userId: string, createPostDto: CreatePostDto): Promise<PostDocument> {
        // Extract hashtags from caption
        const hashtags = this.extractHashtags(createPostDto.caption || '');

        // Extract mentions from caption
        const mentions = this.extractMentions(createPostDto.caption || '');

        const post = new this.postModel({
            ...createPostDto,
            userId: new Types.ObjectId(userId),
            hashtags,
            mentions: mentions.map(m => new Types.ObjectId(m)),
        });

        const savedPost = await post.save();
        await savedPost.populate('userId', 'username fullName avatar isVerified');

        // Broadcast new post
        this.eventsGateway.emitNewPost(savedPost);

        // TODO: Update user's post count
        // TODO: Create hashtag documents
        // TODO: Send notifications to mentioned users

        return savedPost;
    }

    /**
     * Get post by ID
     */
    async findById(postId: string, userId?: string): Promise<PostDocument> {
        const post = await this.postModel
            .findOne({ _id: postId, deletedAt: null })
            .populate('userId', 'username fullName avatar isVerified')
            .populate('mentions', 'username fullName avatar')
            .exec();

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        // Check privacy settings
        if (post.visibility === 'followers' && userId) {
            // TODO: Check if user follows the post owner
        }

        if (post.visibility === 'close_friends' && userId) {
            // TODO: Check if user is in close friends
        }

        return post;
    }

    /**
     * Get user's posts by userId
     */
    async findByUserId(
        userId: string,
        currentUserId?: string,
        page = 1,
        limit = 12,
    ): Promise<{ data: PostDocument[]; total: number; page: number; limit: number; hasMore: boolean }> {
        const skip = (page - 1) * limit;

        // If viewing own profile or public posts
        const query: any = {
            userId: new Types.ObjectId(userId),
            deletedAt: null,
            isArchived: false,
        };

        // If viewing other's profile, apply privacy
        if (currentUserId && userId !== currentUserId) {
            query.visibility = { $in: ['public', 'followers'] }; // TODO: Check follow status
        }

        const [posts, total] = await Promise.all([
            this.postModel
                .find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('userId', 'username fullName avatar isVerified')
                .exec(),
            this.postModel.countDocuments(query),
        ]);

        return {
            data: posts,
            total,
            page,
            limit,
            hasMore: skip + posts.length < total,
        };
    }

    /**
     * Get user's posts by username
     */
    async findByUsername(
        username: string,
        currentUserId?: string,
        page = 1,
        limit = 12,
    ): Promise<{ data: PostDocument[]; total: number; page: number; limit: number; hasMore: boolean }> {
        // Find user by username
        const user = await this.userModel.findOne({ username }).lean();

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Use findByUserId with the found user's ID
        return this.findByUserId(user._id.toString(), currentUserId, page, limit);
    }

    /**
     * Update post
     */
    async update(postId: string, userId: string, updatePostDto: UpdatePostDto): Promise<PostDocument> {
        const post = await this.postModel.findOne({ _id: postId, deletedAt: null });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        if (post.userId.toString() !== userId) {
            throw new ForbiddenException('You can only edit your own posts');
        }

        // Update caption and extract new hashtags/mentions if caption changed
        if (updatePostDto.caption !== undefined) {
            post.caption = updatePostDto.caption;
            post.hashtags = this.extractHashtags(updatePostDto.caption);
            post.mentions = this.extractMentions(updatePostDto.caption).map(m => new Types.ObjectId(m));
            post.editedAt = new Date();
        }

        // Update other fields
        Object.assign(post, updatePostDto);

        return post.save();
    }

    /**
     * Delete post (soft delete)
     */
    async delete(postId: string, userId: string): Promise<void> {
        const post = await this.postModel.findOne({ _id: postId, deletedAt: null });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        if (post.userId.toString() !== userId) {
            throw new ForbiddenException('You can only delete your own posts');
        }

        post.deletedAt = new Date();
        await post.save();

        // TODO: Update user's post count
        // TODO: Soft delete related likes, comments
    }

    /**
     * Get posts by hashtag
     */
    async findByHashtag(
        hashtag: string,
        page = 1,
        limit = 12,
    ): Promise<{ posts: PostDocument[]; total: number }> {
        const skip = (page - 1) * limit;
        const query = {
            hashtags: hashtag.toLowerCase().replace(/^#/, ''),
            deletedAt: null,
            visibility: 'public',
        };

        const [posts, total] = await Promise.all([
            this.postModel
                .find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('userId', 'username fullName avatar isVerified')
                .exec(),
            this.postModel.countDocuments(query),
        ]);

        return { posts, total };
    }

    /**
     * Increment view count
     */
    async incrementViewCount(postId: string): Promise<void> {
        await this.postModel.findByIdAndUpdate(postId, {
            $inc: { viewsCount: 1 },
        });
    }

    /**
     * Extract hashtags from text
     */
    private extractHashtags(text: string): string[] {
        const hashtagRegex = /#(\w+)/g;
        const matches = text.match(hashtagRegex);
        return matches ? matches.map(tag => tag.substring(1).toLowerCase()) : [];
    }

    /**
     * Extract mentions from text
     */
    private extractMentions(text: string): string[] {
        const mentionRegex = /@(\w+)/g;
        const matches = text.match(mentionRegex);
        // TODO: Validate that mentioned usernames exist
        return matches ? matches.map(mention => mention.substring(1)) : [];
    }

    /**
     * Get trending posts
     */
    async getTrending(page = 1, limit = 12): Promise<{ posts: PostDocument[]; total: number }> {
        const skip = (page - 1) * limit;
        const query = {
            deletedAt: null,
            visibility: 'public',
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
        };

        const [posts, total] = await Promise.all([
            this.postModel
                .find(query)
                .sort({ likesCount: -1, commentsCount: -1, viewsCount: -1 })
                .skip(skip)
                .limit(limit)
                .populate('userId', 'username fullName avatar isVerified')
                .exec(),
            this.postModel.countDocuments(query),
        ]);

        return { posts, total };
    }

    /**
     * Like a post
     */
    async likePost(postId: string, userId: string) {
        const post = await this.postModel.findById(postId);
        if (!post) {
            throw new NotFoundException('Post not found');
        }

        const userObjectId = new Types.ObjectId(userId);
        const likeIndex = post.likes.findIndex(id => id.equals(userObjectId));

        if (likeIndex === -1) {
            // Add like
            post.likes.push(userObjectId);
            post.likesCount = post.likes.length;
            await post.save();
        }

        return {
            liked: true,
            likesCount: post.likesCount,
        };
    }

    /**
     * Unlike a post
     */
    async unlikePost(postId: string, userId: string) {
        const post = await this.postModel.findById(postId);
        if (!post) {
            throw new NotFoundException('Post not found');
        }

        const userObjectId = new Types.ObjectId(userId);
        const likeIndex = post.likes.findIndex(id => id.equals(userObjectId));

        if (likeIndex > -1) {
            // Remove like
            post.likes.splice(likeIndex, 1);
            post.likesCount = post.likes.length;
            await post.save();
        }

        return {
            liked: false,
            likesCount: post.likesCount,
        };
    }

    /**
     * Get comments for a post
     */
    async getComments(postId: string, page: number = 1, limit: number = 20) {
        // For now return empty, implement when comments module is ready
        return {
            data: [],
            total: 0,
            page,
            hasMore: false,
        };
    }

    /**
     * Add comment to a post
     */
    async addComment(postId: string, userId: string, content: string) {
        const post = await this.postModel.findById(postId);
        if (!post) {
            throw new NotFoundException('Post not found');
        }

        // Increment comments count
        post.commentsCount += 1;
        await post.save();

        // Return mock comment for now
        return {
            _id: new Types.ObjectId().toString(),
            content,
            userId: {
                _id: userId,
                username: 'user',
            },
            createdAt: new Date(),
        };
    }
}
