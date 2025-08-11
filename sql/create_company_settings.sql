-- Criar tabela para armazenar dados da empresa
CREATE TABLE IF NOT EXISTS company_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Dados da empresa
  company_name VARCHAR(255) NOT NULL DEFAULT 'ItSells Restaurante',
  company_email VARCHAR(255) NOT NULL DEFAULT 'contato@itsells.com',
  company_phone VARCHAR(20) NOT NULL DEFAULT '+5511999999999',
  company_document VARCHAR(20) NOT NULL DEFAULT '12345678000100',
  
  -- Endereço da empresa
  address_street VARCHAR(255) NOT NULL DEFAULT 'Rua Principal',
  address_number VARCHAR(10) NOT NULL DEFAULT '123',
  address_district VARCHAR(100) NOT NULL DEFAULT 'Centro',
  address_city VARCHAR(100) NOT NULL DEFAULT 'São Paulo',
  address_state VARCHAR(2) NOT NULL DEFAULT 'SP',
  address_complement VARCHAR(255) DEFAULT '',
  address_zip_code VARCHAR(10) NOT NULL DEFAULT '01000000',
  
  -- Configurações de pagamento
  pix_enabled BOOLEAN DEFAULT true,
  card_enabled BOOLEAN DEFAULT true,
  cash_enabled BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir dados padrão se não existir
INSERT INTO company_settings (
  company_name,
  company_email,
  company_phone,
  company_document,
  address_street,
  address_number,
  address_district,
  address_city,
  address_state,
  address_zip_code
) 
SELECT 
  'ItSells Restaurante',
  'contato@itsells.com',
  '+5511999999999',
  '12345678000100',
  'Rua Principal',
  '123',
  'Centro',
  'São Paulo',
  'SP',
  '01000000'
WHERE NOT EXISTS (SELECT 1 FROM company_settings);

-- Habilitar RLS
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Política para admin
CREATE POLICY "Admins can manage company settings" ON company_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'ADMIN'
    )
  );

-- Política para leitura (todos podem ler para pagamentos)
CREATE POLICY "All can read company settings" ON company_settings
  FOR SELECT USING (true);
