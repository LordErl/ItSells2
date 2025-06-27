# Configuração do Supabase

Este documento explica como configurar o Supabase para o Luxury Restaurant App.

## 1. Criando o Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Faça login ou crie uma conta
3. Clique em "New Project"
4. Escolha sua organização
5. Preencha os dados do projeto:
   - **Name**: luxury-restaurant-app
   - **Database Password**: Crie uma senha forte
   - **Region**: Escolha a região mais próxima
6. Clique em "Create new project"

## 2. Configurando o Banco de Dados

### 2.1. Executar o Schema
1. No painel do Supabase, vá para **SQL Editor**
2. Clique em "New query"
3. Copie e cole o conteúdo do arquivo `database/schema.sql`
4. Execute a query clicando em "Run"

### 2.2. Verificar as Tabelas
Após executar o schema, você deve ter as seguintes tabelas:
- `users` - Usuários do sistema
- `face_data` - Dados de reconhecimento facial
- `categories` - Categorias de produtos
- `products` - Produtos do menu
- `tables` - Mesas do restaurante
- `orders` - Pedidos
- `order_items` - Itens dos pedidos
- `payments` - Pagamentos
- `customer_accounts` - Contas dos clientes
- `reservations` - Reservas
- `staff` - Funcionários
- `inventory` - Estoque
- `audit_log` - Log de auditoria

## 3. Configurando as Variáveis de Ambiente

### 3.1. Obter as Credenciais
1. No painel do Supabase, vá para **Settings > API**
2. Copie os valores:
   - **Project URL**
   - **anon public key**

### 3.2. Configurar o Arquivo .env
1. Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edite o arquivo `.env` com suas credenciais:
   ```env
   VITE_SUPABASE_URL=https://seu-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
   ```

## 4. Configurando Row Level Security (RLS)

O schema já inclui políticas de RLS básicas, mas você pode personalizar conforme necessário:

### 4.1. Políticas Existentes
- **users**: Usuários podem ver apenas seus próprios dados
- **orders**: Clientes veem apenas seus pedidos, staff vê todos
- **payments**: Clientes veem apenas seus pagamentos
- **customer_accounts**: Clientes veem apenas suas contas

### 4.2. Personalizando Políticas
Para modificar as políticas, use o SQL Editor:

```sql
-- Exemplo: Permitir que staff veja todos os usuários
CREATE POLICY "Staff can view all users" ON users FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id::text = auth.uid()::text 
        AND role IN ('admin', 'staff')
    )
);
```

## 5. Configurando Storage (Opcional)

Para armazenar imagens de produtos e fotos dos usuários:

### 5.1. Criar Buckets
1. Vá para **Storage** no painel do Supabase
2. Crie os seguintes buckets:
   - `product-images` - Para imagens dos produtos
   - `user-photos` - Para fotos dos usuários
   - `face-data` - Para dados de reconhecimento facial

### 5.2. Configurar Políticas de Storage
```sql
-- Permitir upload de imagens de produtos (apenas admin/staff)
CREATE POLICY "Admin can upload product images" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'product-images' AND
    EXISTS (
        SELECT 1 FROM users 
        WHERE id::text = auth.uid()::text 
        AND role IN ('admin', 'staff')
    )
);

-- Permitir visualização pública de imagens de produtos
CREATE POLICY "Anyone can view product images" ON storage.objects FOR SELECT USING (
    bucket_id = 'product-images'
);
```

## 6. Dados de Exemplo

O schema já inclui alguns dados de exemplo:
- 1 usuário admin (CPF: 12345678901, senha: admin123)
- 1 usuário staff (CPF: 98765432100, senha: staff123)
- 5 categorias de produtos
- 8 produtos de exemplo
- 20 mesas
- 5 itens de estoque

## 7. Testando a Conexão

Para testar se tudo está funcionando:

1. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

2. Acesse a aplicação e tente fazer login com:
   - **CPF**: 12345678901
   - **Senha**: admin123

## 8. Funcionalidades Avançadas

### 8.1. Real-time Subscriptions
O app já está configurado para usar subscriptions em tempo real para:
- Novos pedidos
- Mudanças de status de pedidos
- Atualizações de mesas

### 8.2. Triggers e Functions
O schema inclui triggers automáticos para:
- Atualizar `updated_at` automaticamente
- Log de auditoria (se necessário)

### 8.3. Backup e Restore
Configure backups automáticos no painel do Supabase:
1. Vá para **Settings > Database**
2. Configure **Point in Time Recovery**
3. Configure **Scheduled Backups**

## 9. Monitoramento

### 9.1. Logs
- Acesse **Logs** no painel para ver logs de API
- Configure alertas para erros críticos

### 9.2. Métricas
- Monitore uso de API em **Settings > Usage**
- Configure limites e alertas

## 10. Produção

### 10.1. Configurações de Segurança
- Revise todas as políticas de RLS
- Configure CORS adequadamente
- Use HTTPS sempre
- Configure rate limiting

### 10.2. Performance
- Configure índices adicionais se necessário
- Monitore queries lentas
- Use connection pooling

## Troubleshooting

### Erro de Conexão
- Verifique se as variáveis de ambiente estão corretas
- Confirme se o projeto Supabase está ativo
- Verifique a conectividade de rede

### Erro de Permissão
- Revise as políticas de RLS
- Confirme se o usuário tem as permissões corretas
- Verifique os logs de erro no Supabase

### Performance Lenta
- Analise as queries no SQL Editor
- Adicione índices necessários
- Considere otimizar as consultas

## Suporte

Para mais informações:
- [Documentação do Supabase](https://supabase.com/docs)
- [Guia de RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Guide](https://supabase.com/docs/guides/storage)

