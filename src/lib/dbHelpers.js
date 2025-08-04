import { TABLES } from './constants';

/**
 * Helper functions for database operations
 */
export const formatDate = (date) => {
  return new Date(date).toISOString();
};

export const parseDate = (dateString) => {
  return new Date(dateString);
};

export const generateId = () => {
  return crypto.randomUUID();
};

export const handleError = (error) => {
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
};

export const getTables = () => TABLES;

// Exportar como objeto para compatibilidade com código existente
const dbHelpers = {
  formatDate,
  parseDate,
  generateId,
  handleError,
  getTables
};

export default dbHelpers;
