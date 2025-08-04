-- Adicionar novos campos à tabela de produtos
ALTER TABLE products ADD COLUMN IF NOT EXISTS prep_time INTEGER DEFAULT 15;
ALTER TABLE products ADD COLUMN IF NOT EXISTS show_in_menu BOOLEAN DEFAULT TRUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_path TEXT;

-- Adicionar campo started_at à tabela order_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;

-- Comentários para os novos campos
COMMENT ON COLUMN products.prep_time IS 'Tempo médio de preparo em minutos';
COMMENT ON COLUMN products.show_in_menu IS 'Indica se o produto deve aparecer no menu principal';
COMMENT ON COLUMN products.image_path IS 'Caminho da imagem do produto no storage';
COMMENT ON COLUMN order_items.started_at IS 'Momento em que o item começou a ser produzido';

-- Sincronizar preparation_time e prep_time para garantir consistência
UPDATE products SET prep_time = preparation_time::INTEGER WHERE preparation_time IS NOT NULL AND prep_time IS NULL;
UPDATE products SET preparation_time = prep_time::TEXT WHERE prep_time IS NOT NULL AND preparation_time IS NULL;

-- Atualizar produtos existentes
UPDATE products SET prep_time = 15 WHERE prep_time IS NULL;
UPDATE products SET show_in_menu = TRUE WHERE show_in_menu IS NULL;
