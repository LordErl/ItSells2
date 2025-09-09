import React from 'react';
import {
  // Dashboard & Analytics
  BarChart3,
  TrendingUp,
  PieChart,
  Activity,
  
  // Products & Inventory  
  Package,
  ShoppingCart,
  Box as Boxes,
  AlertTriangle,
  Clock,
  
  // Users & Staff
  Users,
  User,
  UserCheck,
  Calendar,
  Shield,
  
  // Financial
  DollarSign,
  CreditCard,
  Wallet,
  Receipt,
  
  // Operations
  Settings,
  Cog,
  Database,
  FileText,
  Download,
  Upload,
  
  // Navigation
  Home,
  Menu,
  ArrowRight,
  ChevronRight,
  ArrowLeft,
  
  // Status & Actions
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Eye,
  Edit,
  Trash2,
  Plus,
  
  // Food & Restaurant
  UtensilsCrossed,
  Coffee,
  ChefHat,
  
  // System
  Building2,
  Monitor,
  Smartphone,
  Wifi,
  Signal,
  
  // Misc
  Star,
  Heart,
  Bell,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';

// Mapeamento de ícones para facilitar o uso
const iconMap = {
  // Dashboard & Analytics
  'dashboard': BarChart3,
  'trending': TrendingUp,
  'chart': PieChart,
  'activity': Activity,
  
  // Products & Inventory
  'products': Package,
  'cart': ShoppingCart,
  'inventory': Boxes,
  'warning': AlertTriangle,
  'time': Clock,
  
  // Users & Staff
  'users': Users,
  'user': User,
  'user-check': UserCheck,
  'calendar': Calendar,
  'shield': Shield,
  
  // Financial
  'money': DollarSign,
  'card': CreditCard,
  'wallet': Wallet,
  'receipt': Receipt,
  
  // Operations
  'settings': Settings,
  'cog': Cog,
  'database': Database,
  'file': FileText,
  'download': Download,
  'upload': Upload,
  
  // Navigation
  'home': Home,
  'menu': Menu,
  'arrow-right': ArrowRight,
  'chevron-right': ChevronRight,
  'arrow-left': ArrowLeft,
  
  // Status & Actions
  'check': CheckCircle,
  'x': XCircle,
  'alert': AlertCircle,
  'info': Info,
  'eye': Eye,
  'edit': Edit,
  'trash': Trash2,
  'plus': Plus,
  
  // Food & Restaurant
  'utensils': UtensilsCrossed,
  'coffee': Coffee,
  'chef': ChefHat,
  
  // System
  'building': Building2,
  'monitor': Monitor,
  'phone': Smartphone,
  'wifi': Wifi,
  'signal': Signal,
  
  // Misc
  'star': Star,
  'heart': Heart,
  'bell': Bell,
  'search': Search,
  'filter': Filter,
  'refresh': RefreshCw
};

// Componente Icon principal
export default function Icon({ 
  name, 
  size = 'md', 
  className = '', 
  color,
  interactive = false,
  ...props 
}) {
  const IconComponent = iconMap[name];
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }
  
  // Definir tamanhos
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4', 
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
    '2xl': 'w-10 h-10'
  };
  
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  
  // Classes base
  const baseClasses = `${sizeClass} transition-all duration-300`;
  
  // Classes interativas
  const interactiveClasses = interactive 
    ? 'cursor-pointer hover:scale-110 hover:text-gold-300' 
    : '';
  
  // Combinar classes
  const finalClasses = `${baseClasses} ${interactiveClasses} ${className}`.trim();
  
  return (
    <IconComponent 
      className={finalClasses}
      style={color ? { color } : {}}
      strokeWidth={2}
      {...props}
    />
  );
}

// Componente para ícones específicos da aplicação
export function AppIcon({ type, ...props }) {
  const appIconMap = {
    // Métricas do Dashboard
    'total-products': 'products',
    'active-orders': 'cart',
    'occupied-tables': 'utensils',
    'low-stock': 'warning',
    'employees': 'users',
    'sales': 'money',
    'payments': 'card',
    'expiring': 'alert',
    
    // Ações Rápidas
    'manage-products': 'products',
    'recipes': 'chef',
    'operational-dashboard': 'dashboard',
    'daily-report': 'chart',
    'company-settings': 'building',
    'ingredients': 'inventory',
    'expiration-control': 'warning',
    'batch-management': 'boxes',
    'employee-management': 'users',
    'schedule-management': 'calendar',
    'permission-management': 'shield',
    'cashier-module': 'wallet',
    'advanced-reports': 'trending',
    'system-settings': 'cog',
    'backup-management': 'database'
  };
  
  const iconName = appIconMap[type] || type;
  
  return <Icon name={iconName} {...props} />;
}

// Hook para usar ícones facilmente
export function useIcon(name) {
  return iconMap[name];
}

// Exports individuais para casos específicos
export {
  BarChart3,
  TrendingUp,
  PieChart,
  Activity,
  Package,
  ShoppingCart,
  Boxes,
  AlertTriangle,
  Clock,
  Users,
  User,
  UserCheck,
  Calendar,
  Shield,
  DollarSign,
  CreditCard,
  Wallet,
  Receipt,
  Settings,
  Cog,
  Database,
  FileText,
  Download,
  Upload,
  Home,
  Menu,
  ArrowRight,
  ChevronRight,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Eye,
  Edit,
  Trash2,
  Plus,
  UtensilsCrossed,
  Coffee,
  ChefHat,
  Building2,
  Monitor,
  Smartphone,
  Wifi,
  Signal,
  Star,
  Heart,
  Bell,
  Search,
  Filter,
  RefreshCw
};