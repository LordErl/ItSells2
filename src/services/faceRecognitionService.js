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

      console.log('FaceRecognitionService: Attempting face detection on element:', imageElement)
      console.log('Element dimensions:', imageElement.width, 'x', imageElement.height)

      // Try multiple detection options for better results
      const detectionOptions = [
        // Most sensitive - lower input size, lower score threshold
        new faceapi.TinyFaceDetectorOptions({ 
          inputSize: 160, 
          scoreThreshold: 0.3 
        }),
        // Medium sensitivity
        new faceapi.TinyFaceDetectorOptions({ 
          inputSize: 224, 
          scoreThreshold: 0.4 
        }),
        // Default options
        new faceapi.TinyFaceDetectorOptions()
      ]

      let detection = null
      let usedOptionIndex = -1

      // Try each detection option until we find a face
      for (let i = 0; i < detectionOptions.length; i++) {
        try {
          console.log(`FaceRecognitionService: Trying detection option ${i + 1}/${detectionOptions.length}`)
          
          detection = await faceapi
            .detectSingleFace(imageElement, detectionOptions[i])
            .withFaceLandmarks()
            .withFaceDescriptor()

          if (detection) {
            usedOptionIndex = i
            console.log(`FaceRecognitionService: Face detected with option ${i + 1}, score:`, detection.detection.score)
            break
          }
        } catch (optionError) {
          console.warn(`FaceRecognitionService: Detection option ${i + 1} failed:`, optionError.message)
          continue
        }
      }

      if (!detection) {
        // Try to get all detections to see if there are multiple faces
        try {
          const allDetections = await faceapi.detectAllFaces(
            imageElement, 
            new faceapi.TinyFaceDetectorOptions({ inputSize: 160, scoreThreshold: 0.2 })
          )
          
          console.log('FaceRecognitionService: All detections found:', allDetections.length)
          
          if (allDetections.length > 1) {
            throw new Error(`Múltiplos rostos detectados (${allDetections.length}). Use uma imagem com apenas um rosto.`)
          } else if (allDetections.length === 0) {
            throw new Error('Nenhum rosto detectado na imagem. Certifique-se de que seu rosto está bem iluminado e centralizado.')
          }
        } catch (multiError) {
          console.warn('FaceRecognitionService: Multi-face detection also failed:', multiError)
        }
        
        throw new Error('Nenhum rosto detectado na imagem. Tente melhorar a iluminação ou posicionar o rosto no centro da câmera.')
      }

      return {
        success: true,
        descriptor: Array.from(detection.descriptor),
        confidence: detection.detection.score,
        detectionMethod: `Option ${usedOptionIndex + 1}`
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

  /**
   * Recognize face from image blob and match against stored faces
   */
  async recognizeFace(imageBlob) {
    try {
      // Convert blob to image element
      const imageUrl = URL.createObjectURL(imageBlob)
      const img = new Image()
      
      return new Promise((resolve) => {
        img.onload = async () => {
          try {
            // Extract face descriptor from image
            const extractResult = await this.extractFaceDescriptor(img)
            
            if (!extractResult.success) {
              resolve({
                success: false,
                error: extractResult.error
              })
              return
            }

            // For now, return mock data since we don't have a user database
            // In a real implementation, you would:
            // 1. Query stored face descriptors from database
            // 2. Use findBestMatch to compare against stored faces
            // 3. Return the matched person data
            
            // Generate a valid UUID for mock data
            const mockUUID = 'ebb2070f-16f0-48ef-adf6-e9aa293ac174' // Use existing customer ID from example
        
            resolve({
              success: true,
              data: {
                person: { 
                  id: mockUUID, 
                  name: 'Cliente Reconhecido', 
                  email: 'cliente@exemplo.com',
                  confidence: extractResult.confidence || 0.8 
                },
                faceDescriptor: extractResult.descriptor
              }
            })
            
          } catch (error) {
            resolve({
              success: false,
              error: error.message
            })
          } finally {
            URL.revokeObjectURL(imageUrl)
          }
        }
        
        img.onerror = () => {
          resolve({
            success: false,
            error: 'Erro ao carregar imagem'
          })
          URL.revokeObjectURL(imageUrl)
        }
        
        img.src = imageUrl
      })
      
    } catch (error) {
      console.error('FaceRecognitionService: Recognition error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}

// Export singleton instance
export default new FaceRecognitionService()
