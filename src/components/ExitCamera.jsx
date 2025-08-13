import React, { useState, useEffect, useRef } from 'react'
import { StoreService } from '../services/storeService'

const ExitCamera = () => {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [isActive, setIsActive] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [detectedPerson, setDetectedPerson] = useState(null)
  const [paymentStatus, setPaymentStatus] = useState(null)
  const [accessLog, setAccessLog] = useState([])
  const [settings, setSettings] = useState({
    autoScan: true,
    scanInterval: 3000, // 3 seconds
    alertSound: true,
    logRetention: 50 // Keep last 50 entries
  })

  useEffect(() => {
    let scanInterval

    if (isActive && settings.autoScan) {
      scanInterval = setInterval(() => {
        if (!isProcessing) {
          scanForPerson()
        }
      }, settings.scanInterval)
    }

    return () => {
      if (scanInterval) {
        clearInterval(scanInterval)
      }
    }
  }, [isActive, settings.autoScan, settings.scanInterval, isProcessing])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: 640,
          height: 480,
          facingMode: 'user'
        }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setIsActive(true)
      }
    } catch (error) {
      console.error('Erro ao iniciar câmera:', error)
      alert('Erro ao acessar a câmera. Verifique as permissões.')
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks()
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setIsActive(false)
    setDetectedPerson(null)
    setPaymentStatus(null)
  }

  const scanForPerson = async () => {
    if (!videoRef.current || !canvasRef.current || isProcessing) {
      return
    }

    setIsProcessing(true)

    try {
      // Capture frame from video
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      canvas.width = videoRef.current.videoWidth
      canvas.height = videoRef.current.videoHeight
      ctx.drawImage(videoRef.current, 0, 0)

      // Convert to blob for face recognition
      canvas.toBlob(async (blob) => {
        if (!blob) return

        try {
          // Recognize face using dynamic import
          const { default: FaceRecognitionService } = await import('../services/faceRecognitionService')
          const recognitionResult = await FaceRecognitionService.recognizeFace(blob)
          
          if (recognitionResult.success && recognitionResult.data.person) {
            const person = recognitionResult.data.person
            setDetectedPerson(person)

            // Check payment status
            const paymentResult = await checkPaymentStatus(person.id)
            setPaymentStatus(paymentResult)

            // Log access attempt
            logAccessAttempt(person, paymentResult)

            // Play alert sound if enabled
            if (settings.alertSound) {
              playAlertSound(paymentResult.status)
            }

          } else {
            // No face detected or unknown person
            setDetectedPerson(null)
            setPaymentStatus(null)
          }
        } catch (error) {
          console.error('Erro no reconhecimento facial:', error)
        }
      }, 'image/jpeg', 0.8)

    } catch (error) {
      console.error('Erro ao capturar frame:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const checkPaymentStatus = async (personId) => {
    try {
      // Check if person has any unpaid orders using StoreService
      const result = await StoreService.getUnpaidOrdersByCustomer(personId)
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao buscar pedidos pendentes')
      }
      
      const unpaidOrders = result.data || []
      const totalUnpaid = unpaidOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0)

      if (unpaidOrders.length === 0) {
        return {
          status: 'clear',
          message: 'Todas as contas estão pagas',
          canExit: true,
          unpaidAmount: 0,
          unpaidOrders: []
        }
      } else {
        return {
          status: 'pending',
          message: `${unpaidOrders.length} conta(s) pendente(s)`,
          canExit: false,
          unpaidAmount: totalUnpaid,
          unpaidOrders
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status de pagamento:', error)
      return {
        status: 'error',
        message: 'Erro ao verificar pagamentos',
        canExit: false,
        unpaidAmount: 0,
        unpaidOrders: []
      }
    }
  }

  const logAccessAttempt = (person, paymentStatus) => {
    const logEntry = {
      id: Date.now(),
      timestamp: new Date(),
      person: person,
      paymentStatus: paymentStatus.status,
      canExit: paymentStatus.canExit,
      unpaidAmount: paymentStatus.unpaidAmount,
      message: paymentStatus.message
    }

    setAccessLog(prevLog => {
      const newLog = [logEntry, ...prevLog]
      return newLog.slice(0, settings.logRetention)
    })
  }

  const playAlertSound = (status) => {
    // Create audio context for alert sounds
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    // Different tones for different statuses
    if (status === 'clear') {
      // Success tone - two ascending notes
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime) // C5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.2) // E5
    } else if (status === 'pending') {
      // Warning tone - descending notes
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime) // E5
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime + 0.2) // C5
      oscillator.frequency.setValueAtTime(415.30, audioContext.currentTime + 0.4) // G#4
    } else {
      // Error tone - low frequency
      oscillator.frequency.setValueAtTime(220, audioContext.currentTime) // A3
    }

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.6)
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0)
  }

  const formatDateTime = (date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'clear': return 'bg-green-500'
      case 'pending': return 'bg-red-500'
      case 'error': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'clear': return '✅'
      case 'pending': return '❌'
      case 'error': return '⚠️'
      default: return '❓'
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-yellow-400 mb-2">
          📹 Câmera de Saída
        </h1>
        <p className="text-gray-300">
          Sistema de reconhecimento facial para verificação de pagamentos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Camera Section */}
        <div className="space-y-6">
          {/* Camera Controls */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-yellow-400">Controles da Câmera</h2>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></div>
                <span className="text-sm text-gray-400">
                  {isActive ? 'Ativa' : 'Inativa'}
                </span>
              </div>
            </div>

            <div className="flex space-x-4">
              {!isActive ? (
                <button
                  onClick={startCamera}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  ▶️ Iniciar Câmera
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  ⏹️ Parar Câmera
                </button>
              )}

              {isActive && (
                <button
                  onClick={scanForPerson}
                  disabled={isProcessing}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  {isProcessing ? '🔄 Processando...' : '🔍 Escanear Agora'}
                </button>
              )}
            </div>
          </div>

          {/* Camera Feed */}
          <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-auto bg-black"
                autoPlay
                muted
                playsInline
              />
              <canvas
                ref={canvasRef}
                className="hidden"
              />
              
              {isProcessing && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-400 mx-auto mb-4"></div>
                    <p className="text-yellow-400">Reconhecendo...</p>
                  </div>
                </div>
              )}

              {!isActive && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-6xl mb-4 block">📹</span>
                    <p className="text-gray-400">Câmera desativada</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Settings */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-bold text-yellow-400 mb-4">Configurações</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-gray-300">Escaneamento Automático</label>
                <input
                  type="checkbox"
                  checked={settings.autoScan}
                  onChange={(e) => setSettings({
                    ...settings,
                    autoScan: e.target.checked
                  })}
                  className="w-5 h-5 text-yellow-400 bg-gray-800 border-gray-600 rounded focus:ring-yellow-400"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-gray-300">Som de Alerta</label>
                <input
                  type="checkbox"
                  checked={settings.alertSound}
                  onChange={(e) => setSettings({
                    ...settings,
                    alertSound: e.target.checked
                  })}
                  className="w-5 h-5 text-yellow-400 bg-gray-800 border-gray-600 rounded focus:ring-yellow-400"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">
                  Intervalo de Escaneamento: {settings.scanInterval / 1000}s
                </label>
                <input
                  type="range"
                  min="1000"
                  max="10000"
                  step="1000"
                  value={settings.scanInterval}
                  onChange={(e) => setSettings({
                    ...settings,
                    scanInterval: parseInt(e.target.value)
                  })}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Detection and Log Section */}
        <div className="space-y-6">
          {/* Current Detection */}
          {detectedPerson && paymentStatus && (
            <div className={`rounded-lg border-l-4 ${
              paymentStatus.canExit ? 'border-green-500 bg-green-500/10' : 'border-red-500 bg-red-500/10'
            } border border-gray-700 p-6`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {getStatusIcon(paymentStatus.status)} Pessoa Detectada
                  </h3>
                  <p className="text-lg text-white">{detectedPerson.name}</p>
                  <p className="text-gray-400 text-sm">{detectedPerson.email}</p>
                </div>
                <div className={`px-4 py-2 rounded-full text-sm font-medium text-white ${getStatusColor(paymentStatus.status)}`}>
                  {paymentStatus.canExit ? 'LIBERADO' : 'BLOQUEADO'}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-gray-300">{paymentStatus.message}</p>
                
                {paymentStatus.unpaidAmount > 0 && (
                  <div className="bg-gray-800 rounded-lg p-4">
                    <p className="text-red-400 font-bold text-lg">
                      Valor pendente: {formatCurrency(paymentStatus.unpaidAmount)}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {paymentStatus.unpaidOrders.length} pedido(s) não pago(s)
                    </p>
                  </div>
                )}

                {paymentStatus.canExit && (
                  <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                    <p className="text-green-400 font-medium">
                      ✅ Pessoa autorizada a sair
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Access Log */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-yellow-400">Log de Acesso</h3>
              <button
                onClick={() => setAccessLog([])}
                className="text-gray-400 hover:text-white text-sm"
              >
                🗑️ Limpar
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {accessLog.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Nenhum acesso registrado
                </p>
              ) : (
                accessLog.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-gray-800 rounded-lg p-4 border-l-4 border-gray-600"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getStatusIcon(entry.paymentStatus)}</span>
                        <span className="font-medium text-white">{entry.person.name}</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatDateTime(entry.timestamp)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-300">{entry.message}</p>
                      {entry.unpaidAmount > 0 && (
                        <span className="text-red-400 text-sm font-medium">
                          {formatCurrency(entry.unpaidAmount)}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-bold text-yellow-400 mb-4">Estatísticas</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">
                  {accessLog.filter(entry => entry.canExit).length}
                </p>
                <p className="text-gray-400 text-sm">Liberados</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-400">
                  {accessLog.filter(entry => !entry.canExit).length}
                </p>
                <p className="text-gray-400 text-sm">Bloqueados</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">
                  {accessLog.length}
                </p>
                <p className="text-gray-400 text-sm">Total</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExitCamera
