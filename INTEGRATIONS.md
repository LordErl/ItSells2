# 🔗 Guia de Integrações - It$ell's

Este documento detalha todas as integrações disponíveis no sistema It$ell's, incluindo configuração, uso e melhores práticas.

## 🤖 Integração WhatsApp com IA Local

### Configuração Inicial

1. **Servidor de IA Local**
   ```bash
   # Instalar dependências da IA local
   pip install fastapi uvicorn transformers torch
   pip install whatsapp-business-api-client
   ```

2. **Variáveis de Ambiente**
   ```env
   VITE_AI_ENDPOINT=http://localhost:8000
   VITE_WHATSAPP_TOKEN=seu_token_whatsapp
   VITE_WHATSAPP_WEBHOOK_SECRET=seu_webhook_secret
   ```

3. **Configuração do Webhook**
   - Configure o webhook no WhatsApp Business API
   - URL: `https://seu-dominio.com/api/whatsapp/webhook`
   - Eventos: `messages`, `message_status`

### Funcionalidades da IA

#### Processamento de Mensagens
- Reconhecimento de intenções (pedidos, reservas, dúvidas)
- Processamento de linguagem natural em português
- Contexto de conversação mantido
- Aprendizado contínuo baseado em feedback

#### Ações Automáticas
- **Criação de Reservas**: Processa solicitações de reserva
- **Consulta de Menu**: Envia cardápio atualizado
- **Status de Pedidos**: Informa status em tempo real
- **Processamento de Pedidos**: Cria pedidos via WhatsApp

#### Personalização
- Histórico de pedidos do cliente
- Preferências alimentares
- Sugestões baseadas em comportamento
- Horários preferenciais

### Exemplo de Uso

```javascript
import WhatsAppService from './services/whatsappService'

// Processar mensagem recebida
const result = await WhatsAppService.processMessage({
  from: '5511999999999',
  body: 'Quero fazer uma reserva para hoje às 20h para 4 pessoas',
  timestamp: Date.now() / 1000
})

// Enviar menu
await WhatsAppService.sendMenuInfo('5511999999999')
```

## 💳 Integração Banco CORA

### Configuração

1. **Credenciais**
   ```env
   VITE_CORA_API_URL=https://api.cora.com.br
   VITE_CORA_CLIENT_ID=seu_client_id
   VITE_CORA_CLIENT_SECRET=seu_client_secret
   ```

2. **Webhook Configuration**
   - Configure webhook no painel CORA
   - URL: `https://seu-dominio.com/api/cora/webhook`
   - Eventos: `pix.payment.approved`, `pix.payment.cancelled`

### Funcionalidades

#### Pagamentos PIX
```javascript
import CoraService from './services/coraService'

// Criar pagamento PIX
const payment = await CoraService.createPixPayment({
  amount: 50.00,
  description: 'Pedido Mesa 5',
  payer_name: 'João Silva',
  payer_document: '12345678901',
  payer_email: 'joao@email.com',
  external_id: 'pedido_123'
})

// QR Code disponível em: payment.qr_code
// Chave PIX disponível em: payment.pix_key
```

#### Consulta de Saldo
```javascript
const balance = await CoraService.getAccountBalance()
console.log(`Saldo disponível: R$ ${balance.available}`)
```

#### Histórico de Transações
```javascript
const transactions = await CoraService.getTransactionHistory(
  '2024-01-01', 
  '2024-01-31'
)
```

### Webhooks CORA

O sistema processa automaticamente os webhooks do CORA:

- **Pagamento Aprovado**: Atualiza status do pedido e conta do cliente
- **Pagamento Cancelado**: Marca pagamento como cancelado
- **Pagamento Expirado**: Atualiza status para expirado

## 💰 Integração Mercado Pago

### Configuração

1. **Credenciais**
   ```env
   VITE_MERCADO_PAGO_ACCESS_TOKEN=seu_access_token
   VITE_MERCADO_PAGO_PUBLIC_KEY=sua_public_key
   VITE_MERCADO_PAGO_WEBHOOK_SECRET=seu_webhook_secret
   ```

2. **Webhook Configuration**
   - Configure no painel do Mercado Pago
   - URL: `https://seu-dominio.com/api/mercadopago/webhook`

### Funcionalidades

#### Checkout Transparente
```javascript
import MercadoPagoService from './services/mercadoPagoService'

// Criar preferência de pagamento
const preference = await MercadoPagoService.createPreference({
  amount: 75.50,
  title: 'Pedido It$ell\'s',
  payer_name: 'Maria Silva',
  payer_email: 'maria@email.com',
  order_id: 'pedido_456'
})

// Redirecionar para: preference.checkout_url
```

