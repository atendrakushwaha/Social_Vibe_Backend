// Removed diskStorage to use memory storage for Cloudinary
export const multerConfig = {
  // storage: memoryStorage() // Default behavior when storage is not defined
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
      cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
};
