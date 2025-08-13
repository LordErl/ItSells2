-- =====================================================
-- SISTEMA DE GESTÃO DE RECEITAS E INGREDIENTES
-- =====================================================
-- Este script cria a estrutura completa para o novo sistema de receitas
-- que permite controle preciso de ingredientes, lotes e custos por produto

-- =====================================================
-- 1. TABELA DE INGREDIENTES BASE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ingredients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'outros',
    unit_measure VARCHAR(20) NOT NULL DEFAULT 'kg', -- kg, L, unidade, g, ml
    supplier VARCHAR(255),
    cost_per_unit DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    minimum_stock DECIMAL(10,3) NOT NULL DEFAULT 0.000,
    description TEXT,
    image_path VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT ingredients_name_unique UNIQUE (name),
    CONSTRAINT ingredients_cost_positive CHECK (cost_per_unit >= 0),
    CONSTRAINT ingredients_minimum_stock_positive CHECK (minimum_stock >= 0),
    CONSTRAINT ingredients_unit_measure_valid CHECK (unit_measure IN ('kg', 'g', 'L', 'ml', 'unidade', 'fatia', 'colher', 'xícara'))
);

-- Comentários da tabela ingredients
COMMENT ON TABLE public.ingredients IS 'Ingredientes base utilizados nas receitas dos produtos';
COMMENT ON COLUMN public.ingredients.name IS 'Nome do ingrediente (ex: Carne Bovina, Queijo Mussarela)';
COMMENT ON COLUMN public.ingredients.category IS 'Categoria do ingrediente (carnes, laticínios, vegetais, temperos, etc.)';
COMMENT ON COLUMN public.ingredients.unit_measure IS 'Unidade de medida padrão do ingrediente';
COMMENT ON COLUMN public.ingredients.supplier IS 'Fornecedor principal do ingrediente';
COMMENT ON COLUMN public.ingredients.cost_per_unit IS 'Custo por unidade de medida';
COMMENT ON COLUMN public.ingredients.minimum_stock IS 'Estoque mínimo para alertas';

-- =====================================================
-- 2. TABELA DE LOTES DE INGREDIENTES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ingredient_batches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
    batch_number VARCHAR(100) NOT NULL,
    quantity DECIMAL(10,3) NOT NULL DEFAULT 0.000,
    original_quantity DECIMAL(10,3) NOT NULL DEFAULT 0.000,
    unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    supplier VARCHAR(255),
    manufacturing_date DATE,
    expiration_date DATE,
    received_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    location VARCHAR(100) DEFAULT 'estoque_principal',
    notes TEXT,
    disposal_date DATE,
    disposal_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT ingredient_batches_quantity_positive CHECK (quantity >= 0),
    CONSTRAINT ingredient_batches_original_quantity_positive CHECK (original_quantity > 0),
    CONSTRAINT ingredient_batches_unit_cost_positive CHECK (unit_cost >= 0),
    CONSTRAINT ingredient_batches_status_valid CHECK (status IN ('active', 'expired', 'disposed', 'depleted')),
    CONSTRAINT ingredient_batches_quantity_not_exceed_original CHECK (quantity <= original_quantity),
    CONSTRAINT ingredient_batches_batch_ingredient_unique UNIQUE (batch_number, ingredient_id)
);

-- Comentários da tabela ingredient_batches
COMMENT ON TABLE public.ingredient_batches IS 'Lotes de ingredientes com controle de vencimento e quantidade';
COMMENT ON COLUMN public.ingredient_batches.batch_number IS 'Número do lote fornecido pelo fornecedor';
COMMENT ON COLUMN public.ingredient_batches.quantity IS 'Quantidade atual disponível no lote';
COMMENT ON COLUMN public.ingredient_batches.original_quantity IS 'Quantidade original recebida no lote';
COMMENT ON COLUMN public.ingredient_batches.status IS 'Status do lote: active, expired, disposed, depleted';

-- =====================================================
-- 3. TABELA DE RECEITAS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    total_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    prep_instructions TEXT,
    prep_time_minutes INTEGER DEFAULT 0,
    difficulty_level VARCHAR(20) DEFAULT 'medium',
    servings INTEGER DEFAULT 1,
    created_by UUID REFERENCES public.users(id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT recipes_total_cost_positive CHECK (total_cost >= 0),
    CONSTRAINT recipes_version_positive CHECK (version > 0),
    CONSTRAINT recipes_prep_time_positive CHECK (prep_time_minutes >= 0),
    CONSTRAINT recipes_servings_positive CHECK (servings > 0),
    CONSTRAINT recipes_difficulty_valid CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
    CONSTRAINT recipes_product_version_unique UNIQUE (product_id, version)
);

-- Comentários da tabela recipes
COMMENT ON TABLE public.recipes IS 'Receitas dos produtos do menu com versionamento';
COMMENT ON COLUMN public.recipes.product_id IS 'Produto do menu ao qual esta receita pertence';
COMMENT ON COLUMN public.recipes.version IS 'Versão da receita (permite histórico de mudanças)';
COMMENT ON COLUMN public.recipes.total_cost IS 'Custo total calculado da receita';
COMMENT ON COLUMN public.recipes.difficulty_level IS 'Nível de dificuldade: easy, medium, hard';

-- =====================================================
-- 4. TABELA DE INGREDIENTES DA RECEITA
-- =====================================================

CREATE TABLE IF NOT EXISTS public.recipe_ingredients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
    quantity_needed DECIMAL(10,3) NOT NULL,
    unit_measure VARCHAR(20) NOT NULL,
    cost_per_serving DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_optional BOOLEAN NOT NULL DEFAULT false,
    preparation_notes TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT recipe_ingredients_quantity_positive CHECK (quantity_needed > 0),
    CONSTRAINT recipe_ingredients_cost_positive CHECK (cost_per_serving >= 0),
    CONSTRAINT recipe_ingredients_order_positive CHECK (order_index >= 0),
    CONSTRAINT recipe_ingredients_recipe_ingredient_unique UNIQUE (recipe_id, ingredient_id)
);

-- Comentários da tabela recipe_ingredients
COMMENT ON TABLE public.recipe_ingredients IS 'Ingredientes necessários para cada receita com quantidades específicas';
COMMENT ON COLUMN public.recipe_ingredients.quantity_needed IS 'Quantidade necessária do ingrediente para a receita';
COMMENT ON COLUMN public.recipe_ingredients.cost_per_serving IS 'Custo deste ingrediente por porção da receita';
COMMENT ON COLUMN public.recipe_ingredients.is_optional IS 'Se o ingrediente é opcional na receita';
COMMENT ON COLUMN public.recipe_ingredients.order_index IS 'Ordem de preparo do ingrediente';

-- =====================================================
-- 5. TABELA DE MOVIMENTAÇÕES DE ESTOQUE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ingredient_stock_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ingredient_batch_id UUID NOT NULL REFERENCES public.ingredient_batches(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    reference_type VARCHAR(50), -- 'order', 'adjustment', 'waste', 'transfer'
    reference_id UUID, -- ID do pedido, ajuste, etc.
    notes TEXT,
    performed_by UUID REFERENCES public.users(id),
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT ingredient_movements_type_valid CHECK (movement_type IN ('in', 'out', 'adjustment', 'waste', 'transfer')),
    CONSTRAINT ingredient_movements_reference_type_valid CHECK (reference_type IN ('order', 'adjustment', 'waste', 'transfer', 'recipe_test', 'disposal'))
);

-- Comentários da tabela ingredient_stock_movements
COMMENT ON TABLE public.ingredient_stock_movements IS 'Histórico de movimentações de estoque de ingredientes';
COMMENT ON COLUMN public.ingredient_stock_movements.movement_type IS 'Tipo de movimentação: in, out, adjustment, waste, transfer';
COMMENT ON COLUMN public.ingredient_stock_movements.reference_type IS 'Tipo de referência que originou a movimentação';
COMMENT ON COLUMN public.ingredient_stock_movements.reference_id IS 'ID da referência (pedido, ajuste, etc.)';

-- =====================================================
-- 6. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para ingredients
CREATE INDEX IF NOT EXISTS idx_ingredients_category ON public.ingredients(category);
CREATE INDEX IF NOT EXISTS idx_ingredients_active ON public.ingredients(is_active);
CREATE INDEX IF NOT EXISTS idx_ingredients_name_search ON public.ingredients USING gin(to_tsvector('portuguese', name));

