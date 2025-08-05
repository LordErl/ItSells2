import React, { useState, useEffect } from 'react'
import { 
  Cog6ToothIcon, 
  EyeIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline'

const FaceRecognitionSettings = ({ onClose }) => {
  const [threshold, setThreshold] = useState(0.6)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadCurrentThreshold()
  }, [])

  const loadCurrentThreshold = async () => {
    try {
      const { default: FaceRecognitionService } = await import('../services/faceRecognitionService')
      const currentThreshold = FaceRecognitionService.getSimilarityThreshold()
      setThreshold(currentThreshold)
    } catch (error) {
      console.error('Error loading threshold:', error)
    }
  }

  const handleThresholdChange = async (newThreshold) => {
    try {
      setIsLoading(true)
      const { default: FaceRecognitionService } = await import('../services/faceRecognitionService')
      FaceRecognitionService.setSimilarityThreshold(newThreshold)
      setThreshold(newThreshold)
      setMessage('Configuração salva com sucesso!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      console.error('Error setting threshold:', error)
      setMessage('Erro ao salvar configuração')
    } finally {
      setIsLoading(false)
    }
  }

  const getThresholdInfo = (value) => {
    if (value < 0.4) {
      return {
        level: 'Muito Baixa',
        description: 'Maior chance de falsos positivos',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        icon: ExclamationTriangleIcon
      }
    } else if (value < 0.6) {
      return {
        level: 'Baixa',
        description: 'Segurança moderada',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        icon: EyeIcon
      }
    } else if (value < 0.8) {
      return {
        level: 'Recomendada',
        description: 'Equilíbrio entre segurança e usabilidade',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        icon: ShieldCheckIcon
      }
    } else {
      return {
        level: 'Alta',
        description: 'Máxima segurança, pode ser mais restritiva',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        icon: ShieldCheckIcon
      }
    }
  }

  const thresholdInfo = getThresholdInfo(threshold)
  const IconComponent = thresholdInfo.icon

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Cog6ToothIcon className="h-6 w-6 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Configurações de Reconhecimento Facial
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Threshold Slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nível de Similaridade: {(threshold * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0.3"
              max="0.9"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              disabled={isLoading}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>30%</span>
              <span>50%</span>
              <span>70%</span>
              <span>90%</span>
            </div>
          </div>

          {/* Threshold Info */}
          <div className={`p-4 rounded-lg ${thresholdInfo.bgColor}`}>
            <div className="flex items-center space-x-2 mb-2">
              <IconComponent className={`h-5 w-5 ${thresholdInfo.color}`} />
              <span className={`font-medium ${thresholdInfo.color}`}>
                Segurança: {thresholdInfo.level}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {thresholdInfo.description}
            </p>
          </div>

          {/* Explanation */}
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>Como funciona:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Valores baixos: Mais permissivo, aceita rostos menos similares</li>
              <li>Valores altos: Mais restritivo, exige maior similaridade</li>
              <li>Recomendado: 60-70% para uso geral</li>
            </ul>
          </div>

          {/* Message */}
          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.includes('sucesso') 
                ? 'bg-green-50 text-green-700' 
                : 'bg-red-50 text-red-700'
            }`}>
              {message}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={() => handleThresholdChange(threshold)}
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Salvando...' : 'Salvar Configuração'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FaceRecognitionSettings
