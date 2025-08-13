# 🍽️ Sistema de Receitas e Ingredientes - Guia de Integração

## 📋 Visão Geral

Este documento explica como integrar o **Sistema Completo de Receitas e Ingredientes** no aplicativo ItSells. O sistema oferece controle preciso de estoque, gestão de receitas, baixa automática de ingredientes e relatórios detalhados.

## 🏗️ Arquitetura do Sistema

### 📊 Banco de Dados
- **5 Tabelas principais**: `ingredients`, `ingredient_batches`, `recipes`, `recipe_ingredients`, `ingredient_stock_movements`
- **Funções SQL**: Cálculo de custos e verificação de disponibilidade
- **Views**: Resumos de estoque e análises de custo
- **RLS Policies**: Controle de acesso por roles

### 🔧 Serviços JavaScript
- **IngredientService**: CRUD de ingredientes e lotes
- **RecipeService**: Gestão de receitas e análises
- **StockDeductionService**: Baixa automática de estoque

### 🎨 Componentes React
- **IngredientManagement**: Interface completa de ingredientes
- **RecipeManagement**: Gestão de receitas
- **RecipeManagementDashboard**: Dashboard principal
- **SalesIntegration**: Demonstração de integração
- **useRecipeManagement**: Hook personalizado

## 🚀 Passo a Passo da Integração

### 1️⃣ **Configuração do Banco de Dados**

```sql
-- Execute os scripts SQL na seguinte ordem:
1. database/create_ingredients_tables.sql
2. database/create_recipes_tables.sql  
3. database/create_stock_movements_table.sql
4. database/create_recipe_functions.sql
5. database/insert_sample_data.sql
```

### 2️⃣ **Instalação dos Serviços**

Os serviços já estão criados em:
- `src/services/ingredientService.js`
- `src/services/recipeService.js`
- `src/services/stockDeductionService.js`

### 3️⃣ **Adição de Rotas no App.jsx**

```jsx
// Adicione estas rotas no App.jsx
import RecipeManagementDashboard from './components/RecipeManagementDashboard';
import IngredientManagement from './components/IngredientManagement';
import RecipeManagement from './components/RecipeManagement';
import SalesIntegration from './components/SalesIntegration';

// Dentro do Router:
<Route path="/recipe-dashboard" element={<RecipeManagementDashboard />} />
<Route path="/ingredients" element={<IngredientManagement />} />
<Route path="/recipes" element={<RecipeManagement />} />
<Route path="/sales-integration" element={<SalesIntegration />} />
```

### 4️⃣ **Atualização da Navegação**

```jsx
// Adicione no menu principal (Sidebar/Navigation):
{
  name: 'Receitas',
  icon: ChefHat,
  children: [
    { name: 'Dashboard', href: '/recipe-dashboard' },
    { name: 'Ingredientes', href: '/ingredients' },
    { name: 'Receitas', href: '/recipes' },
    { name: 'Integração', href: '/sales-integration' }
  ]
}
```

### 5️⃣ **Integração com Sistema de Vendas**

Para integrar com o sistema de vendas existente:

```jsx
// No componente de finalização de pedido:
import { StockDeductionService } from '../services/stockDeductionService';

const handleOrderConfirmation = async (orderData) => {
  try {
    // 1. Criar o pedido normalmente
    const order = await createOrder(orderData);
    
    // 2. Processar baixa de estoque automaticamente
    const stockResult = await StockDeductionService.processOrderStockDeduction(
      order.id,
      currentUser.id
    );
    
    if (!stockResult.success) {
      console.warn('Falha na baixa de estoque:', stockResult.error);
      // Decidir se cancela o pedido ou continua
    }
    
    return order;
  } catch (error) {
    console.error('Erro ao processar pedido:', error);
  }
};
```

## 🔗 Integrações Específicas

### 📦 **Integração com Sistema de Produtos**

```jsx
// Vincular produtos do menu às receitas:
// 1. Adicione campo recipe_id na tabela products
ALTER TABLE products ADD COLUMN recipe_id UUID REFERENCES recipes(id);

// 2. No ProductForm, adicione seletor de receita:
const [selectedRecipe, setSelectedRecipe] = useState('');
const { recipes } = useRecipeManagement();

<select 
  value={selectedRecipe}
  onChange={(e) => setSelectedRecipe(e.target.value)}
>
  <option value="">Selecione uma receita</option>
  {recipes.map(recipe => (
    <option key={recipe.id} value={recipe.id}>
      {recipe.name}
    </option>
  ))}
</select>
```

### 🛒 **Integração com Carrinho de Compras**

