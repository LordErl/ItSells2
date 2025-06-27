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
      // Ensure storage bucket exists
      await this.ensureBucketExists()

      // Generate unique filename
      const fileExt = file.name.split('.').pop() || 'jpg'
      const timestamp = Date.now()
      const fileName = `${type}_${timestamp}.${fileExt}`
      const filePath = `${userId}/${fileName}`

      console.log('Uploading file:', { fileName, filePath, fileSize: file.size })

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('user-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Allow overwrite
        })

      if (error) {
        console.error('Upload error:', error)
        throw new Error(`Erro no upload: ${error.message}`)
      }

      console.log('Upload successful:', data)

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-images')
        .getPublicUrl(filePath)

      console.log('Public URL generated:', publicUrl)

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
   * Ensure the storage bucket exists
   */
  static async ensureBucketExists() {
    try {
      // Check if bucket exists
      const { data: buckets, error: listError } = await supabase.storage.listBuckets()
      
      if (listError) {
        console.error('Error listing buckets:', listError)
        return false
      }

      const bucketExists = buckets?.some(bucket => bucket.name === 'user-images')
      
      if (!bucketExists) {
        console.log('Creating user-images bucket...')
        
        // Create bucket
        const { data, error: createError } = await supabase.storage.createBucket('user-images', {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          fileSizeLimit: 10485760 // 10MB
        })

        if (createError) {
          console.error('Error creating bucket:', createError)
          throw new Error('Não foi possível criar o bucket de imagens')
        }

        console.log('Bucket created successfully:', data)
      }

      return true
    } catch (error) {
      console.error('Error ensuring bucket exists:', error)
      return false
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
        console.error('Delete error:', error)
        return false
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
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        try {
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
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                })
                resolve(compressedFile)
              } else {
                reject(new Error('Falha na compressão da imagem'))
              }
            },
            'image/jpeg',
            quality
          )
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => {
        reject(new Error('Falha ao carregar imagem para compressão'))
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

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      throw new Error('Imagem deve ter no máximo 10MB')
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
      console.log('Processing photo upload:', { 
        fileName: file.name, 
        fileSize: file.size, 
        userId, 
        type 
      })

      // Validate image
      await this.validateImage(file)

      // Compress image if needed
      let processedFile = file
      if (file.size > 1024 * 1024) { // If larger than 1MB, compress
        console.log('Compressing image...')
        processedFile = await this.compressImage(file, 1200, 900, 0.8)
        console.log('Image compressed:', { 
          originalSize: file.size, 
          compressedSize: processedFile.size 
        })
      }

      // Upload to storage
      const result = await this.uploadUserPhoto(processedFile, userId, type)
      console.log('Upload completed:', result)

      return result
    } catch (error) {
      console.error('Error processing and uploading photo:', error)
      throw error
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
        .list(userId, {
          limit: 10,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (error || !data || data.length === 0) {
        return null
      }

      // Find the most recent profile image
      const profileImage = data.find(file => file.name.includes('profile')) || data[0]
      
      const { data: { publicUrl } } = supabase.storage
        .from('user-images')
        .getPublicUrl(`${userId}/${profileImage.name}`)

      return publicUrl
    } catch (error) {
      console.error('Error getting user profile image:', error)
      return null
    }
  }

  /**
   * List all images for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>}
   */
  static async listUserImages(userId) {
    try {
      const { data, error } = await supabase.storage
        .from('user-images')
        .list(userId, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error listing user images:', error)
      return []
    }
  }
}