#### Pagamento PIX
```javascript
const pixPayment = await MercadoPagoService.createPixPayment({
  amount: 30.00,
  description: 'Bebidas Mesa 3',
  payer_name: 'Carlos Santos',
  payer_document: '98765432100',
  payer_email: 'carlos@email.com'
})

// QR Code: pixPayment.qr_code
```

#### Pagamento com Cartão
```javascript
// Primeiro, criar token do cartão (frontend)
const cardToken = await MercadoPagoService.createCardToken({
  card_number: '4111111111111111',
  expiration_month: 12,
  expiration_year: 2025,
  security_code: '123',
  cardholder_name: 'JOAO SILVA',
  cardholder_document: '12345678901'
})

// Depois, processar pagamento
const payment = await MercadoPagoService.createCardPayment({
  amount: 100.00,
  card_token: cardToken.token,
  installments: 3,
  payment_method_id: 'visa',
  payer_email: 'joao@email.com'
})
```

## 🏭 Portal do Fornecedor

### Acesso e Autenticação

Os fornecedores acessam um portal dedicado com:
- Login via CPF/CNPJ e senha
- Dashboard específico com métricas relevantes
- Visão dos produtos fornecidos no estabelecimento

### Funcionalidades

#### Controle de Estoque
- Visualização dos níveis de estoque de seus produtos
- Alertas de estoque baixo
- Histórico de movimentação

#### Ponto de Pedido Automático
- Configuração de pontos de reposição
- Pedidos automáticos quando estoque atinge nível mínimo
- Aprovação e confirmação de pedidos

#### Controle de Vencimentos
- Lista de produtos próximos ao vencimento
- Alertas automáticos
- Relatórios de perdas por vencimento

### Exemplo de Uso

```javascript
// Verificar produtos com estoque baixo
const lowStockItems = supplierInventory.filter(item => 
  item.quantity <= item.min_quantity
)

// Criar pedido de reposição automático
const reorderItems = lowStockItems.map(item => ({
  product_id: item.id,
  quantity: item.max_quantity - item.quantity,
  unit_price: item.unit_price
}))
```

## 🔧 Configuração de Desenvolvimento

### Variáveis de Ambiente Completas

```env
# Supabase
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima

# WhatsApp IA
VITE_AI_ENDPOINT=http://localhost:8000
VITE_WHATSAPP_TOKEN=seu_token_whatsapp
VITE_WHATSAPP_WEBHOOK_SECRET=seu_webhook_secret

# CORA Bank
VITE_CORA_API_URL=https://api.cora.com.br
VITE_CORA_CLIENT_ID=seu_client_id
VITE_CORA_CLIENT_SECRET=seu_client_secret

# Mercado Pago
VITE_MERCADO_PAGO_ACCESS_TOKEN=seu_access_token
VITE_MERCADO_PAGO_PUBLIC_KEY=sua_public_key
VITE_MERCADO_PAGO_WEBHOOK_SECRET=seu_webhook_secret
```

### Instalação e Execução

```bash
# Instalar dependências
pnpm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais

# Executar em desenvolvimento
pnpm run dev

# Build para produção
pnpm run build
```

## 🛡️ Segurança

### Webhooks
- Verificação de assinatura para todos os webhooks
- Logs detalhados de todas as requisições
- Rate limiting para prevenir abuso

### Pagamentos
- Tokenização de dados de cartão
- Criptografia de dados sensíveis
- Conformidade com PCI DSS

### Dados Pessoais
- Conformidade com LGPD
- Criptografia de dados pessoais
- Logs de acesso e auditoria

## 📊 Monitoramento

### Métricas Importantes
- Taxa de sucesso de pagamentos
- Tempo de resposta da IA
- Volume de mensagens WhatsApp
- Status de integrações

### Logs e Debugging
- Logs estruturados em JSON
- Rastreamento de erros com stack traces
- Métricas de performance
- Alertas automáticos para falhas

## 🚀 Deploy e Produção

### Requisitos
- Node.js 18+
- PostgreSQL (via Supabase)
- Servidor para IA local
- Certificado SSL válido

### Checklist de Deploy
- [ ] Configurar todas as variáveis de ambiente
- [ ] Executar migrações do banco de dados
- [ ] Configurar webhooks nos provedores
- [ ] Testar todas as integrações
- [ ] Configurar monitoramento
- [ ] Backup automático do banco

### Manutenção
- Backup diário do banco de dados
- Monitoramento de logs de erro
- Atualizações de segurança regulares
- Testes de integração semanais

