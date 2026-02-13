import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Bookmark, BookmarkDocument } from './schemas/bookmark.schema';

@Injectable()
export class BookmarksService {
    constructor(
        @InjectModel(Bookmark.name) private bookmarkModel: Model<BookmarkDocument>,
    ) { }

    async save(userId: string, postId: string, collectionId?: string): Promise<BookmarkDocument> {
        const bookmark = new this.bookmarkModel({
            userId: new Types.ObjectId(userId),
            postId: new Types.ObjectId(postId),
            collectionId,
        });

        return bookmark.save();
    }

    async findByUserId(userId: string, collectionId?: string, page = 1, limit = 12): Promise<{ data: any[]; total: number; page: number; limit: number; hasMore: boolean }> {
        const skip = (page - 1) * limit;
        const query: any = { userId: new Types.ObjectId(userId) };

        if (collectionId) {
            query.collectionId = collectionId;
        }

        const [bookmarks, total] = await Promise.all([
            this.bookmarkModel
                .find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('postId')
                .exec(),
            this.bookmarkModel.countDocuments(query),
        ]);

        return {
            data: bookmarks.map(b => b.postId),
            total,
            page,
            limit,
            hasMore: skip + bookmarks.length < total
        };
    }

    async remove(userId: string, postId: string): Promise<void> {
        await this.bookmarkModel.deleteOne({
            userId: new Types.ObjectId(userId),
            postId: new Types.ObjectId(postId),
        });
    }
}
