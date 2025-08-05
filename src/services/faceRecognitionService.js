import * as faceapi from 'face-api.js'

/**
 * Face Recognition Service
 * Handles real facial recognition using face-api.js
 */
export class FaceRecognitionService {
  constructor() {
    this.isInitialized = false
    this.modelsLoaded = false
    this.SIMILARITY_THRESHOLD = 0.6 // Ajuste conforme necessário (0.4-0.8)
  }

  /**
   * Initialize face-api.js models
   */
  async initialize() {
    if (this.isInitialized) return true

    try {
      console.log('FaceRecognitionService: Loading models...')
      
      // Load required models
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        faceapi.nets.faceExpressionNet.loadFromUri('/models')
      ])

      this.modelsLoaded = true
      this.isInitialized = true
      console.log('FaceRecognitionService: Models loaded successfully')
      return true
    } catch (error) {
      console.error('FaceRecognitionService: Failed to load models:', error)
      return false
    }
  }

  /**
   * Extract face descriptor from image
   */
  async extractFaceDescriptor(imageElement) {
    try {
      if (!this.modelsLoaded) {
        const initialized = await this.initialize()
        if (!initialized) {
          throw new Error('Falha ao carregar modelos de reconhecimento facial')
        }
      }

      // Detect face and extract descriptor
      const detection = await faceapi
        .detectSingleFace(imageElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor()

      if (!detection) {
        throw new Error('Nenhum rosto detectado na imagem')
      }

      return {
        success: true,
        descriptor: Array.from(detection.descriptor),
        confidence: detection.detection.score
      }
    } catch (error) {
      console.error('FaceRecognitionService: Face extraction error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Compare two face descriptors
   */
  compareFaces(descriptor1, descriptor2) {
    try {
      if (!descriptor1 || !descriptor2) {
        return { success: false, error: 'Descriptores inválidos' }
      }

      // Convert arrays to Float32Array for face-api.js
      const desc1 = new Float32Array(descriptor1)
      const desc2 = new Float32Array(descriptor2)

      // Calculate euclidean distance
      const distance = faceapi.euclideanDistance(desc1, desc2)
      const similarity = 1 - distance

      const isMatch = similarity >= this.SIMILARITY_THRESHOLD

      return {
        success: true,
        similarity,
        distance,
        isMatch,
        confidence: similarity
      }
    } catch (error) {
      console.error('FaceRecognitionService: Face comparison error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Process image file and extract face descriptor
   */
  async processImageFile(imageFile) {
    return new Promise((resolve) => {
      const img = new Image()
      
      img.onload = async () => {
        try {
          const result = await this.extractFaceDescriptor(img)
          resolve(result)
        } catch (error) {
          resolve({
            success: false,
            error: error.message
          })
        }
      }

      img.onerror = () => {
        resolve({
          success: false,
          error: 'Erro ao carregar imagem'
        })
      }

      // Convert file to data URL
      const reader = new FileReader()
      reader.onload = (e) => {
        img.src = e.target.result
      }
      reader.readAsDataURL(imageFile)
    })
  }

  /**
   * Process canvas element and extract face descriptor
   */
  async processCanvas(canvas) {
    try {
      const result = await this.extractFaceDescriptor(canvas)
      return result
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Find best match among multiple face descriptors
   */
  findBestMatch(inputDescriptor, storedDescriptors) {
    try {
      let bestMatch = null
      let highestSimilarity = 0

      for (const stored of storedDescriptors) {
        const comparison = this.compareFaces(inputDescriptor, stored.descriptor)
        
        if (comparison.success && comparison.similarity > highestSimilarity) {
          highestSimilarity = comparison.similarity
          bestMatch = {
            ...stored,
            similarity: comparison.similarity,
            distance: comparison.distance,
            isMatch: comparison.isMatch
          }
        }
      }

      return {
        success: true,
        bestMatch,
        allMatches: storedDescriptors.map(stored => {
          const comparison = this.compareFaces(inputDescriptor, stored.descriptor)
          return {
            ...stored,
            similarity: comparison.success ? comparison.similarity : 0,
            isMatch: comparison.success ? comparison.isMatch : false
          }
        }).sort((a, b) => b.similarity - a.similarity)
      }
    } catch (error) {
      console.error('FaceRecognitionService: Best match error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Set similarity threshold
   */
  setSimilarityThreshold(threshold) {
    if (threshold >= 0.3 && threshold <= 0.9) {
      this.SIMILARITY_THRESHOLD = threshold
      console.log(`FaceRecognitionService: Threshold set to ${threshold}`)
    } else {
      console.warn('FaceRecognitionService: Invalid threshold. Must be between 0.3 and 0.9')
    }
  }

  /**
   * Get current similarity threshold
   */
  getSimilarityThreshold() {
    return this.SIMILARITY_THRESHOLD
  }
}

// Export singleton instance
export default new FaceRecognitionService()
