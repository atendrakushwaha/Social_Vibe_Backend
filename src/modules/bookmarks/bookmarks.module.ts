import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookmarksService } from './bookmarks.service';
import { BookmarksController } from './bookmarks.controller';
import { Bookmark, BookmarkSchema } from './schemas/bookmark.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Bookmark.name, schema: BookmarkSchema }]),
    ],
    controllers: [BookmarksController],
    providers: [BookmarksService],
    exports: [BookmarksService],
})
export class BookmarksModule { }
