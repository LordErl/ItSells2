import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Format currency in Brazilian Real
export function formatCurrency(value) {
  if (value === null || value === undefined || isNaN(value)) {
    return 'R$ 0,00'
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

// Format date in Brazilian format
export function formatDate(date) {
  if (!date) return ''
  const dateObj = new Date(date)
  return dateObj.toLocaleDateString('pt-BR')
}

// Format time in Brazilian format
export function formatTime(date) {
  if (!date) return ''
  const dateObj = new Date(date)
  return dateObj.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}
