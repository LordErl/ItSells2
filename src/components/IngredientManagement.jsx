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
  
  // Estados para formulário de ingrediente
  const [ingredientForm, setIngredientForm] = useState({
    name: '',
    category: '',
    unit_measure: 'kg',
    supplier: '',
    cost_per_unit: '',
    minimum_stock: '',
    description: ''
  });
  
  // Estados para formulário de lote
  const [batchForm, setBatchForm] = useState({
    ingredient_id: '',
    batch_number: '',
    quantity: '',
    unit_cost: '',
    supplier: '',
    manufacturing_date: '',
    expiration_date: '',
    location: 'estoque_principal',
    notes: ''
  });

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

  // Handlers para formulários
  const handleIngredientFormChange = (field, value) => {
    setIngredientForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBatchFormChange = (field, value) => {
    setBatchForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCreateIngredient = async () => {
    if (!ingredientForm.name.trim()) {
      setError('Nome do ingrediente é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const result = await IngredientService.createIngredient({
        ...ingredientForm,
        cost_per_unit: parseFloat(ingredientForm.cost_per_unit) || 0,
        minimum_stock: parseFloat(ingredientForm.minimum_stock) || 0
      });

      if (result.success) {
        setSuccess('Ingrediente criado com sucesso!');
        setShowAddIngredient(false);
        setIngredientForm({
          name: '',
          category: '',
          unit_measure: 'kg',
          supplier: '',
          cost_per_unit: '',
          minimum_stock: '',
          description: ''
        });
        await loadIngredients();
        await loadCategories();
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Erro ao criar ingrediente');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBatch = async () => {
    if (!batchForm.ingredient_id || !batchForm.batch_number.trim() || !batchForm.quantity) {
      setError('Ingrediente, número do lote e quantidade são obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const result = await IngredientService.createIngredientBatch({
        ...batchForm,
        quantity: parseFloat(batchForm.quantity),
        unit_cost: parseFloat(batchForm.unit_cost) || 0
      });

      if (result.success) {
        setSuccess('Lote criado com sucesso!');
        setShowAddBatch(false);
        setBatchForm({
          ingredient_id: '',
          batch_number: '',
          quantity: '',
          unit_cost: '',
          supplier: '',
          manufacturing_date: '',
          expiration_date: '',
          location: 'estoque_principal',
          notes: ''
        });
        await loadBatches();
        await loadStockSummary();
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Erro ao criar lote');
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateBatchNumber = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `L${year}${month}${day}${random}`;
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
          <Button onClick={() => {
            console.log('Clicou em Novo Ingrediente');
            setShowAddIngredient(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Ingrediente
          </Button>
          <Button variant="outline" onClick={() => {
            console.log('Clicou em Novo Lote');
            setShowAddBatch(true);
          }}>
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
              <div className="flex justify-between items-center">
                <CardTitle>Lista de Ingredientes</CardTitle>
                <Button 
                  onClick={() => {
                    console.log('Clicou em Novo Ingrediente (aba)');
                    setShowAddIngredient(true);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Ingrediente
                </Button>
              </div>
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
              <div className="flex justify-between items-center">
                <CardTitle>Lotes de Ingredientes</CardTitle>
                <Button 
                  onClick={() => {
                    console.log('Clicou em Novo Lote (aba)');
                    setShowAddBatch(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Lote
                </Button>
              </div>
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

      {/* Modal: Novo Ingrediente */}
      {console.log('showAddIngredient:', showAddIngredient)}
      {showAddIngredient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4">Novo Ingrediente</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome *</label>
                <Input
                  value={ingredientForm.name}
                  onChange={(e) => handleIngredientFormChange('name', e.target.value)}
                  placeholder="Nome do ingrediente"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Categoria</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={ingredientForm.category}
                  onChange={(e) => handleIngredientFormChange('category', e.target.value)}
                >
                  <option value="">Selecione uma categoria</option>
                  <option value="carnes">Carnes</option>
                  <option value="vegetais">Vegetais</option>
                  <option value="frutas">Frutas</option>
                  <option value="laticínios">Laticínios</option>
                  <option value="grãos">Grãos</option>
                  <option value="temperos">Temperos</option>
                  <option value="bebidas">Bebidas</option>
                  <option value="outros">Outros</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Unidade de Medida</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={ingredientForm.unit_measure}
                  onChange={(e) => handleIngredientFormChange('unit_measure', e.target.value)}
                >
                  <option value="kg">Quilograma (kg)</option>
                  <option value="g">Grama (g)</option>
                  <option value="l">Litro (l)</option>
                  <option value="ml">Mililitro (ml)</option>
                  <option value="un">Unidade (un)</option>
                  <option value="cx">Caixa (cx)</option>
                  <option value="pct">Pacote (pct)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Fornecedor</label>
                <Input
                  value={ingredientForm.supplier}
                  onChange={(e) => handleIngredientFormChange('supplier', e.target.value)}
                  placeholder="Nome do fornecedor"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Custo por Unidade (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={ingredientForm.cost_per_unit}
                  onChange={(e) => handleIngredientFormChange('cost_per_unit', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Estoque Mínimo</label>
                <Input
                  type="number"
                  step="0.01"
                  value={ingredientForm.minimum_stock}
                  onChange={(e) => handleIngredientFormChange('minimum_stock', e.target.value)}
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <textarea
                  className="w-full p-2 border rounded-md"
                  rows="3"
                  value={ingredientForm.description}
                  onChange={(e) => handleIngredientFormChange('description', e.target.value)}
                  placeholder="Descrição do ingrediente"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowAddIngredient(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateIngredient}
                disabled={loading}
              >
                {loading ? 'Criando...' : 'Criar Ingrediente'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Novo Lote */}
      {console.log('showAddBatch:', showAddBatch)}
      {showAddBatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4">Novo Lote</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Ingrediente *</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={batchForm.ingredient_id}
                  onChange={(e) => handleBatchFormChange('ingredient_id', e.target.value)}
                >
                  <option value="">Selecione um ingrediente</option>
                  {ingredients.map(ingredient => (
                    <option key={ingredient.id} value={ingredient.id}>
                      {ingredient.name} ({ingredient.unit_measure})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Número do Lote *</label>
                <div className="flex gap-2">
                  <Input
                    value={batchForm.batch_number}
                    onChange={(e) => handleBatchFormChange('batch_number', e.target.value)}
                    placeholder="Ex: L240814001"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBatchFormChange('batch_number', generateBatchNumber())}
                  >
                    Gerar
                  </Button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Quantidade *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={batchForm.quantity}
                  onChange={(e) => handleBatchFormChange('quantity', e.target.value)}
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Custo Unitário (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={batchForm.unit_cost}
                  onChange={(e) => handleBatchFormChange('unit_cost', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Fornecedor</label>
                <Input
                  value={batchForm.supplier}
                  onChange={(e) => handleBatchFormChange('supplier', e.target.value)}
                  placeholder="Nome do fornecedor"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Data de Fabricação</label>
                <Input
                  type="date"
                  value={batchForm.manufacturing_date}
                  onChange={(e) => handleBatchFormChange('manufacturing_date', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Data de Validade</label>
                <Input
                  type="date"
                  value={batchForm.expiration_date}
                  onChange={(e) => handleBatchFormChange('expiration_date', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Localização</label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={batchForm.location}
                  onChange={(e) => handleBatchFormChange('location', e.target.value)}
                >
                  <option value="estoque_principal">Estoque Principal</option>
                  <option value="geladeira">Geladeira</option>
                  <option value="freezer">Freezer</option>
                  <option value="despensa">Despensa</option>
                  <option value="almoxarifado">Almoxarifado</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Observações</label>
                <textarea
                  className="w-full p-2 border rounded-md"
                  rows="2"
                  value={batchForm.notes}
                  onChange={(e) => handleBatchFormChange('notes', e.target.value)}
                  placeholder="Observações sobre o lote"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowAddBatch(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateBatch}
                disabled={loading}
              >
                {loading ? 'Criando...' : 'Criar Lote'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IngredientManagement;
