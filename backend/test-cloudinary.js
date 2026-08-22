import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

console.log('Cloudinary Configured:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY ? 'present' : 'missing',
  api_secret: process.env.CLOUDINARY_API_SECRET ? 'present' : 'missing',
});

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const buffer = Buffer.from('dummy data represent a small file content');
new Promise((resolve, reject) => {
  const uploadStream = cloudinary.uploader.upload_stream(
    {
      folder: 'skillconnect_test',
      resource_type: 'auto',
    },
    (error, result) => {
      if (error) {
        console.error('Upload Error:', error);
        reject(error);
      } else {
        console.log('Upload Result:', result);
        resolve(result);
      }
    }
  );
  uploadStream.end(buffer);
}).then(() => process.exit(0)).catch(() => process.exit(1));
