import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Hashtag, HashtagDocument } from './schemas/hashtag.schema';

@Injectable()
export class HashtagsService {
    constructor(
        @InjectModel(Hashtag.name) private hashtagModel: Model<HashtagDocument>,
    ) { }

    async findOrCreate(name: string): Promise<HashtagDocument> {
        let hashtag = await this.hashtagModel.findOne({ name: name.toLowerCase() });

        if (!hashtag) {
            hashtag = new this.hashtagModel({ name: name.toLowerCase() });
            await hashtag.save();
        }

        return hashtag;
    }

    async getTrending(limit = 20): Promise<HashtagDocument[]> {
        return this.hashtagModel
            .find()
            .sort({ todayCount: -1, weekCount: -1 })
            .limit(limit)
            .exec();
    }

    async search(query: string, limit = 20): Promise<HashtagDocument[]> {
        return this.hashtagModel
            .find({ name: { $regex: query, $options: 'i' } })
            .sort({ postsCount: -1 })
            .limit(limit)
            .exec();
    }

    async incrementCount(name: string): Promise<void> {
        await this.hashtagModel.findOneAndUpdate(
            { name: name.toLowerCase() },
            {
                $inc: { postsCount: 1, todayCount: 1, weekCount: 1 },
                $set: { lastUsedAt: new Date() },
            },
            { upsert: true },
        );
    }
}
