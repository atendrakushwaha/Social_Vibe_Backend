# Cloudinary Setup Instructions

I have updated the backend to use Cloudinary for all file uploads (Profile Avatars, Posts, Reels, Stories).

## 1. Get Cloudinary Credentials
1.  Go to [Cloudinary Console](https://console.cloudinary.com/).
2.  Sign up or Log in.
3.  On the Dashboard, copy your:
    *   **Cloud Name**
    *   **API Key**
    *   **API Secret**

## 2. Update .env File
Open your `c:\Alina-test\New folder\nest-best-structure\.env` file and add the following lines:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Replace `your_cloud_name`, `your_api_key`, and `your_api_secret` with the actual values.

## 3. Important Note
I have updated `multer.config.ts` to use **Memory Storage**.
This means files are no longer saved to the local `uploads/` folder. They are streamed directly to Cloudinary.
Any existing code referencing local file paths has been updated to use the Cloudinary URL.
