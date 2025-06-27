import { supabase } from '../lib/supabase'

export class ImageUploadService {
  static BUCKET_NAME = 'user-images'
  static MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
  static ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

  /**
   * Ensure bucket exists and has correct policies
   */
  static async ensureBucket() {
    try {
      console.log('ImageUploadService: Checking if bucket exists...')
      
      // Try to get bucket
      const { data: buckets, error: listError } = await supabase.storage.listBuckets()
      
      if (listError) {
        console.error('ImageUploadService: Error listing buckets:', listError)
        throw new Error('Erro ao verificar buckets de armazenamento')
      }

      const bucketExists = buckets?.some(bucket => bucket.name === this.BUCKET_NAME)
      
      if (!bucketExists) {
        console.log('ImageUploadService: Creating bucket...')
        
        // Create bucket
        const { data: bucket, error: createError } = await supabase.storage.createBucket(this.BUCKET_NAME, {
          public: true,
          allowedMimeTypes: this.ALLOWED_TYPES,
          fileSizeLimit: this.MAX_FILE_SIZE
        })

        if (createError) {
          console.error('ImageUploadService: Error creating bucket:', createError)
          throw new Error('Erro ao criar bucket de armazenamento')
        }

        console.log('ImageUploadService: Bucket created successfully:', bucket)
      } else {
        console.log('ImageUploadService: Bucket already exists')
      }

      return true
    } catch (error) {
      console.error('ImageUploadService: ensureBucket error:', error)
      throw error
    }
  }

  /**
   * Validate file before upload
   */
  static validateFile(file) {
    if (!file) {
      throw new Error('Nenhum arquivo fornecido')
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.')
    }

    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error('Arquivo muito grande. Máximo 5MB.')
    }

    return true
  }

  /**
   * Generate unique filename
   */
  static generateFileName(originalName, userId = null) {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    const extension = originalName.split('.').pop()
    const prefix = userId ? `user_${userId}` : 'user'
    
    return `${prefix}_${timestamp}_${random}.${extension}`
  }

  /**
   * Compress image if needed
   */
  static async compressImage(file, maxWidth = 800, quality = 0.8) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        // Set canvas size
        canvas.width = width
        canvas.height = height

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(resolve, file.type, quality)
      }

      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * Upload image to Supabase Storage
   */
  static async uploadImage(file, userId = null, compress = true) {
    try {
      console.log('ImageUploadService: Starting upload...', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        userId
      })

      // Ensure bucket exists
      await this.ensureBucket()

      // Validate file
      this.validateFile(file)

      // Compress image if needed
      let fileToUpload = file
      if (compress && file.size > 1024 * 1024) { // Compress if > 1MB
        console.log('ImageUploadService: Compressing image...')
        fileToUpload = await this.compressImage(file)
        console.log('ImageUploadService: Image compressed:', {
          originalSize: file.size,
          compressedSize: fileToUpload.size
        })
      }

      // Generate unique filename
      const fileName = this.generateFileName(file.name, userId)
      const filePath = `profiles/${fileName}`

      console.log('ImageUploadService: Uploading to path:', filePath)

      // Upload file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, fileToUpload, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('ImageUploadService: Upload error:', uploadError)
        throw new Error(`Erro no upload: ${uploadError.message}`)
      }

      console.log('ImageUploadService: Upload successful:', uploadData)

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath)

      if (!urlData?.publicUrl) {
        throw new Error('Erro ao gerar URL pública da imagem')
      }

      console.log('ImageUploadService: Public URL generated:', urlData.publicUrl)

      const result = {
        success: true,
        data: {
          path: filePath,
          url: urlData.publicUrl,
          fileName: fileName,
          originalName: file.name,
          size: fileToUpload.size,
          type: file.type
        }
      }

      console.log('ImageUploadService: Final result:', result)
      return result

    } catch (error) {
      console.error('ImageUploadService: Upload failed:', error)
      return {
        success: false,
        error: error.message || 'Erro no upload da imagem'
      }
    }
  }

  /**
   * Delete image from storage
   */
  static async deleteImage(filePath) {
    try {
      console.log('ImageUploadService: Deleting image:', filePath)

      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath])

      if (error) {
        console.error('ImageUploadService: Delete error:', error)
        throw new Error(`Erro ao deletar imagem: ${error.message}`)
      }

      console.log('ImageUploadService: Image deleted successfully')
      return { success: true }

    } catch (error) {
      console.error('ImageUploadService: Delete failed:', error)
      return {
        success: false,
        error: error.message || 'Erro ao deletar imagem'
      }
    }
  }

  /**
   * Get image URL (for existing images)
   */
  static getImageUrl(filePath) {
    if (!filePath) return null

    const { data } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(filePath)

    return data?.publicUrl || null
  }

  /**
   * List user images
   */
  static async listUserImages(userId) {
    try {
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list(`profiles/`, {
          limit: 100,
          offset: 0
        })

      if (error) {
        throw new Error(`Erro ao listar imagens: ${error.message}`)
      }

      // Filter by user ID if provided
      const userImages = userId 
        ? data.filter(file => file.name.includes(`user_${userId}`))
        : data

      return {
        success: true,
        data: userImages.map(file => ({
          name: file.name,
          path: `profiles/${file.name}`,
          url: this.getImageUrl(`profiles/${file.name}`),
          size: file.metadata?.size,
          lastModified: file.updated_at
        }))
      }

    } catch (error) {
      console.error('ImageUploadService: List failed:', error)
      return {
        success: false,
        error: error.message || 'Erro ao listar imagens'
      }
    }
  }
}

