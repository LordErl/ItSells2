# 🍳 SISTEMA DE GESTÃO DE RECEITAS E INGREDIENTES

## 📋 INSTRUÇÕES DE INSTALAÇÃO

### **PASSO 1: Executar Script no Supabase**

1. **Acesse o Supabase Dashboard:**
   - Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Selecione seu projeto ItSells

2. **Abra o SQL Editor:**
   - No menu lateral, clique em "SQL Editor"
   - Clique em "New query"

3. **Execute o Script:**
   - Abra o arquivo `database/create_ingredients_system.sql`
   - Copie TODO o conteúdo do arquivo
   - Cole no SQL Editor do Supabase
   - Clique em "Run" (▶️)

4. **Verifique a Criação:**
   - Vá em "Table Editor" no menu lateral
   - Confirme que as seguintes tabelas foram criadas:
     - ✅ `ingredients` (ingredientes base)
     - ✅ `ingredient_batches` (lotes de ingredientes)
     - ✅ `recipes` (receitas dos produtos)
     - ✅ `recipe_ingredients` (ingredientes por receita)
     - ✅ `ingredient_stock_movements` (movimentações)

---

## 🏗️ ESTRUTURA DO SISTEMA

### **Tabelas Principais:**

#### **1. `ingredients` - Ingredientes Base**
```sql
- id, name, category, unit_measure
- supplier, cost_per_unit, minimum_stock
- description, image_path, is_active
```
**Exemplo:** Carne Bovina, Queijo Mussarela, Alface, etc.

#### **2. `ingredient_batches` - Lotes com Vencimento**
```sql
- ingredient_id, batch_number, quantity
- expiration_date, status, supplier
- manufacturing_date, location, notes
```
**Exemplo:** Lote de carne com vencimento em 15 dias

#### **3. `recipes` - Receitas dos Produtos**
```sql
- product_id, name, version, total_cost
- prep_instructions, difficulty_level
- created_by, is_active
```
**Exemplo:** Receita do "Hambúrguer Gourmet"

#### **4. `recipe_ingredients` - Ingredientes por Receita**
```sql
- recipe_id, ingredient_id, quantity_needed
- unit_measure, cost_per_serving
- is_optional, preparation_notes
```
**Exemplo:** 150g de carne + 2 fatias de queijo

#### **5. `ingredient_stock_movements` - Histórico**
```sql
- ingredient_batch_id, movement_type, quantity
- reference_type, reference_id, performed_by
```
**Exemplo:** Saída de 150g de carne para pedido #123

---

## 🎯 FUNCIONALIDADES IMPLEMENTADAS

### **Funções SQL Especiais:**

#### **1. `calculate_recipe_total_cost(recipe_uuid)`**
- Calcula automaticamente o custo total da receita
- Atualiza o campo `total_cost` na tabela recipes
- **Uso:** `SELECT calculate_recipe_total_cost('uuid-da-receita');`

#### **2. `check_recipe_availability(recipe_uuid, servings)`**
- Verifica se há ingredientes suficientes para fazer a receita
- Retorna lista de ingredientes com disponibilidade
- **Uso:** `SELECT * FROM check_recipe_availability('uuid-da-receita', 2);`

### **Views para Relatórios:**

#### **1. `ingredient_stock_summary`**
- Resumo do estoque atual de todos os ingredientes
- Status: 'ok', 'low', 'expiring'
- **Uso:** `SELECT * FROM ingredient_stock_summary;`

#### **2. `recipe_cost_analysis`**
- Análise de custos e margens de lucro por receita
- Calcula porcentagem de lucro automaticamente
- **Uso:** `SELECT * FROM recipe_cost_analysis;`

---

## 🔐 PERMISSÕES (RLS)

### **Níveis de Acesso:**

#### **👑 ADMIN (Administradores):**
- ✅ CRUD completo em todas as tabelas
- ✅ Criar e editar receitas
- ✅ Gerenciar ingredientes e fornecedores
- ✅ Visualizar todos os relatórios

#### **👨‍🍳 STAFF (Funcionários):**
- ✅ Ler todas as receitas e ingredientes
- ✅ Gerenciar lotes de ingredientes
- ✅ Registrar movimentações de estoque
- ❌ Não pode editar receitas

#### **👤 CUSTOMER (Clientes):**
- ✅ Visualizar apenas produtos finais do menu
- ❌ Não tem acesso a receitas ou ingredientes

---

## 📊 DADOS DE EXEMPLO

O script já inclui dados de exemplo para teste:

### **Ingredientes Cadastrados:**
- **Carnes:** Carne Bovina, Frango, Bacon
- **Laticínios:** Queijo Mussarela, Cheddar, Manteiga
- **Vegetais:** Alface, Tomate, Cebola, Batata
- **Pães:** Pão de Hambúrguer, Hot Dog
- **Condimentos:** Maionese, Ketchup, Mostarda
- **Bebidas:** Refrigerante, Água Mineral

### **Lotes Automáticos:**
- Cada ingrediente recebe um lote inicial
- Vencimentos entre 30-90 dias
- Quantidades realistas por tipo de produto

---

## 🚀 PRÓXIMOS PASSOS

Após executar o script, o sistema estará pronto para:

1. **Desenvolvimento dos Serviços JavaScript**
2. **Criação das Interfaces React**
3. **Integração com Sistema de Vendas**
4. **Implementação de Alertas Automáticos**

---

## ⚠️ IMPORTANTE

- **Backup:** Sempre faça backup antes de executar scripts em produção
- **Teste:** Execute primeiro em ambiente de desenvolvimento
- **Verificação:** Confirme que todas as tabelas foram criadas corretamente
- **Dados:** Os dados de exemplo podem ser removidos após os testes

---

## 📞 SUPORTE

Se encontrar algum erro durante a execução:

1. Verifique se o usuário tem permissões de admin no Supabase
2. Confirme que não há conflitos com tabelas existentes
3. Verifique os logs de erro no SQL Editor
4. Execute as seções do script separadamente se necessário

**Status:** ✅ Pronto para execução!
