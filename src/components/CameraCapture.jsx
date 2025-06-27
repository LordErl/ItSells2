import { useState, useRef, useEffect } from 'react'
import { Camera, RotateCcw, Check, X } from 'lucide-react'

export default function CameraCapture({ onCapture, onClose }) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [capturedImage, setCapturedImage] = useState(null)
  const [error, setError] = useState(null)
  const [facingMode, setFacingMode] = useState('user') // 'user' for front camera, 'environment' for back
  
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

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      })

      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setIsStreaming(true)
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
    setIsStreaming(false)
  }

  // Capture photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        const imageUrl = URL.createObjectURL(blob)
        setCapturedImage(imageUrl)
        stopCamera()
      }
    }, 'image/jpeg', 0.9)
  }

  // Confirm captured image
  const confirmCapture = () => {
    if (capturedImage && canvasRef.current) {
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          // Create File object for upload
          const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' })
          onCapture(file, capturedImage)
        }
      }, 'image/jpeg', 0.9)
    }
  }

  // Retake photo
  const retakePhoto = () => {
    setCapturedImage(null)
    startCamera()
  }

  // Switch camera (front/back)
  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user')
    if (isStreaming) {
      startCamera()
    }
  }

  // Initialize camera on mount
  useEffect(() => {
    startCamera()
    
    // Cleanup on unmount
    return () => {
      stopCamera()
      if (capturedImage) {
        URL.revokeObjectURL(capturedImage)
      }
    }
  }, [facingMode])

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gold/20">
          <h3 className="text-lg font-bold text-gold">Tirar Selfie</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gold/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gold" />
          </button>
        </div>

        {/* Camera/Preview Area */}
        <div className="p-4">
          {error ? (
            <div className="text-center py-8">
              <Camera className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={startCamera}
                className="btn-luxury"
              >
                Tentar Novamente
              </button>
            </div>
          ) : capturedImage ? (
            // Preview captured image
            <div className="text-center">
              <div className="relative mb-4">
                <img
                  src={capturedImage}
                  alt="Selfie capturada"
                  className="w-full h-64 object-cover rounded-lg border-2 border-gold/30"
                />
              </div>
              <p className="text-gold/80 text-sm mb-4">
                Gostou da foto? Confirme ou tire outra.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={retakePhoto}
                  className="flex-1 px-4 py-3 bg-gray-600/20 text-gray-300 rounded-lg hover:bg-gray-600/30 transition-colors flex items-center justify-center space-x-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Tirar Outra</span>
                </button>
                <button
                  onClick={confirmCapture}
                  className="flex-1 btn-luxury flex items-center justify-center space-x-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar</span>
                </button>
              </div>
            </div>
          ) : (
            // Camera stream
            <div className="text-center">
              <div className="relative mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-64 object-cover rounded-lg border-2 border-gold/30 bg-black"
                />
                
                {/* Camera overlay guide */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border-2 border-gold/50 rounded-full"></div>
                </div>

                {/* Switch camera button (mobile) */}
                <button
                  onClick={switchCamera}
                  className="absolute top-2 right-2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                >
                  <RotateCcw className="w-4 h-4 text-white" />
                </button>
              </div>

              <p className="text-gold/80 text-sm mb-4">
                Posicione seu rosto no círculo e clique para capturar
              </p>

              <button
                onClick={capturePhoto}
                disabled={!isStreaming}
                className="btn-luxury w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Camera className="w-5 h-5" />
                <span>Capturar Foto</span>
              </button>
            </div>
          )}
        </div>

        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  )
}

// Hook for camera permissions
export function useCameraPermission() {
  const [hasPermission, setHasPermission] = useState(null)
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    // Check if camera is supported
    const checkSupport = () => {
      const isSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
      setIsSupported(isSupported)
      
      if (!isSupported) {
        setHasPermission(false)
        return
      }

      // Check permission status
      if (navigator.permissions) {
        navigator.permissions.query({ name: 'camera' })
          .then(result => {
            setHasPermission(result.state === 'granted')
            
            result.addEventListener('change', () => {
              setHasPermission(result.state === 'granted')
            })
          })
          .catch(() => {
            // Fallback - try to access camera to check permission
            navigator.mediaDevices.getUserMedia({ video: true })
              .then(stream => {
                setHasPermission(true)
                stream.getTracks().forEach(track => track.stop())
              })
              .catch(() => {
                setHasPermission(false)
              })
          })
      }
    }

    checkSupport()
  }, [])

  const requestPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      setHasPermission(true)
      stream.getTracks().forEach(track => track.stop())
      return true
    } catch (error) {
      setHasPermission(false)
      return false
    }
  }

  return {
    hasPermission,
    isSupported,
    requestPermission
  }
}

