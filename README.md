# 🍽️ It$ell's - Sistema de Gestão Premium

Sistema moderno e luxuoso para gestão completa de estabelecimentos comerciais como bares, restaurantes e pizzarias, com foco na simplificação dos fluxos de negócio, experiência premium do usuário e automação inteligente.

## ✨ Características Principais

### 🎨 Design Luxuoso
- Interface semi-translúcida com efeitos glassmorphism
- Paleta de cores premium: preto, dourado e neon
- Animações suaves com Anime.js
- Design responsivo para desktop e mobile
- Logo exclusiva "It$ell's" com identidade visual única

### 👥 Quatro Tipos de Usuário

#### 🔑 ADMIN (Proprietário/Gerente)
- Dashboard com métricas em tempo real
- Controle completo de estoque e vencimentos
- Gestão de funcionários e permissões
- Visão do salão em tempo real
- Manutenção completa do menu
- Sistema de reservas e mesas
- Gestão de fornecedores

#### 👨‍💼 STAFF (Funcionários)
- Dashboard operacional otimizado
- Ponto de pedido rápido
- Controle de vencimentos
- Módulo de caixa
- Visão do salão
- Sistema de câmera para vigilância de saída

#### 👤 CLIENTE
- Acesso via QR Code
- Menu digital interativo
- Gestão de conta própria
- Sistema de pagamento self-service (PIX, Débito, Crédito)
- Histórico de consumo
- Liberação automática
- Atendimento via WhatsApp com IA

#### 🏭 FORNECEDOR (NOVO!)
- Portal exclusivo para fornecedores
- Visão dos estoques de seus produtos
- Controle de vencimentos
- Ponto de pedido automático
- Alertas de reposição

## 🤖 Inteligência Artificial Integrada

### WhatsApp IA Local
- Atendimento automatizado 24/7
- Processamento de pedidos via WhatsApp
- Sistema de reservas inteligente
- Aprendizado contínuo das preferências
- Integração com base de dados do cliente
- Notificações automáticas de status

### Funcionalidades da IA
- Reconhecimento de intenções do cliente
- Sugestões personalizadas baseadas no histórico
- Processamento de linguagem natural em português
- Integração com sistema de pedidos
- Confirmação automática de reservas
- Alertas de pagamento e status de pedidos

## 💳 Integrações Bancárias Nativas

### Banco CORA
- Pagamentos PIX instantâneos
- Transferências bancárias
- Consulta de saldo em tempo real
- Histórico de transações
- Webhooks para confirmação automática
- Reconciliação bancária automática

### Mercado Pago
- Checkout transparente
- Pagamentos com cartão (débito/crédito)
- PIX via Mercado Pago
- Parcelamento automático
- Link de pagamento
- Notificações em tempo real
- Gestão de estornos

### Funcionalidades de Pagamento
- Múltiplos métodos de pagamento
- Processamento seguro de transações
- Confirmação automática via webhook
- Atualização de status em tempo real
- Integração com conta do cliente
- Relatórios financeiros detalhados

## 🚀 Tecnologias Utilizadas

### Frontend
- **React 18+** com TypeScript
- **Vite** para build e desenvolvimento
- **Tailwind CSS** para estilização
- **Anime.js** para animações luxuosas
- **React Router** para navegação
- **Zustand/Redux** para gerenciamento de estado

### Backend & Database
- **Supabase** como Backend-as-a-Service
- **PostgreSQL** como banco de dados
- **Row Level Security (RLS)** para segurança
- **Real-time subscriptions** para atualizações em tempo real

### Funcionalidades Especiais
- **Reconhecimento Facial** com Face-API.js
- **QR Code Scanner** para acesso de clientes
- **Validação de CPF** integrada
- **Sistema de Pagamentos** com múltiplos métodos
- **Controle de Estoque** com alertas de vencimento

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou pnpm
- Conta no Supabase
- Navegador moderno com suporte a WebRTC (para reconhecimento facial)

## 🛠️ Instalação

### 1. Clone o Repositório
```bash
git clone https://github.com/seu-usuario/luxury-restaurant-app.git
cd luxury-restaurant-app
```

### 2. Instale as Dependências
```bash
pnpm install
# ou
npm install
```

