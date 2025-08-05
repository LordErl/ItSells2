import { useState, useRef, useEffect } from 'react'
import { Camera, Scan, Check, X, RotateCcw, Settings } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import FaceRecognitionSettings from './FaceRecognitionSettings'

export default function FaceRecognition({ onSuccess, onClose }) {
  const [isScanning, setIsScanning] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [scanProgress, setScanProgress] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  
  const { loginWithFace } = useAuth()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  // Initialize camera
  const startCamera = async () => {
    try {
      setError(null)
      
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      // Request camera access (prefer front camera for face recognition)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Front camera
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      })

      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setIsScanning(true)
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
      setError('Não foi possível acessar a câmera. Verifique as permissões.')
    }
  }

  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
  }

  // Capture and process face
  const captureAndRecognize = async () => {
    if (!videoRef.current || !canvasRef.current) return

    try {
      setIsProcessing(true)
      setError(null)
      setScanProgress(0)

      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      // Set canvas dimensions - ensure minimum size for face detection
      const minSize = 320
      const videoWidth = video.videoWidth
      const videoHeight = video.videoHeight
      
      // Calculate aspect ratio and ensure minimum dimensions
      const aspectRatio = videoWidth / videoHeight
      let canvasWidth, canvasHeight
      
      if (videoWidth < minSize || videoHeight < minSize) {
        if (aspectRatio >= 1) {
          canvasWidth = minSize
          canvasHeight = minSize / aspectRatio
        } else {
          canvasHeight = minSize
          canvasWidth = minSize * aspectRatio
        }
      } else {
        canvasWidth = videoWidth
        canvasHeight = videoHeight
      }
      
      canvas.width = canvasWidth
      canvas.height = canvasHeight
      
      console.log('FaceRecognition: Canvas dimensions:', canvasWidth, 'x', canvasHeight)
      console.log('FaceRecognition: Video dimensions:', videoWidth, 'x', videoHeight)

      // Clear canvas and set high quality rendering
      context.clearRect(0, 0, canvasWidth, canvasHeight)
      context.imageSmoothingEnabled = true
      context.imageSmoothingQuality = 'high'
      
      // Draw video frame to canvas with scaling if needed
      context.drawImage(video, 0, 0, canvasWidth, canvasHeight)

      // Convert to blob
      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/jpeg', 0.9)
      })

      const imageFile = new File([blob], 'face-capture.jpg', { type: 'image/jpeg' })
      setCapturedImage(URL.createObjectURL(blob))

      // Progress: Initializing face recognition
      setScanProgress(20)
      await new Promise(resolve => setTimeout(resolve, 300))

      // Progress: Processing image
      setScanProgress(40)
      await new Promise(resolve => setTimeout(resolve, 300))

      // Progress: Extracting facial features
      setScanProgress(60)
      await new Promise(resolve => setTimeout(resolve, 300))

      // Progress: Comparing with database
      setScanProgress(80)
      await new Promise(resolve => setTimeout(resolve, 300))

      // Attempt face recognition with real comparison
      const result = await loginWithFace(canvas) // Pass canvas directly

      if (result.success) {
        // Success animation
        setScanProgress(100)
        await new Promise(resolve => setTimeout(resolve, 500))
        
        console.log('Face recognition successful:', {
          user: result.data.user.name,
          similarity: result.data.faceMatch?.similarity,
          confidence: result.data.faceMatch?.confidence
        })
        
        onSuccess(result.data)
      } else {
        throw new Error(result.error || 'Rosto não reconhecido')
      }

    } catch (err) {
      console.error('Face recognition error:', err)
      setError(err.message || 'Erro no reconhecimento facial')
      setScanProgress(0)
    } finally {
      setIsProcessing(false)
    }
  }

  // Retry scan
  const retryScan = () => {
    setCapturedImage(null)
    setError(null)
    setScanProgress(0)
    startCamera()
  }

  // Initialize camera on mount
  useEffect(() => {
    startCamera()
    
    return () => {
      stopCamera()
      if (capturedImage) {
        URL.revokeObjectURL(capturedImage)
      }
    }
  }, [])

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gold/20">
          <h3 className="text-lg font-bold text-gold flex items-center space-x-2">
            <Scan className="w-5 h-5" />
            <span>Reconhecimento Facial</span>
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-gold/20 rounded-full transition-colors"
              title="Configurações"
            >
              <Settings className="w-5 h-5 text-gold" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gold/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gold" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {error ? (
            // Error state
            <div className="text-center py-8">
              <X className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={retryScan}
                className="btn-luxury flex items-center space-x-2 mx-auto"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Tentar Novamente</span>
              </button>
            </div>
          ) : capturedImage && isProcessing ? (
            // Processing state
            <div className="text-center">
              <div className="relative mb-4">
                <img
                  src={capturedImage}
                  alt="Imagem capturada"
                  className="w-full h-64 object-cover rounded-lg border-2 border-gold/30"
                />
                
                {/* Scanning overlay */}
                <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gold font-medium">Analisando rosto...</p>
                    <div className="w-32 h-2 bg-black/50 rounded-full mt-2 mx-auto overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-gold to-yellow-400 transition-all duration-300"
                        style={{ width: `${scanProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-gold/80 text-sm mt-1">{scanProgress}%</p>
                  </div>
                </div>
              </div>
            </div>
          ) : capturedImage ? (
            // Captured image (not processing)
            <div className="text-center">
              <img
                src={capturedImage}
                alt="Imagem capturada"
                className="w-full h-64 object-cover rounded-lg border-2 border-gold/30 mb-4"
              />
              <button
                onClick={retryScan}
                className="btn-luxury flex items-center space-x-2 mx-auto"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Tentar Novamente</span>
              </button>
            </div>
          ) : (
            // Camera view
            <div className="text-center">
              <div className="relative mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-64 object-cover rounded-lg border-2 border-gold/30 bg-black"
                />
                
                {/* Face detection overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative">
                    {/* Face outline */}
                    <div className="w-48 h-56 border-2 border-gold/70 rounded-full relative">
                      {/* Corner indicators */}
                      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-gold"></div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-gold"></div>
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-gold"></div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-gold"></div>
                    </div>
                    
                    {/* Scanning line animation */}
                    <div className="absolute inset-0 overflow-hidden rounded-full">
                      <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-gold/80 text-sm mb-4">
                Posicione seu rosto no centro e clique para escanear
              </p>

              <button
                onClick={captureAndRecognize}
                disabled={!isScanning || isProcessing}
                className="btn-luxury w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Camera className="w-5 h-5" />
                <span>Escanear Rosto</span>
              </button>

              <p className="text-gold/60 text-xs mt-3">
                Certifique-se de que há boa iluminação e que seu rosto está visível
              </p>
            </div>
          )}
        </div>

        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <FaceRecognitionSettings onClose={() => setShowSettings(false)} />
      )}
    </div>
  )
}

