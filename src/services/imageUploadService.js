import { supabase } from '../lib/supabase'

export class ImageUploadService {
  
  /**
   * Upload user photo to Supabase Storage
   * @param {File} file - Image file
   * @param {string} userId - User ID
   * @param {string} type - Image type ('profile', 'selfie', etc.)
   * @returns {Promise<{url: string, path: string}>}
   */
  static async uploadUserPhoto(file, userId, type = 'profile') {
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${type}_${Date.now()}.${fileExt}`
      const filePath = `user-photos/${fileName}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('user-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        throw error
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-images')
        .getPublicUrl(filePath)

      return {
        url: publicUrl,
        path: filePath,
        fileName: fileName
      }

    } catch (error) {
      console.error('Error uploading image:', error)
      throw new Error('Falha no upload da imagem: ' + error.message)
    }
  }

  /**
   * Delete user photo from Supabase Storage
   * @param {string} filePath - File path in storage
   * @returns {Promise<boolean>}
   */
  static async deleteUserPhoto(filePath) {
    try {
      const { error } = await supabase.storage
        .from('user-images')
        .remove([filePath])

      if (error) {
        throw error
      }

      return true
    } catch (error) {
      console.error('Error deleting image:', error)
      return false
    }
  }

  /**
   * Compress image before upload
   * @param {File} file - Original image file
   * @param {number} maxWidth - Maximum width
   * @param {number} maxHeight - Maximum height
   * @param {number} quality - JPEG quality (0-1)
   * @returns {Promise<File>}
   */
  static async compressImage(file, maxWidth = 800, maxHeight = 600, quality = 0.8) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }

        // Set canvas dimensions
        canvas.width = width
        canvas.height = height

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })
            resolve(compressedFile)
          },
          'image/jpeg',
          quality
        )
      }

      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * Validate image file
   * @param {File} file - Image file to validate
   * @returns {Promise<boolean>}
   */
  static async validateImage(file) {
    // Check file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Arquivo deve ser uma imagem')
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      throw new Error('Imagem deve ter no máximo 5MB')
    }

    // Check if it's a valid image by trying to load it
    return new Promise((resolve, reject) => {
      const img = new Image()
      
      img.onload = () => {
        URL.revokeObjectURL(img.src)
        resolve(true)
      }
      
      img.onerror = () => {
        URL.revokeObjectURL(img.src)
        reject(new Error('Arquivo de imagem inválido'))
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * Process and upload user photo with validation and compression
   * @param {File} file - Original image file
   * @param {string} userId - User ID
   * @param {string} type - Image type
   * @returns {Promise<{url: string, path: string}>}
   */
  static async processAndUploadPhoto(file, userId, type = 'profile') {
    try {
      // Validate image
      await this.validateImage(file)

      // Compress image if needed
      let processedFile = file
      if (file.size > 1024 * 1024) { // If larger than 1MB, compress
        processedFile = await this.compressImage(file)
      }

      // Upload to storage
      const result = await this.uploadUserPhoto(processedFile, userId, type)

      return result
    } catch (error) {
      console.error('Error processing and uploading photo:', error)
      throw error
    }
  }

  /**
   * Create storage bucket if it doesn't exist
   * @returns {Promise<boolean>}
   */
  static async initializeStorage() {
    try {
      // Check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets()
      
      if (listError) {
        console.error('Error listing buckets:', listError)
        return false
      }

      const bucketExists = buckets.some(bucket => bucket.name === 'user-images')
      
      if (!bucketExists) {
        // Create bucket
        const { error: createError } = await supabase.storage.createBucket('user-images', {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
          fileSizeLimit: 5242880 // 5MB
        })

        if (createError) {
          console.error('Error creating bucket:', createError)
          return false
        }

        console.log('Storage bucket created successfully')
      }

      return true
    } catch (error) {
      console.error('Error initializing storage:', error)
      return false
    }
  }

  /**
   * Get user's profile image URL
   * @param {string} userId - User ID
   * @returns {Promise<string|null>}
   */
  static async getUserProfileImage(userId) {
    try {
      const { data, error } = await supabase.storage
        .from('user-images')
        .list(`user-photos/${userId}/`, {
          limit: 1,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (error || !data || data.length === 0) {
        return null
      }

      const latestImage = data[0]
      const { data: { publicUrl } } = supabase.storage
        .from('user-images')
        .getPublicUrl(`user-photos/${userId}/${latestImage.name}`)

      return publicUrl
    } catch (error) {
      console.error('Error getting user profile image:', error)
      return null
    }
  }
}