-- Índices para ingredient_batches
CREATE INDEX IF NOT EXISTS idx_ingredient_batches_ingredient_id ON public.ingredient_batches(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_batches_status ON public.ingredient_batches(status);
CREATE INDEX IF NOT EXISTS idx_ingredient_batches_expiration ON public.ingredient_batches(expiration_date);
CREATE INDEX IF NOT EXISTS idx_ingredient_batches_quantity ON public.ingredient_batches(quantity) WHERE quantity > 0;

-- Índices para recipes
CREATE INDEX IF NOT EXISTS idx_recipes_product_id ON public.recipes(product_id);
CREATE INDEX IF NOT EXISTS idx_recipes_active ON public.recipes(is_active);
CREATE INDEX IF NOT EXISTS idx_recipes_created_by ON public.recipes(created_by);

-- Índices para recipe_ingredients
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON public.recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient_id ON public.recipe_ingredients(ingredient_id);

-- Índices para ingredient_stock_movements
CREATE INDEX IF NOT EXISTS idx_ingredient_movements_batch_id ON public.ingredient_stock_movements(ingredient_batch_id);
CREATE INDEX IF NOT EXISTS idx_ingredient_movements_type ON public.ingredient_stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_ingredient_movements_date ON public.ingredient_stock_movements(performed_at);
CREATE INDEX IF NOT EXISTS idx_ingredient_movements_reference ON public.ingredient_stock_movements(reference_type, reference_id);

-- =====================================================
-- 7. TRIGGERS PARA AUTO-ATUALIZAÇÃO
-- =====================================================

-- Trigger para updated_at em ingredients
CREATE OR REPLACE FUNCTION update_ingredients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ingredients_updated_at
    BEFORE UPDATE ON public.ingredients
    FOR EACH ROW
    EXECUTE FUNCTION update_ingredients_updated_at();

-- Trigger para updated_at em ingredient_batches
CREATE OR REPLACE FUNCTION update_ingredient_batches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ingredient_batches_updated_at
    BEFORE UPDATE ON public.ingredient_batches
    FOR EACH ROW
    EXECUTE FUNCTION update_ingredient_batches_updated_at();

-- Trigger para updated_at em recipes
CREATE OR REPLACE FUNCTION update_recipes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_recipes_updated_at
    BEFORE UPDATE ON public.recipes
    FOR EACH ROW
    EXECUTE FUNCTION update_recipes_updated_at();

-- =====================================================
-- 8. FUNÇÃO PARA CALCULAR CUSTO TOTAL DA RECEITA
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_recipe_total_cost(recipe_uuid UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    total_cost DECIMAL(10,2) := 0.00;
BEGIN
    SELECT COALESCE(SUM(ri.cost_per_serving), 0.00)
    INTO total_cost
    FROM public.recipe_ingredients ri
    WHERE ri.recipe_id = recipe_uuid;
    
    -- Atualizar o custo total na receita
    UPDATE public.recipes 
    SET total_cost = total_cost,
        updated_at = NOW()
    WHERE id = recipe_uuid;
    
    RETURN total_cost;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 9. FUNÇÃO PARA VERIFICAR DISPONIBILIDADE DE INGREDIENTES
-- =====================================================

CREATE OR REPLACE FUNCTION check_recipe_availability(recipe_uuid UUID, servings_needed INTEGER DEFAULT 1)
RETURNS TABLE(
    ingredient_name VARCHAR(255),
    needed_quantity DECIMAL(10,3),
    available_quantity DECIMAL(10,3),
    unit_measure VARCHAR(20),
    is_available BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.name,
        (ri.quantity_needed * servings_needed) as needed_quantity,
        COALESCE(SUM(ib.quantity), 0.00) as available_quantity,
        ri.unit_measure,
        (COALESCE(SUM(ib.quantity), 0.00) >= (ri.quantity_needed * servings_needed)) as is_available
    FROM public.recipe_ingredients ri
    JOIN public.ingredients i ON ri.ingredient_id = i.id
    LEFT JOIN public.ingredient_batches ib ON i.id = ib.ingredient_id 
        AND ib.status = 'active' 
        AND ib.quantity > 0
        AND (ib.expiration_date IS NULL OR ib.expiration_date > CURRENT_DATE)
    WHERE ri.recipe_id = recipe_uuid
    GROUP BY i.name, ri.quantity_needed, ri.unit_measure
    ORDER BY is_available ASC, i.name;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. RLS (ROW LEVEL SECURITY) POLICIES
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredient_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredient_stock_movements ENABLE ROW LEVEL SECURITY;

-- Políticas para ingredients (todos os usuários autenticados podem ler, apenas admin pode modificar)
CREATE POLICY "ingredients_read_policy" ON public.ingredients
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "ingredients_admin_policy" ON public.ingredients
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin')
        )
    );

-- Políticas para ingredient_batches (staff pode ler e modificar, admin pode tudo)
CREATE POLICY "ingredient_batches_read_policy" ON public.ingredient_batches
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "ingredient_batches_staff_policy" ON public.ingredient_batches
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'staff')
        )
    );

