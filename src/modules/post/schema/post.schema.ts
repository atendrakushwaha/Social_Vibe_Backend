import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

@Schema({ timestamps: true })
export class Post extends Document {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  user: Types.ObjectId;

  @Prop({ required: true })
  caption: string;

  @Prop({ required: true })
  image: string;

  @Prop({ type: [Types.ObjectId], ref: User.name, default: [] })
  likes: Types.ObjectId[];

  @Prop({ type: [Object], default: [] }) // comments can be separate schema later
  comments: any[];
}

export const PostSchema = SchemaFactory.createForClass(Post);