```jsx
// Verificar disponibilidade antes de adicionar ao carrinho:
import { RecipeService } from '../services/recipeService';

const handleAddToCart = async (product) => {
  if (product.recipe_id) {
    const availability = await RecipeService.checkRecipeAvailability(product.recipe_id);
    
    if (!availability.success || !availability.data.available) {
      alert('Produto indisponível - ingredientes insuficientes');
      return;
    }
  }
  
  // Adicionar ao carrinho normalmente
  addToCart(product);
};
```

### 📊 **Integração com Relatórios**

```jsx
// Adicionar relatórios de consumo aos dashboards existentes:
import { StockDeductionService } from '../services/stockDeductionService';

const DashboardAdmin = () => {
  const [consumptionReport, setConsumptionReport] = useState([]);
  
  useEffect(() => {
    const loadConsumptionReport = async () => {
      const today = new Date().toISOString().split('T')[0];
      const result = await StockDeductionService.getConsumptionReport(today, today);
      if (result.success) {
        setConsumptionReport(result.data);
      }
    };
    
    loadConsumptionReport();
  }, []);
  
  // Renderizar relatório...
};
```

## 🎯 Funcionalidades Principais

### ✅ **Gestão de Ingredientes**
- ✅ CRUD completo de ingredientes
- ✅ Controle de lotes com datas de vencimento
- ✅ Alertas de estoque baixo e vencimento
- ✅ Categorização e busca avançada
- ✅ Histórico de movimentações

### ✅ **Gestão de Receitas**
- ✅ Criação e edição de receitas
- ✅ Cálculo automático de custos
- ✅ Verificação de disponibilidade
- ✅ Análise de margem de lucro
- ✅ Duplicação de receitas

### ✅ **Controle de Estoque**
- ✅ Baixa automática na venda
- ✅ Simulação de impacto no estoque
- ✅ Reversão de movimentações
- ✅ Relatórios de consumo
- ✅ Rastreabilidade completa

### ✅ **Dashboard e Relatórios**
- ✅ Visão geral do sistema
- ✅ Estatísticas em tempo real
- ✅ Alertas visuais
- ✅ Análises de custo
- ✅ Filtros e buscas

## 🔒 Controle de Acesso

### Roles e Permissões:
- **Admin**: Acesso total ao sistema
- **Staff**: Gestão operacional (sem deletar)
- **Customer**: Apenas visualização de produtos disponíveis

### Implementação no Frontend:
```jsx
// Hook para verificar permissões:
import { useAuth } from '../hooks/useAuth';

const { user, hasRole } = useAuth();

// Renderização condicional:
{hasRole('admin') && (
  <Button onClick={handleDeleteRecipe}>
    Deletar Receita
  </Button>
)}
```

## 📱 Responsividade

Todos os componentes são totalmente responsivos:
- **Desktop**: Layout completo com sidebars
- **Tablet**: Layout adaptado com navegação por tabs
- **Mobile**: Interface otimizada para toque

## 🎨 Temas e Personalização

O sistema utiliza o design system existente:
- **Tailwind CSS**: Classes utilitárias
- **Shadcn/ui**: Componentes base
- **Lucide Icons**: Ícones consistentes
- **Cores**: Paleta do ItSells

## 🧪 Testes

### Testes Recomendados:
1. **Criação de ingredientes e lotes**
2. **Criação de receitas com ingredientes**
3. **Simulação de baixa de estoque**
4. **Processamento de pedidos reais**
5. **Verificação de alertas**
6. **Relatórios de consumo**

### Dados de Teste:
O sistema inclui dados de exemplo para facilitar os testes iniciais.

## 🚨 Considerações Importantes

### ⚠️ **Antes de Usar em Produção:**
1. **Backup do banco de dados**
2. **Teste em ambiente de desenvolvimento**
3. **Configuração de permissões RLS**
4. **Validação de dados existentes**
5. **Treinamento da equipe**

### 🔧 **Configurações Recomendadas:**
- **Alertas de estoque**: 20% do estoque mínimo
- **Dias para vencimento**: 7 dias
- **Backup automático**: Diário
- **Logs de auditoria**: Habilitados

## 📞 Suporte

Para dúvidas ou problemas:
1. **Documentação**: Este arquivo
2. **Logs**: Console do navegador
3. **Database**: Supabase Dashboard
4. **Código**: Comentários nos arquivos

## 🎉 Próximos Passos

Após a integração:
1. **Cadastrar ingredientes reais**
2. **Criar receitas dos produtos**
3. **Configurar alertas**
4. **Treinar equipe**
5. **Monitorar performance**

---

**✅ Sistema Completo e Pronto para Produção!**

O Sistema de Receitas e Ingredientes está totalmente implementado e documentado. Siga este guia para uma integração suave e eficiente no ItSells.
