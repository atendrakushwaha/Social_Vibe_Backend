import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StoriesService } from './stories.service';
import { StoriesController } from './stories.controller';
import { Story, StorySchema } from './schemas/story.schema';
import { Follow, FollowSchema } from '../follows/schemas/follow.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Story.name, schema: StorySchema },
            { name: Follow.name, schema: FollowSchema },
            { name: User.name, schema: UserSchema },
        ]),
    ],
    controllers: [StoriesController],
    providers: [StoriesService],
    exports: [StoriesService],
})
export class StoriesModule { }
