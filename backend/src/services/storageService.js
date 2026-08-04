// src/services/storageService.js
const cloudinary = require('cloudinary').v2;
const { logger } = require('../utils/logger');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_URL || (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  )
);

if (isCloudinaryConfigured) {
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config({ secure: true });
  } else {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }
} else {
  logger.warn('Cloudinary is not configured; uploads will fail until environment variables are set.');
}

class StorageService {
  async uploadFile(fileBuffer, fileName, folder = 'uploads', metadata = {}) {
    try {
      if (!isCloudinaryConfigured) {
        throw new Error('Cloudinary is not configured. Set CLOUDINARY_* environment variables.');
      }

      const uniqueId = uuidv4();
      const path = `${folder}/${uniqueId}-${fileName}`;
      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
      let buffer = fileBuffer;

      if (isImage) {
        buffer = await sharp(fileBuffer)
          .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer();
      }

      const base64 = `data:${isImage ? 'image/jpeg' : 'application/octet-stream'};base64,${buffer.toString('base64')}`;
      const uploadResult = await cloudinary.uploader.upload(base64, {
        folder,
        public_id: uniqueId,
        resource_type: 'auto',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
        context: metadata ? Object.entries(metadata).map(([key, value]) => `${key}=${value}`).join('|') : undefined,
      });

      logger.info(`📁 File uploaded: ${path}`);
      return {
        success: true,
        url: uploadResult.secure_url,
        path,
        name: fileName,
        publicId: uploadResult.public_id,
      };
    } catch (error) {
      logger.error('Upload file error:', error);
      throw error;
    }
  }

  async uploadProfilePhoto(userId, fileBuffer) {
    return this.uploadFile(
      fileBuffer,
      `profile-${userId}.jpg`,
      `users/${userId}/profile`,
      { userId }
    );
  }

  async uploadJobPhotos(jobId, files) {
    const urls = [];
    for (const file of files) {
      const result = await this.uploadFile(
        file.buffer,
        file.originalname,
        `jobs/${jobId}`,
        { jobId }
      );
      urls.push(result.url);
    }
    return urls;
  }

  async uploadPortfolioPhoto(userId, fileBuffer) {
    return this.uploadFile(
      fileBuffer,
      `portfolio-${Date.now()}.jpg`,
      `users/${userId}/portfolio`,
      { userId }
    );
  }

  async uploadCertificate(userId, fileBuffer, originalName) {
    return this.uploadFile(
      fileBuffer,
      originalName,
      `users/${userId}/certificates`,
      { userId }
    );
  }

  async deleteFile() {
    return { success: true };
  }

  async deleteFolder() {
    return { success: true };
  }

  async getFileUrl(path) {
    return { success: true, url: path };
  }

  async listFiles() {
    return { success: true, files: [] };
  }
}

module.exports = StorageService;