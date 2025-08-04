// Importar tabelas
import { TABLES } from './constants';

// Helper functions for database operations
const dbHelpers = {
  // Format date for Supabase
  formatDate: (date) => {
    return new Date(date).toISOString();
  },
  
  // Parse date from Supabase
  parseDate: (dateString) => {
    return new Date(dateString);
  },
  
  // Generate UUID (for client-side ID generation if needed)
  generateId: () => {
    return crypto.randomUUID();
  },
  
  // Handle Supabase errors
  handleError: (error) => {
    console.error('Supabase error:', error);
    
    if (!error) return 'Erro desconhecido';
    
    if (error.code === 'PGRST301') {
      return 'Registro não encontrado';
    } else if (error.code === '23505') {
      return 'Este registro já existe';
    } else if (error.code === '23503') {
      return 'Não é possível excluir este registro pois está sendo usado';
    } else if (error.message && error.message.includes('JWT')) {
      return 'Sessão expirada. Faça login novamente';
    } else {
      return error.message || 'Erro desconhecido';
    }
  },
  
  // Get table names
  getTables: () => TABLES
};

export default dbHelpers;
