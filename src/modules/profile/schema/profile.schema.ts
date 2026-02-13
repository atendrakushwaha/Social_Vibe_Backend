import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

@Schema({ timestamps: true })
export class Profile extends Document {

    @Prop({
        type: Types.ObjectId,
        ref: User.name,
        required: true,
        unique: true, // one profile per user
    })
    user: Types.ObjectId;

    @Prop()
    name: string;

    @Prop()
    age: number;

    @Prop()
    address: string;

    @Prop({ unique: true })
    phone: string;

    @Prop()
    avatar: string;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
