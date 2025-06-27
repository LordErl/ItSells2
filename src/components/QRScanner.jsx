import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { useNavigate } from 'react-router-dom'

export default function QRScanner() {
  const [isScanning, setIsScanning] = useState(true)
  const [error, setError] = useState(null)
  const scannerRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!scannerRef.current) return

    const scanner = new Html5QrcodeScanner(
      "qr-scanner",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      false
    )

    const onScanSuccess = (decodedText, decodedResult) => {
      console.log('QR Code scanned:', decodedText)
      
      // Stop scanning
      scanner.clear()
      setIsScanning(false)
      
      // Process QR code data
      try {
        // Assuming QR code contains table information
        const qrData = JSON.parse(decodedText)
        
        if (qrData.type === 'table' && qrData.tableId) {
          // Redirect to customer login with table info
          navigate(`/login?table=${qrData.tableId}`)
        } else {
          // Generic QR code, redirect to login
          navigate('/login')
        }
      } catch (e) {
        // If not JSON, treat as simple text
        navigate('/login')
      }
    }

    const onScanFailure = (error) => {
      // Handle scan failure - usually not a problem
      console.log('QR scan failed:', error)
    }

    scanner.render(onScanSuccess, onScanFailure)

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error)
      }
    }
  }, [navigate])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center animated-bg p-4">
      <div className="glass-card p-8 text-center max-w-md w-full">
        {/* Header */}
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-neon-cyan to-neon-pink flex items-center justify-center">
            <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zM3 13a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zM13 3a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2v1h1V5h-1z" clipRule="evenodd" />
              <path d="M11 4a1 1 0 10-2 0v1a1 1 0 002 0V4zM10 7a1 1 0 011 1v1h2a1 1 0 110 2h-3a1 1 0 01-1-1V8a1 1 0 011-1zM16 12a1 1 0 100-2 1 1 0 000 2zM12 13a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1zM16 16a1 1 0 100-2 1 1 0 000 2zM16 20a1 1 0 100-2 1 1 0 000 2zM10 16a1 1 0 111-1h1a1 1 0 110 2h-1a1 1 0 01-1-1z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gold-gradient mb-2">
            Scanner QR Code
          </h1>
          <p className="text-gold/80 text-sm">
            Aponte a câmera para o QR Code da mesa
          </p>
        </div>

        {/* Scanner Container */}
        {isScanning && (
          <div className="mb-6">
            <div id="qr-scanner" className="rounded-lg overflow-hidden"></div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Instructions */}
        <div className="text-left space-y-2 mb-6">
          <h3 className="text-gold font-semibold text-sm mb-2">Instruções:</h3>
          <ul className="text-gold/70 text-xs space-y-1">
            <li>• Posicione o QR Code dentro do quadrado</li>
            <li>• Mantenha a câmera estável</li>
            <li>• Certifique-se de ter boa iluminação</li>
            <li>• Aguarde o reconhecimento automático</li>
          </ul>
        </div>

        {/* Manual Login Button */}
        <button
          onClick={() => navigate('/login')}
          className="w-full btn-luxury text-sm"
        >
          Fazer Login Manual
        </button>

        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="w-full mt-3 px-4 py-2 text-gold/80 hover:text-gold transition-colors text-sm"
        >
          Voltar ao Início
        </button>
      </div>
    </div>
  )
}

