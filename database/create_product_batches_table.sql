-- Criar tabela product_batches para controle de lotes de produtos
CREATE TABLE IF NOT EXISTS public.product_batches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    batch_number VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    unit_cost DECIMAL(10,2),
    supplier VARCHAR(255),
    manufacturing_date DATE,
    expiration_date DATE,
    location VARCHAR(255),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'disposed', 'depleted')),
    disposal_notes TEXT,
    disposal_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_product_batches_product_id ON public.product_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_product_batches_status ON public.product_batches(status);
CREATE INDEX IF NOT EXISTS idx_product_batches_expiration_date ON public.product_batches(expiration_date);
CREATE INDEX IF NOT EXISTS idx_product_batches_batch_number ON public.product_batches(batch_number);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_product_batches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_update_product_batches_updated_at ON public.product_batches;
CREATE TRIGGER trigger_update_product_batches_updated_at
    BEFORE UPDATE ON public.product_batches
    FOR EACH ROW
    EXECUTE FUNCTION update_product_batches_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.product_batches ENABLE ROW LEVEL SECURITY;

-- Política para permitir operações para usuários autenticados
CREATE POLICY "Allow all operations for authenticated users" ON public.product_batches
    FOR ALL USING (auth.role() = 'authenticated');

-- Política para permitir leitura para usuários anônimos (se necessário)
CREATE POLICY "Allow read for anonymous users" ON public.product_batches
    FOR SELECT USING (true);

-- Comentários na tabela e colunas
COMMENT ON TABLE public.product_batches IS 'Tabela para controle de lotes de produtos com datas de validade e estoque';
COMMENT ON COLUMN public.product_batches.id IS 'Identificador único do lote';
COMMENT ON COLUMN public.product_batches.product_id IS 'Referência ao produto';
COMMENT ON COLUMN public.product_batches.batch_number IS 'Número do lote para identificação';
COMMENT ON COLUMN public.product_batches.quantity IS 'Quantidade disponível no lote';
COMMENT ON COLUMN public.product_batches.unit_cost IS 'Custo unitário do produto no lote';
COMMENT ON COLUMN public.product_batches.supplier IS 'Fornecedor do lote';
COMMENT ON COLUMN public.product_batches.manufacturing_date IS 'Data de fabricação';
COMMENT ON COLUMN public.product_batches.expiration_date IS 'Data de vencimento';
COMMENT ON COLUMN public.product_batches.location IS 'Localização física do lote';
COMMENT ON COLUMN public.product_batches.notes IS 'Observações sobre o lote';
COMMENT ON COLUMN public.product_batches.status IS 'Status do lote: active, expired, disposed, depleted';
COMMENT ON COLUMN public.product_batches.disposal_notes IS 'Notas sobre descarte ou vencimento';
COMMENT ON COLUMN public.product_batches.disposal_date IS 'Data de descarte ou marcação como vencido';

-- Inserir alguns dados de exemplo para teste
INSERT INTO public.product_batches (
    product_id,
    batch_number,
    quantity,
    unit_cost,
    supplier,
    manufacturing_date,
    expiration_date,
    location,
    notes,
    status
) 
SELECT 
    p.id,
    'LOTE-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(ROW_NUMBER() OVER (ORDER BY p.name)::TEXT, 3, '0'),
    FLOOR(RANDOM() * 100 + 10)::INTEGER,
    p.price * 0.6,
    CASE 
        WHEN RANDOM() < 0.3 THEN 'Fornecedor A'
        WHEN RANDOM() < 0.6 THEN 'Fornecedor B'
        ELSE 'Fornecedor C'
    END,
    CURRENT_DATE - INTERVAL '30 days' * RANDOM(),
    CURRENT_DATE + INTERVAL '60 days' * RANDOM(),
    CASE 
        WHEN RANDOM() < 0.5 THEN 'Estoque Principal'
        ELSE 'Estoque Secundário'
    END,
    'Lote de exemplo criado automaticamente',
    'active'
FROM public.products p
LIMIT 20
ON CONFLICT DO NOTHING;

SELECT 'Tabela product_batches criada com sucesso!' as status;