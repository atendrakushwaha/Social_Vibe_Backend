import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HashtagsService } from './hashtags.service';
import { HashtagsController } from './hashtags.controller';
import { Hashtag, HashtagSchema } from './schemas/hashtag.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Hashtag.name, schema: HashtagSchema }]),
    ],
    controllers: [HashtagsController],
    providers: [HashtagsService],
    exports: [HashtagsService],
})
export class HashtagsModule { }