-- Políticas para recipes (todos podem ler, apenas admin pode modificar)
CREATE POLICY "recipes_read_policy" ON public.recipes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "recipes_admin_policy" ON public.recipes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin')
        )
    );

-- Políticas para recipe_ingredients (todos podem ler, apenas admin pode modificar)
CREATE POLICY "recipe_ingredients_read_policy" ON public.recipe_ingredients
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "recipe_ingredients_admin_policy" ON public.recipe_ingredients
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin')
        )
    );

-- Políticas para ingredient_stock_movements (staff pode ler e inserir, admin pode tudo)
CREATE POLICY "ingredient_movements_read_policy" ON public.ingredient_stock_movements
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "ingredient_movements_staff_policy" ON public.ingredient_stock_movements
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'staff')
        )
    );

CREATE POLICY "ingredient_movements_admin_policy" ON public.ingredient_stock_movements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin')
        )
    );

-- =====================================================
-- 11. DADOS DE EXEMPLO PARA TESTE
-- =====================================================

-- Inserir categorias de ingredientes
INSERT INTO public.ingredients (name, category, unit_measure, cost_per_unit, minimum_stock, description) VALUES
-- Carnes
('Carne Bovina (Hambúrguer)', 'carnes', 'kg', 35.00, 5.000, 'Carne moída bovina para hambúrgueres'),
('Frango (Peito)', 'carnes', 'kg', 18.00, 3.000, 'Peito de frango sem osso'),
('Bacon', 'carnes', 'kg', 28.00, 2.000, 'Bacon fatiado'),

-- Laticínios
('Queijo Mussarela', 'laticínios', 'kg', 25.00, 2.000, 'Queijo mussarela fatiado'),
('Queijo Cheddar', 'laticínios', 'kg', 30.00, 1.500, 'Queijo cheddar fatiado'),
('Manteiga', 'laticínios', 'kg', 12.00, 1.000, 'Manteiga sem sal'),

-- Vegetais
('Alface Americana', 'vegetais', 'kg', 4.50, 2.000, 'Alface americana fresca'),
('Tomate', 'vegetais', 'kg', 6.00, 3.000, 'Tomate maduro'),
('Cebola', 'vegetais', 'kg', 3.00, 5.000, 'Cebola branca'),
('Batata', 'vegetais', 'kg', 4.00, 10.000, 'Batata para fritas'),

-- Pães e Massas
('Pão de Hambúrguer', 'pães', 'unidade', 1.50, 50.000, 'Pão brioche para hambúrguer'),
('Pão de Hot Dog', 'pães', 'unidade', 1.20, 30.000, 'Pão para hot dog'),

-- Condimentos
('Maionese', 'condimentos', 'kg', 8.00, 2.000, 'Maionese tradicional'),
('Ketchup', 'condimentos', 'kg', 6.50, 2.000, 'Ketchup tradicional'),
('Mostarda', 'condimentos', 'kg', 7.00, 1.000, 'Mostarda amarela'),

-- Bebidas
('Refrigerante Cola', 'bebidas', 'L', 4.50, 20.000, 'Refrigerante de cola'),
('Água Mineral', 'bebidas', 'L', 2.00, 30.000, 'Água mineral sem gás')

ON CONFLICT (name) DO NOTHING;

