import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Logo from '../components/common/Logo'
import anime from 'animejs'
import { Camera, X, Scan } from 'lucide-react'

export default function LoginPage() {
  const [loginMethod, setLoginMethod] = useState('credentials') // 'credentials', 'face'
  const [showFaceRecognition, setShowFaceRecognition] = useState(false)
  const [faceRecognitionStep, setFaceRecognitionStep] = useState('camera') // 'camera', 'scanning', 'success', 'error'
  const [formData, setFormData] = useState({
    cpf: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [scanProgress, setScanProgress] = useState(0)
  
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { loginWithCredentials, loginWithFace, isAuthenticated, user } = useAuth()
  
  const containerRef = useRef(null)
  const formRef = useRef(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  // Get table ID from URL params if coming from QR scan
  const tableId = searchParams.get('table')

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = user.role === 'admin' ? '/admin' :
                          user.role === 'staff' ? '/staff' :
                          '/customer'
      navigate(redirectPath)
    }
  }, [isAuthenticated, user, navigate])

  // Animate entrance
  useEffect(() => {
    if (containerRef.current) {
      anime({
        targets: containerRef.current,
        translateY: [50, 0],
        opacity: [0, 1],
        duration: 800,
        easing: 'easeOutCubic'
      })
    }
  }, [])

  // Animate form transitions
  useEffect(() => {
    if (formRef.current) {
      anime({
        targets: formRef.current,
        scale: [0.95, 1],
        opacity: [0.8, 1],
        duration: 400,
        easing: 'easeOutCubic'
      })
    }
  }, [loginMethod])

  // Camera functions
  const startCamera = async () => {
    try {
      setError('')
      
      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }

      // Request camera access (prefer front camera)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      })

      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setFaceRecognitionStep('camera')
      }
    } catch (err) {
      console.error('Error accessing camera:', err)
      setError('Não foi possível acessar a câmera. Verifique as permissões.')
      setFaceRecognitionStep('error')
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  const captureAndRecognize = async () => {
    if (!videoRef.current || !canvasRef.current) return

    try {
      setFaceRecognitionStep('scanning')
      setScanProgress(0)

      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      // Set canvas dimensions
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Convert to blob
      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/jpeg', 0.9)
      })

      if (!blob) {
        throw new Error('Falha ao capturar imagem')
      }

      // Create file from blob
      const imageFile = new File([blob], 'face_scan.jpg', { type: 'image/jpeg' })
      
      stopCamera()

      // Simulate scanning progress
      for (let i = 0; i <= 100; i += 10) {
        setScanProgress(i)
        await new Promise(resolve => setTimeout(resolve, 150))
      }

      // Attempt face recognition
      const result = await loginWithFace(imageFile)

      if (result.success) {
        setFaceRecognitionStep('success')
        
        // Success delay then redirect
        setTimeout(() => {
          setShowFaceRecognition(false)
          const redirectPath = result.data.user.role === 'admin' ? '/admin' :
                              result.data.user.role === 'staff' ? '/staff' :
                              '/customer'
          navigate(redirectPath)
        }, 1500)
      } else {
        throw new Error(result.error || 'Rosto não reconhecido')
      }

    } catch (err) {
      console.error('Face recognition error:', err)
      setError(err.message || 'Erro no reconhecimento facial')
      setFaceRecognitionStep('error')
      setScanProgress(0)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const formatCPF = (value) => {
    const numbers = value.replace(/\D/g, '')
    
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    }
    
    return value
  }

  const handleCPFChange = (e) => {
    const formatted = formatCPF(e.target.value)
    setFormData(prev => ({
      ...prev,
      cpf: formatted
    }))
  }

  const handleCredentialsLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const cpfNumbers = formData.cpf.replace(/\D/g, '')
      const result = await loginWithCredentials(cpfNumbers, formData.password)
      
      if (!result.success) {
        setError(result.error)
      }
    } catch (err) {
      setError('Erro interno. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const openFaceRecognition = () => {
    setShowFaceRecognition(true)
    setFaceRecognitionStep('camera')
    setError('')
    setScanProgress(0)
    setTimeout(() => startCamera(), 100)
  }

  const closeFaceRecognition = () => {
    stopCamera()
    setShowFaceRecognition(false)
    setFaceRecognitionStep('camera')
    setError('')
    setScanProgress(0)
  }

  const retryFaceRecognition = () => {
    setError('')
    setFaceRecognitionStep('camera')
    setScanProgress(0)
    startCamera()
  }

  return (
    <div className="min-h-screen flex items-center justify-center animated-bg p-4">
      <div ref={containerRef} className="glass-card p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            <Logo size="lg" animated={true} />
          </div>
          <h1 className="text-2xl font-bold mb-2">
            <span className="text-gold">It</span>
            <span className="text-green-400 text-3xl">$</span>
            <span className="text-gold">ell's</span>
          </h1>
          <p className="text-gold/80 text-sm">
            {tableId ? `Mesa ${tableId} - Faça seu login` : 'Acesse sua conta'}
          </p>
        </div>

        {/* Login Method Selector */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setLoginMethod('credentials')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
              loginMethod === 'credentials'
                ? 'bg-gold/20 text-gold border border-gold/30'
                : 'bg-black/20 text-gold/60 border border-gold/10 hover:border-gold/20'
            }`}
          >
            CPF + Senha
          </button>
          <button
            onClick={openFaceRecognition}
            className="flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/30"
          >
            Reconhecimento Facial
          </button>
          <button
            onClick={() => navigate('/register')}
            className="flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all bg-neon-pink/20 text-neon-pink border border-neon-pink/30 hover:bg-neon-pink/40"
          >
            Cadastrar
          </button>
        </div>

        {/* Error Display */}
        {error && !showFaceRecognition && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Credentials Login Form */}
        {loginMethod === 'credentials' && (
          <div ref={formRef}>
            <form onSubmit={handleCredentialsLogin} className="space-y-4">
              <div>
                <label className="block text-gold text-sm font-medium mb-2">
                  CPF
                </label>
                <input
                  type="text"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleCPFChange}
                  placeholder="000.000.000-00"
                  className="luxury-input w-full"
                  maxLength="14"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gold text-sm font-medium mb-2">
                  Nome Completo
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Digite seu nome completo"
                  className="luxury-input w-full"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-luxury disabled:opacity-50"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          </div>
        )}

        {/* Face Recognition Modal */}
        {showFaceRecognition && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-md mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gold/20">
                <h3 className="text-lg font-bold text-gold flex items-center space-x-2">
                  <Scan className="w-5 h-5" />
                  <span>Reconhecimento Facial</span>
                </h3>
                <button
                  onClick={closeFaceRecognition}
                  className="p-2 hover:bg-gold/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gold" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                {faceRecognitionStep === 'camera' && (
                  <div className="text-center">
                    <div className="relative mb-4">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-64 object-cover rounded-lg border-2 border-gold/30 bg-black"
                      />
                      
                      {/* Face detection overlay - matching the design from images */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="relative">
                          {/* Face outline circle */}
                          <div className="w-48 h-56 border-2 border-gold rounded-full relative">
                            {/* Corner indicators */}
                            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-gold"></div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-gold"></div>
                            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-gold"></div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-gold"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-neon-cyan text-sm mb-4">
                      Posicione seu rosto no centro e clique para escanear
                    </p>

                    <button
                      onClick={captureAndRecognize}
                      className="w-full py-3 px-6 bg-gold text-black font-bold rounded-lg hover:bg-gold/90 transition-colors flex items-center justify-center space-x-2"
                    >
                      <Camera className="w-5 h-5" />
                      <span>ESCANEAR ROSTO</span>
                    </button>

                    <p className="text-gold/60 text-xs mt-3">
                      Certifique-se de que há boa iluminação e que seu rosto está visível
                    </p>
                  </div>
                )}

                {faceRecognitionStep === 'scanning' && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gold font-medium mb-2">Analisando rosto...</p>
                    <div className="w-32 h-2 bg-black/50 rounded-full mx-auto overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-gold to-yellow-400 transition-all duration-300"
                        style={{ width: `${scanProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-gold/80 text-sm mt-1">{scanProgress}%</p>
                  </div>
                )}

                {faceRecognitionStep === 'success' && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-green-400 font-medium">Reconhecimento realizado com sucesso!</p>
                    <p className="text-gold/80 text-sm mt-1">Redirecionando...</p>
                  </div>
                )}

                {faceRecognitionStep === 'error' && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <X className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-red-400 mb-4">{error}</p>
                    <button
                      onClick={retryFaceRecognition}
                      className="btn-luxury flex items-center space-x-2 mx-auto"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Tentar Novamente</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Hidden canvas for image processing */}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-gold/60 hover:text-gold text-sm transition-colors"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    </div>
  )
}

