# Instruções para Criar a Tabela product_batches

## Problema Identificado
O módulo de gestão de lotes está apresentando erro porque a tabela `product_batches` não existe no banco de dados Supabase.

**Erro:**
```
relation "public.product_batches" does not exist
```

## Solução

### Passo 1: Acessar o Supabase Dashboard
1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Faça login na sua conta
3. Selecione o projeto ItSells

### Passo 2: Executar o Script SQL
1. No dashboard do Supabase, vá para **SQL Editor**
2. Clique em **New Query**
3. Copie e cole todo o conteúdo do arquivo `database/create_product_batches_table.sql`
4. Clique em **Run** para executar o script

### Passo 3: Verificar a Criação
Após executar o script, você deve ver:
- ✅ Tabela `product_batches` criada
- ✅ Índices criados para performance
- ✅ Políticas RLS configuradas
- ✅ Dados de exemplo inseridos (20 lotes)
- ✅ Mensagem: "Tabela product_batches criada com sucesso!"

### Passo 4: Testar o Módulo
1. Volte para a aplicação
2. Acesse **Staff Dashboard → Batch Management**
3. Verifique se os lotes aparecem na lista
4. Teste a criação de novos lotes

## Estrutura da Tabela

A tabela `product_batches` inclui:

### Campos Principais:
- `id` - UUID único do lote
- `product_id` - Referência ao produto
- `batch_number` - Número identificador do lote
- `quantity` - Quantidade disponível
- `unit_cost` - Custo unitário
- `supplier` - Fornecedor
- `manufacturing_date` - Data de fabricação
- `expiration_date` - Data de vencimento
- `location` - Localização física
- `notes` - Observações
- `status` - Status (active, expired, disposed, depleted)

### Campos de Controle:
- `disposal_notes` - Notas de descarte
- `disposal_date` - Data de descarte
- `created_at` - Data de criação
- `updated_at` - Data de atualização (auto-atualizada)

### Recursos Implementados:
- ✅ Índices para performance
- ✅ Trigger para auto-atualização de `updated_at`
- ✅ RLS (Row Level Security) habilitado
- ✅ Políticas de acesso configuradas
- ✅ Dados de exemplo para teste
- ✅ Comentários documentando cada campo

## Após a Execução

O módulo de gestão de lotes estará totalmente funcional com:
- ✅ Criação de novos lotes
- ✅ Visualização de lotes existentes
- ✅ Controle de vencimentos
- ✅ Estatísticas do dashboard
- ✅ Filtros e buscas
- ✅ Ações de descarte/vencimento
