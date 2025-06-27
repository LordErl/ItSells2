import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import PhotoUpload from '../components/PhotoUpload'
import { Eye, EyeOff } from 'lucide-react'
import anime from 'animejs'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    cpf: '',
    name: '',
    email: '',
    password: '',
    photo: null,
    photoUrl: null
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const { registerWithPhoto } = useAuth()
  const navigate = useNavigate()
  const formRef = useRef(null)

  // Animation on mount
  useEffect(() => {
    if (formRef.current) {
      anime({
        targets: formRef.current.children,
        translateY: [50, 0],
        opacity: [0, 1],
        delay: anime.stagger(100),
        duration: 800,
        easing: 'easeOutExpo'
      })
    }
  }, [])

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle photo selection
  const handlePhotoSelect = (file, url) => {
    setFormData(prev => ({
      ...prev,
      photo: file,
      photoUrl: url
    }))
  }

  // Format CPF input
  const formatCPF = (value) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  }

  // Handle CPF input
  const handleCPFChange = (e) => {
    const formatted = formatCPF(e.target.value)
    setFormData(prev => ({
      ...prev,
      cpf: formatted
    }))
  }

  // Validate CPF
  const validateCPF = (cpf) => {
    const cleanCPF = cpf.replace(/\D/g, '')
    if (cleanCPF.length !== 11) return false
    
    // Basic CPF validation logic
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false
    
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
    }
    let remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false
    
    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
    }
    remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cleanCPF.charAt(10))) return false
    
    return true
  }

  // Validate email
  const validateEmail = (email) => {
    if (!email) return true // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      // Validate required fields
      if (!formData.cpf || !formData.name) {
        throw new Error('CPF e nome são obrigatórios')
      }

      // Validate CPF format
      if (!validateCPF(formData.cpf)) {
        throw new Error('CPF inválido')
      }

      // Validate email if provided
      if (formData.email && !validateEmail(formData.email)) {
        throw new Error('Email inválido')
      }

      // Validate password if provided
      if (formData.password && formData.password.length < 6) {
        throw new Error('Senha deve ter pelo menos 6 caracteres')
      }

      // Prepare data for registration
      const userData = {
        cpf: formData.cpf,
        name: formData.name.trim()
      }

      // Add optional fields if provided
      if (formData.email && formData.email.trim()) {
        userData.email = formData.email.trim()
      }

      if (formData.password && formData.password.trim()) {
        userData.password = formData.password.trim()
      }

      console.log('Registering user with data:', userData)

      // Register user
      const result = await registerWithPhoto(userData, formData.photo)
      
      if (result.success) {
        setSuccess('Conta criada com sucesso!')
        
        // Success animation
        anime({
          targets: formRef.current,
          scale: [1, 1.05, 1],
          duration: 600,
          easing: 'easeInOutQuad'
        })

        // Redirect to customer area
        setTimeout(() => {
          navigate('/customer')
        }, 2000)
      } else {
        throw new Error(result.error || 'Erro ao criar conta')
      }

    } catch (err) {
      console.error('Registration error:', err)
      setError(err.message || 'Erro ao criar conta')
      
      // Error shake animation
      anime({
        targets: formRef.current,
        translateX: [-10, 10, -10, 10, 0],
        duration: 500,
        easing: 'easeInOutQuad'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen animated-bg flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md mx-auto">
        {/* Header */}
        <div className="text-center p-6 border-b border-gold/20">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-gold to-yellow-600 flex items-center justify-center">
            <span className="text-2xl font-bold text-black">It$</span>
          </div>
          <h1 className="text-2xl font-bold text-gold-gradient mb-2">
            It$ell's
          </h1>
          <p className="text-gold/80">Criar Nova Conta</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6" ref={formRef}>
          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* CPF Field */}
          <div>
            <label className="block text-sm font-medium text-gold mb-2">
              CPF *
            </label>
            <input
              type="text"
              name="cpf"
              value={formData.cpf}
              onChange={handleCPFChange}
              placeholder="000.000.000-00"
              maxLength={14}
              className="luxury-input w-full"
              required
            />
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gold mb-2">
              Nome Completo *
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

          {/* Email Field (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gold mb-2">
              Email (Opcional)
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="seu@email.com"
              className="luxury-input w-full"
            />
            <p className="text-gold/60 text-xs mt-1">
              Para recuperação de conta e notificações
            </p>
          </div>

          {/* Password Field (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gold mb-2">
              Senha (Opcional)
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Mínimo 6 caracteres"
                className="luxury-input w-full pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gold/60 hover:text-gold"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-gold/60 text-xs mt-1">
              Ou use apenas reconhecimento facial
            </p>
          </div>

          {/* Photo Upload */}
          <PhotoUpload
            onPhotoSelect={handlePhotoSelect}
            currentPhoto={formData.photoUrl}
            label="Foto (Opcional)"
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn-luxury w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="luxury-spinner"></div>
                <span>Criando conta...</span>
              </>
            ) : (
              <span>Criar Conta</span>
            )}
          </button>

          {/* Info */}
          <div className="text-center text-gold/60 text-xs">
            <p>* Campos obrigatórios</p>
            <p className="mt-1">Email e senha são opcionais para login por reconhecimento facial</p>
          </div>

          {/* Back to Login */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-gold/80 hover:text-gold text-sm underline"
            >
              Já tem conta? Fazer login
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

