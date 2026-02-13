import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { Post, PostSchema } from '../posts/schemas/post.schema';
import { Follow, FollowSchema } from '../follows/schemas/follow.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Post.name, schema: PostSchema },
            { name: Follow.name, schema: FollowSchema },
        ]),
    ],
    controllers: [FeedController],
    providers: [FeedService],
    exports: [FeedService],
})
export class FeedModule { }
