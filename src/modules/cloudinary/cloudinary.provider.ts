import { v2 } from 'cloudinary';
import { ConfigOptions } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

export const CloudinaryProvider = {
    provide: 'CLOUDINARY',
    inject: [ConfigService],
    useFactory: (configService: ConfigService): ConfigOptions => {
        const cloudName = configService.get<string>('CLOUDINARY_CLOUD_NAME');
        const apiKey = configService.get<string>('CLOUDINARY_API_KEY');
        const apiSecret = configService.get<string>('CLOUDINARY_API_SECRET');

        console.log('Cloudinary Config:', {
            cloudName,
            apiKey: apiKey ? '***' + apiKey.slice(-4) : 'MISSING',
            apiSecret: apiSecret ? '***' : 'MISSING'
        });

        return v2.config({
            cloud_name: cloudName,
            api_key: apiKey,
            api_secret: apiSecret,
        });
    },
};