-- Inserir alguns lotes de exemplo
WITH batch_data AS (
    SELECT 
        i.id as ingredient_id,
        'LOTE-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(EXTRACT(DOY FROM CURRENT_DATE)::text, 3, '0') || '-' || LPAD((ROW_NUMBER() OVER())::text, 3, '0') as batch_number,
        CASE 
            WHEN i.unit_measure = 'kg' THEN ROUND((10.000 + (RANDOM() * 20))::numeric, 3)
            WHEN i.unit_measure = 'L' THEN ROUND((15.000 + (RANDOM() * 25))::numeric, 3)
            WHEN i.unit_measure = 'unidade' THEN ROUND((100.000 + (RANDOM() * 200))::numeric, 3)
        END as generated_quantity,
        i.cost_per_unit * (0.9 + RANDOM() * 0.2) as unit_cost,
        'Fornecedor ' || (1 + FLOOR(RANDOM() * 5))::text as supplier
    FROM public.ingredients i
    WHERE i.is_active = true
)
INSERT INTO public.ingredient_batches (
    ingredient_id, 
    batch_number, 
    quantity, 
    original_quantity, 
    unit_cost, 
    supplier, 
    manufacturing_date, 
    expiration_date, 
    received_date
) 
SELECT 
    bd.ingredient_id,
    bd.batch_number,
    bd.generated_quantity, -- quantity atual
    bd.generated_quantity, -- original_quantity (mesmo valor)
    bd.unit_cost,
    bd.supplier,
    CURRENT_DATE - INTERVAL '7 days',
    CURRENT_DATE + INTERVAL '30 days' + (RANDOM() * INTERVAL '60 days'),
    CURRENT_DATE - INTERVAL '7 days'
FROM batch_data bd;

-- =====================================================
-- 12. VIEWS ÚTEIS PARA RELATÓRIOS
-- =====================================================

-- View para estoque atual de ingredientes
CREATE OR REPLACE VIEW ingredient_stock_summary AS
SELECT 
    i.id,
    i.name,
    i.category,
    i.unit_measure,
    i.minimum_stock,
    COALESCE(SUM(ib.quantity), 0) as current_stock,
    COUNT(ib.id) as active_batches,
    MIN(ib.expiration_date) as next_expiration,
    CASE 
        WHEN COALESCE(SUM(ib.quantity), 0) <= i.minimum_stock THEN 'low'
        WHEN MIN(ib.expiration_date) <= CURRENT_DATE + INTERVAL '7 days' THEN 'expiring'
        ELSE 'ok'
    END as status
FROM public.ingredients i
LEFT JOIN public.ingredient_batches ib ON i.id = ib.ingredient_id 
    AND ib.status = 'active' 
    AND ib.quantity > 0
WHERE i.is_active = true
GROUP BY i.id, i.name, i.category, i.unit_measure, i.minimum_stock
ORDER BY i.category, i.name;

-- View para receitas com custos calculados
CREATE OR REPLACE VIEW recipe_cost_analysis AS
SELECT 
    r.id,
    r.name,
    p.name as product_name,
    p.price as selling_price,
    r.total_cost,
    (p.price - r.total_cost) as profit_margin,
    CASE 
        WHEN p.price > 0 THEN ROUND(((p.price - r.total_cost) / p.price * 100)::numeric, 2)
        ELSE 0
    END as profit_percentage,
    COUNT(ri.id) as ingredient_count,
    r.is_active,
    r.updated_at
FROM public.recipes r
JOIN public.products p ON r.product_id = p.id
LEFT JOIN public.recipe_ingredients ri ON r.id = ri.recipe_id
GROUP BY r.id, r.name, p.name, p.price, r.total_cost, r.is_active, r.updated_at
ORDER BY profit_percentage DESC;

-- =====================================================
-- SCRIPT CONCLUÍDO COM SUCESSO! 
-- =====================================================

-- Para executar este script:
-- 1. Acesse o Supabase Dashboard
-- 2. Vá em SQL Editor
-- 3. Cole este script completo
-- 4. Execute (Run)
-- 5. Verifique se todas as tabelas foram criadas em "Table Editor"

SELECT 'Sistema de Receitas e Ingredientes criado com sucesso!' as status;
