import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

// Existing modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HealthModule } from './modules/health/health.module';
import { ProfileModule } from './modules/profile/profile.module';

// Instagram clone modules
import { PostsModule } from './modules/posts/posts.module';
import { CommentsModule } from './modules/comments/comments.module';
import { LikesModule } from './modules/likes/likes.module';
import { FollowsModule } from './modules/follows/follows.module';
import { FeedModule } from './modules/feed/feed.module';
import { StoriesModule } from './modules/stories/stories.module';
import { ReelsModule } from './modules/reels/reels.module';
import { MessagesModule } from './modules/messages/messages.module';
import { CallsModule } from './modules/calls/calls.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { BookmarksModule } from './modules/bookmarks/bookmarks.module';
import { HashtagsModule } from './modules/hashtags/hashtags.module';
import { SearchModule } from './modules/search/search.module';
import { EventsModule } from './modules/events/events.module';
import { AdminModule } from './modules/admin/admin.module';
import { UploadModule } from './modules/upload/upload.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';

import mongoConfig from './config/mongo.config';
import jwtConfig from './config/jwt.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [mongoConfig, jwtConfig],
    }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('mongo.uri'),
      }),
    }),

    // Existing modules
    AuthModule,
    UsersModule,
    HealthModule,
    ProfileModule,

    // Instagram clone modules
    PostsModule,
    CommentsModule,
    LikesModule,
    FollowsModule,
    FeedModule,
    StoriesModule,
    ReelsModule,
    MessagesModule,
    CallsModule,
    NotificationsModule,
    BookmarksModule,
    HashtagsModule,
    SearchModule,
    EventsModule,
    AdminModule,
    UploadModule,
    CloudinaryModule,

    // Serve Static Files
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
  ],
})
export class AppModule { }
