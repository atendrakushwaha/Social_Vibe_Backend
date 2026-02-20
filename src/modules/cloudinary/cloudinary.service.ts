import { Injectable, Inject } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
    async uploadImage(file: Express.Multer.File): Promise<UploadApiResponse | UploadApiErrorResponse> {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                (error, result) => {
                    if (error) return reject(error);
                    if (!result) return reject(new Error('Upload failed'));
                    resolve(result);
                },
            );

            streamifier.createReadStream(file.buffer).pipe(uploadStream);
        });
    }

    async uploadVideo(file: Express.Multer.File): Promise<UploadApiResponse | UploadApiErrorResponse> {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { resource_type: 'video' },
                (error, result) => {
                    if (error) return reject(error);
                    if (!result) return reject(new Error('Upload failed'));
                    resolve(result);
                },
            );

            streamifier.createReadStream(file.buffer).pipe(uploadStream);
        });
    }
}
