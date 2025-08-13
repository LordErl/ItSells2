import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  Calendar,
  TrendingDown,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { IngredientService } from '../services/ingredientService';

/**
 * Componente para gestão completa de ingredientes e lotes
 * Integrado com o Sistema de Receitas e Ingredientes
 */
const IngredientManagement = () => {
  // Estados
  const [ingredients, setIngredients] = useState([]);
  const [batches, setBatches] = useState([]);
  const [stockSummary, setStockSummary] = useState([]);
  const [expiringIngredients, setExpiringIngredients] = useState([]);
  const [lowStockIngredients, setLowStockIngredients] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [activeTab, setActiveTab] = useState('ingredients');

  // Estados para formulários
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadIngredients(),
        loadBatches(),
        loadStockSummary(),
        loadExpiringIngredients(),
        loadLowStockIngredients(),
        loadCategories()
      ]);
    } catch (error) {
      setError('Erro ao carregar dados iniciais');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadIngredients = async () => {
    const result = await IngredientService.getIngredients({
      search: searchTerm,
      category: selectedCategory
    });
    
    if (result.success) {
      setIngredients(result.data);
    } else {
      setError(result.error);
    }
  };

  const loadBatches = async () => {
    const result = await IngredientService.getIngredientBatches({
      status: 'active'
    });
    
    if (result.success) {
      setBatches(result.data);
    }
  };

  const loadStockSummary = async () => {
    const result = await IngredientService.getStockSummary();
    
    if (result.success) {
      setStockSummary(result.data);
    }
  };

  const loadExpiringIngredients = async () => {
    const result = await IngredientService.getExpiringIngredients(7);
    
    if (result.success) {
      setExpiringIngredients(result.data);
    }
  };

  const loadLowStockIngredients = async () => {
    const result = await IngredientService.getLowStockIngredients();
    
    if (result.success) {
      setLowStockIngredients(result.data);
    }
  };

  const loadCategories = async () => {
    const result = await IngredientService.getIngredientCategories();
    
    if (result.success) {
      setCategories(result.data);
    }
  };

  // Handlers
  const handleSearch = () => {
    loadIngredients();
  };

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
    setTimeout(loadIngredients, 100);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'active': { color: 'bg-green-100 text-green-800', label: 'Ativo' },
      'expired': { color: 'bg-red-100 text-red-800', label: 'Vencido' },
      'depleted': { color: 'bg-gray-100 text-gray-800', label: 'Esgotado' },
      'disposed': { color: 'bg-orange-100 text-orange-800', label: 'Descartado' }
    };
    
    const config = statusConfig[status] || statusConfig.active;
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getStockStatusBadge = (status) => {
    const statusConfig = {
      'ok': { color: 'bg-green-100 text-green-800', label: 'OK' },
      'low': { color: 'bg-yellow-100 text-yellow-800', label: 'Baixo' },
      'critical': { color: 'bg-red-100 text-red-800', label: 'Crítico' },
      'out': { color: 'bg-gray-100 text-gray-800', label: 'Sem Estoque' }
    };
    
    const config = statusConfig[status] || statusConfig.ok;
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const isExpiringSoon = (expirationDate) => {
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Carregando ingredientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Ingredientes</h1>
          <p className="text-gray-600">Controle completo de ingredientes e lotes</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddIngredient(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Ingrediente
          </Button>
          <Button variant="outline" onClick={() => setShowAddBatch(true)}>
            <Package className="h-4 w-4 mr-2" />
            Novo Lote
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Ingredientes</p>
                <p className="text-2xl font-bold">{ingredients.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Lotes Ativos</p>
                <p className="text-2xl font-bold">{batches.length}</p>
              </div>
              <Package className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Vencendo em 7 dias</p>
                <p className="text-2xl font-bold text-orange-600">{expiringIngredients.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Estoque Baixo</p>
                <p className="text-2xl font-bold text-red-600">{lowStockIngredients.length}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar ingredientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
            <Button onClick={handleSearch}>
              Buscar
            </Button>
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">Todas as categorias</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="ingredients">Ingredientes</TabsTrigger>
          <TabsTrigger value="batches">Lotes</TabsTrigger>
          <TabsTrigger value="stock">Estoque</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
        </TabsList>

        {/* Tab: Ingredientes */}
        <TabsContent value="ingredients">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Ingredientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Nome</th>
                      <th className="text-left p-2">Categoria</th>
                      <th className="text-left p-2">Unidade</th>
                      <th className="text-left p-2">Custo/Unidade</th>
                      <th className="text-left p-2">Estoque Mín.</th>
                      <th className="text-left p-2">Fornecedor</th>
                      <th className="text-left p-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ingredients.map(ingredient => (
                      <tr key={ingredient.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{ingredient.name}</td>
                        <td className="p-2">
                          <Badge variant="outline">{ingredient.category}</Badge>
                        </td>
                        <td className="p-2">{ingredient.unit_measure}</td>
                        <td className="p-2">{formatCurrency(ingredient.cost_per_unit)}</td>
                        <td className="p-2">{ingredient.minimum_stock}</td>
                        <td className="p-2">{ingredient.supplier || 'N/A'}</td>
                        <td className="p-2">
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Lotes */}
        <TabsContent value="batches">
          <Card>
            <CardHeader>
              <CardTitle>Lotes de Ingredientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Lote</th>
                      <th className="text-left p-2">Ingrediente</th>
                      <th className="text-left p-2">Quantidade</th>
                      <th className="text-left p-2">Vencimento</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Fornecedor</th>
                      <th className="text-left p-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map(batch => (
                      <tr key={batch.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-mono text-sm">{batch.batch_number}</td>
                        <td className="p-2">{batch.ingredients?.name}</td>
                        <td className="p-2">
                          {batch.quantity} {batch.ingredients?.unit_measure}
                        </td>
                        <td className="p-2">
                          <span className={isExpiringSoon(batch.expiration_date) ? 'text-orange-600 font-medium' : ''}>
                            {formatDate(batch.expiration_date)}
                          </span>
                        </td>
                        <td className="p-2">
                          {getStatusBadge(batch.status)}
                        </td>
                        <td className="p-2">{batch.supplier}</td>
                        <td className="p-2">
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Estoque */}
        <TabsContent value="stock">
          <Card>
            <CardHeader>
              <CardTitle>Resumo de Estoque</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Ingrediente</th>
                      <th className="text-left p-2">Categoria</th>
                      <th className="text-left p-2">Estoque Total</th>
                      <th className="text-left p-2">Estoque Mín.</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Valor Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockSummary.map(item => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{item.name}</td>
                        <td className="p-2">
                          <Badge variant="outline">{item.category}</Badge>
                        </td>
                        <td className="p-2">
                          {item.total_quantity} {item.unit_measure}
                        </td>
                        <td className="p-2">{item.minimum_stock}</td>
                        <td className="p-2">
                          {getStockStatusBadge(item.status)}
                        </td>
                        <td className="p-2">{formatCurrency(item.total_value || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Alertas */}
        <TabsContent value="alerts">
          <div className="space-y-4">
            {/* Ingredientes Vencendo */}
            {expiringIngredients.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-orange-500" />
                    Ingredientes Vencendo em 7 dias
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {expiringIngredients.map(batch => (
                      <div key={batch.id} className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                        <div>
                          <p className="font-medium">{batch.ingredients?.name}</p>
                          <p className="text-sm text-gray-600">
                            Lote: {batch.batch_number} • Vence em: {formatDate(batch.expiration_date)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{batch.quantity} {batch.ingredients?.unit_measure}</p>
                          <Badge className="bg-orange-100 text-orange-800">
                            {Math.ceil((new Date(batch.expiration_date) - new Date()) / (1000 * 60 * 60 * 24))} dias
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Estoque Baixo */}
            {lowStockIngredients.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-red-500" />
                    Ingredientes com Estoque Baixo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {lowStockIngredients.map(item => (
                      <div key={item.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-600">
                            Categoria: {item.category}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{item.total_quantity} {item.unit_measure}</p>
                          <p className="text-sm text-gray-600">
                            Mín: {item.minimum_stock} {item.unit_measure}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {expiringIngredients.length === 0 && lowStockIngredients.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-green-800 mb-2">Tudo certo!</h3>
                  <p className="text-green-600">Não há alertas de estoque no momento.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IngredientManagement;
