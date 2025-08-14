import React from 'react';
import IngredientManagement from '../components/IngredientManagement';

/**
 * Página de Gestão de Ingredientes
 * Utiliza o componente IngredientManagement para funcionalidade completa
 */
const Ingredients = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <div className="container mx-auto px-4 py-8">
        <IngredientManagement />
      </div>
    </div>
  );
};

export default Ingredients;
