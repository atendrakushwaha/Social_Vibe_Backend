import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReelsService } from './reels.service';
import { ReelsController } from './reels.controller';
import { Reel, ReelSchema } from './schemas/reel.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

import { LikesModule } from '../likes/likes.module';
import { CommentsModule } from '../comments/comments.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Reel.name, schema: ReelSchema },
            { name: User.name, schema: UserSchema },
        ]),
        LikesModule,
        CommentsModule,
    ],
    controllers: [ReelsController],
    providers: [ReelsService],
    exports: [ReelsService],
})
export class ReelsModule { }
