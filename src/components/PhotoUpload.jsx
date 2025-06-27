import { useState } from 'react'
import { Camera, Upload, User, X } from 'lucide-react'
import CameraCapture, { useCameraPermission } from './CameraCapture'

export default function PhotoUpload({ onPhotoSelect, currentPhoto, label = "Foto (Opcional)" }) {
  const [showCamera, setShowCamera] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(currentPhoto || null)
  const { hasPermission, isSupported } = useCameraPermission()

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem.')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB.')
        return
      }

      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      onPhotoSelect(file, url)
    }
  }

  // Handle camera capture
  const handleCameraCapture = (file, imageUrl) => {
    setPreviewUrl(imageUrl)
    onPhotoSelect(file, imageUrl)
    setShowCamera(false)
  }

  // Remove photo
  const removePhoto = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    onPhotoSelect(null, null)
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gold">
        {label}
      </label>

      {previewUrl ? (
        // Photo preview
        <div className="relative">
          <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-2 border-gold/30">
            <img
              src={previewUrl}
              alt="Foto selecionada"
              className="w-full h-full object-cover"
            />
          </div>
          
          <button
            onClick={removePhoto}
            className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>

          <p className="text-center text-gold/80 text-sm mt-2">
            Para reconhecimento facial futuro
          </p>
        </div>
      ) : (
        // Upload options
        <div className="space-y-3">
          {/* Camera Button */}
          {isSupported && (
            <button
              type="button"
              onClick={() => setShowCamera(true)}
              className="w-full p-4 border-2 border-dashed border-gold/30 rounded-lg hover:border-gold/50 transition-colors flex flex-col items-center space-y-2 group"
            >
              <Camera className="w-8 h-8 text-gold group-hover:text-gold/80" />
              <span className="text-gold group-hover:text-gold/80 font-medium">
                Tirar Selfie
              </span>
              <span className="text-gold/60 text-sm">
                Use a câmera do dispositivo
              </span>
            </button>
          )}

          {/* File Upload */}
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              id="photo-upload"
            />
            <label
              htmlFor="photo-upload"
              className="block w-full p-4 border-2 border-dashed border-gold/30 rounded-lg hover:border-gold/50 transition-colors cursor-pointer"
            >
              <div className="flex flex-col items-center space-y-2 group">
                <Upload className="w-8 h-8 text-gold group-hover:text-gold/80" />
                <span className="text-gold group-hover:text-gold/80 font-medium">
                  Escolher Arquivo
                </span>
                <span className="text-gold/60 text-sm">
                  Selecione uma foto da galeria
                </span>
              </div>
            </label>
          </div>

          {/* Info */}
          <div className="text-center">
            <p className="text-gold/60 text-xs">
              Formatos aceitos: JPG, PNG, WebP • Máximo 5MB
            </p>
            <p className="text-gold/80 text-sm mt-1">
              Para reconhecimento facial futuro
            </p>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  )
}

