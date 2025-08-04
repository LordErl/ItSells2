import { useState, useEffect } from 'react'

/**
 * Componente que exibe um indicador de tempo de preparo
 * @param {Object} props
 * @param {Date|string} props.startedAt - Data/hora de início do preparo (formato ISO ou objeto Date)
 * @param {number} props.prepTime - Tempo estimado de preparo em minutos
 * @param {string} props.status - Status atual do item (PENDING, PRODUCING, READY, etc)
 */
export default function PrepTimeIndicator({ startedAt, prepTime, status }) {
  const [elapsedMinutes, setElapsedMinutes] = useState(0)
  const [isOverdue, setIsOverdue] = useState(false)
  
  // Calcular o tempo decorrido desde o início do preparo
  useEffect(() => {
    if (!startedAt || status !== 'PRODUCING') return
    
    const started = typeof startedAt === 'string' ? new Date(startedAt) : startedAt
    
    // Atualizar o tempo decorrido a cada 30 segundos
    const interval = setInterval(() => {
      const now = new Date()
      const elapsed = Math.floor((now - started) / (1000 * 60)) // Minutos decorridos
      
      setElapsedMinutes(elapsed)
      setIsOverdue(elapsed > prepTime)
    }, 30000) // Atualiza a cada 30 segundos
    
    // Executar uma vez imediatamente
    const now = new Date()
    const elapsed = Math.floor((now - started) / (1000 * 60))
    setElapsedMinutes(elapsed)
    setIsOverdue(elapsed > prepTime)
    
    return () => clearInterval(interval)
  }, [startedAt, prepTime, status])
  
  // Se não estiver em produção ou não tiver tempo de início, não mostrar nada
  if (status !== 'PRODUCING' || !startedAt) {
    return null
  }
  
  // Calcular a porcentagem de conclusão
  const percentComplete = Math.min(100, Math.round((elapsedMinutes / prepTime) * 100))
  
  // Determinar a cor com base no tempo decorrido
  const getColor = () => {
    if (isOverdue) return 'bg-red-500'
    if (percentComplete > 80) return 'bg-yellow-500'
    return 'bg-neon-green'
  }
  
  return (
    <div className="w-full mt-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gold/80">
          {elapsedMinutes} min / {prepTime} min
        </span>
        {isOverdue && (
          <span className="text-red-400 font-medium">
            Atrasado ({elapsedMinutes - prepTime} min)
          </span>
        )}
      </div>
      
      <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor()} transition-all duration-500`}
          style={{ width: `${percentComplete}%` }}
        />
      </div>
    </div>
  )
}