### 3. Configure o Supabase
Siga o guia detalhado em [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

### 4. Configure as Variáveis de Ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais do Supabase:
```env
VITE_SUPABASE_URL=https://seu-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

### 5. Execute o Projeto
```bash
pnpm run dev
# ou
npm run dev
```

Acesse: `http://localhost:5173`

## 🗃️ Estrutura do Projeto

```
luxury-restaurant-app/
├── src/
│   ├── components/          # Componentes reutilizáveis
│   │   ├── ui/             # Componentes de UI (shadcn/ui)
│   │   └── common/         # Componentes comuns
│   ├── contexts/           # Contextos React (Auth, Store)
│   ├── services/           # Serviços de API (Supabase)
│   ├── pages/              # Páginas da aplicação
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utilitários e configurações
│   └── assets/             # Assets estáticos
├── database/               # Schema SQL do Supabase
├── public/                 # Arquivos públicos
└── docs/                   # Documentação
```

## 🎯 Funcionalidades Detalhadas

### Sistema de Autenticação
- **Reconhecimento Facial**: Login automático via webcam
- **CPF + Senha**: Método tradicional para staff/admin
- **Cadastro de Cliente**: Via QR Code com validação de CPF
- **Sessões Persistentes**: Mantém usuário logado

### Gestão de Pedidos
- **Menu Digital**: Interface intuitiva para clientes
- **Ponto de Pedido**: Interface otimizada para staff
- **Status em Tempo Real**: Atualizações automáticas
- **Observações**: Customizações por item

### Sistema de Pagamentos
- **PIX**: QR Code dinâmico
- **Cartões**: Débito e crédito
- **Processamento Automático**: Confirmação instantânea
- **Histórico Completo**: Todas as transações

### Controle de Estoque
- **Alertas de Vencimento**: Notificações automáticas
- **Controle de Quantidade**: Estoque mínimo
- **Fornecedores**: Gestão completa
- **Relatórios**: Análises detalhadas

### Visão do Salão
- **Mapa Interativo**: Status das mesas em tempo real
- **Reservas**: Sistema completo de agendamento
- **Ocupação**: Controle de capacidade
- **Histórico**: Análise de uso

## 🔐 Segurança

### Autenticação e Autorização
- **JWT Tokens**: Sessões seguras
- **Row Level Security**: Isolamento de dados por usuário
- **Validação de Entrada**: Sanitização de todos os inputs
- **Rate Limiting**: Proteção contra ataques

### Dados Sensíveis
- **Criptografia**: Dados sensíveis criptografados
- **Logs de Auditoria**: Rastreamento de todas as ações
- **Backup Automático**: Proteção contra perda de dados
- **HTTPS**: Comunicação segura

## 📱 Responsividade

O app é totalmente responsivo e otimizado para:
- **Desktop**: Interface completa para admin/staff
- **Tablet**: Ideal para pontos de venda
- **Mobile**: Perfeito para clientes

## 🎨 Customização

### Cores e Tema
As cores podem ser personalizadas no arquivo `src/App.css`:
```css
:root {
  --color-luxury-gold: #FFD700;
  --color-neon-cyan: #00FFFF;
  --color-black-primary: #000000;
}
```

### Animações
Personalize animações no arquivo de configuração do Anime.js.

## 🚀 Deploy

### Desenvolvimento
```bash
pnpm run dev
```

### Build de Produção
```bash
pnpm run build
```

### Preview da Build
```bash
pnpm run preview
```

## 📊 Monitoramento

### Métricas Disponíveis
- **Vendas em Tempo Real**: Dashboard administrativo
- **Performance de Produtos**: Mais vendidos
- **Ocupação de Mesas**: Taxa de utilização
- **Satisfação do Cliente**: Feedback integrado

### Logs e Debugging
- **Console Logs**: Desenvolvimento
- **Supabase Logs**: Produção
- **Error Tracking**: Monitoramento de erros

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

### Documentação
- [Configuração do Supabase](./SUPABASE_SETUP.md)
- [Guia de Desenvolvimento](./docs/DEVELOPMENT.md)
- [API Reference](./docs/API.md)

### Contato
- **Email**: suporte@luxuryrestaurant.app
- **Discord**: [Servidor da Comunidade](#)
- **Issues**: [GitHub Issues](https://github.com/seu-usuario/luxury-restaurant-app/issues)

## 🎉 Agradecimentos

- [Supabase](https://supabase.com) - Backend-as-a-Service
- [Anime.js](https://animejs.com) - Biblioteca de animações
- [Tailwind CSS](https://tailwindcss.com) - Framework CSS
- [React](https://reactjs.org) - Biblioteca JavaScript
- [Vite](https://vitejs.dev) - Build tool

---

**Desenvolvido com ❤️ para revolucionar a experiência gastronômica**

