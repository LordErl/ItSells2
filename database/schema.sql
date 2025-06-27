-- =============================================
-- LUXURY RESTAURANT APP - DATABASE SCHEMA
-- =============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cpf VARCHAR(11) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    password VARCHAR(255), -- For staff/admin, customers use face recognition
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'staff', 'customer')),
    photo TEXT, -- Base64 or URL
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- FACE DATA TABLE (for facial recognition)
-- =============================================
CREATE TABLE face_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    face_encoding TEXT NOT NULL, -- Encoded face data
    photo_url TEXT,
    confidence DECIMAL(5,4) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- CATEGORIES TABLE
-- =============================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image TEXT,
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PRODUCTS TABLE
-- =============================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category_id UUID REFERENCES categories(id),
    image TEXT,
    preparation_time INTEGER DEFAULT 0, -- in minutes
    available BOOLEAN DEFAULT true,
    active BOOLEAN DEFAULT true,
    ingredients TEXT[], -- Array of ingredients
    allergens TEXT[], -- Array of allergens
    nutritional_info JSONB, -- Nutritional information
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABLES TABLE (restaurant tables)
-- =============================================
CREATE TABLE tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number INTEGER UNIQUE NOT NULL,
    capacity INTEGER NOT NULL,
    location VARCHAR(50) DEFAULT 'indoor', -- indoor, outdoor, private
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'cleaning', 'out_of_order')),
    current_order_id UUID,
    qr_code TEXT, -- QR code for table access
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ORDERS TABLE
-- =============================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES users(id),
    table_id UUID REFERENCES tables(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    observations TEXT,
    estimated_time INTEGER, -- in minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ORDER ITEMS TABLE
-- =============================================
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL, -- Price at time of order
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PAYMENTS TABLE
-- =============================================
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id),
    customer_id UUID NOT NULL REFERENCES users(id),
    method VARCHAR(20) NOT NULL CHECK (method IN ('pix', 'debit', 'credit', 'cash')),
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'approved', 'rejected', 'cancelled')),
    transaction_id VARCHAR(255),
    gateway_response JSONB, -- Payment gateway response
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- CUSTOMER ACCOUNTS TABLE
-- =============================================
CREATE TABLE customer_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_bill DECIMAL(10,2) DEFAULT 0,
    total_spent DECIMAL(10,2) DEFAULT 0,
    visit_count INTEGER DEFAULT 0,
    loyalty_points INTEGER DEFAULT 0,
    last_visit TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- RESERVATIONS TABLE
-- =============================================
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES users(id),
    table_id UUID NOT NULL REFERENCES tables(id),
    reservation_date TIMESTAMP WITH TIME ZONE NOT NULL,
    party_size INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'seated', 'completed', 'cancelled', 'no_show')),
    special_requests TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- STAFF TABLE
-- =============================================
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    position VARCHAR(100),
    shift VARCHAR(20) CHECK (shift IN ('morning', 'afternoon', 'evening', 'night')),
    hourly_rate DECIMAL(8,2),
    permissions TEXT[], -- Array of permissions
    active BOOLEAN DEFAULT true,
    hired_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INVENTORY TABLE
-- =============================================
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity DECIMAL(10,3) NOT NULL DEFAULT 0,
    unit VARCHAR(20) NOT NULL, -- kg, liters, units, etc.
    min_quantity DECIMAL(10,3) DEFAULT 0, -- Minimum stock alert
    cost_per_unit DECIMAL(10,2),
    supplier VARCHAR(255),
    expiry_date DATE,
    status VARCHAR(20) DEFAULT 'ok' CHECK (status IN ('ok', 'low_stock', 'out_of_stock', 'expiring_soon', 'expired')),
    location VARCHAR(100), -- Storage location
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- AUDIT LOG TABLE
-- =============================================
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================

-- Users indexes
CREATE INDEX idx_users_cpf ON users(cpf);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(active);

-- Face data indexes
CREATE INDEX idx_face_data_user_id ON face_data(user_id);

-- Products indexes
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_available ON products(available);
CREATE INDEX idx_products_active ON products(active);

-- Orders indexes
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_table_id ON orders(table_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Order items indexes
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Payments indexes
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_customer_id ON payments(customer_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_created_at ON payments(created_at);

-- Tables indexes
CREATE INDEX idx_tables_status ON tables(status);
CREATE INDEX idx_tables_current_order_id ON tables(current_order_id);

-- Reservations indexes
CREATE INDEX idx_reservations_customer_id ON reservations(customer_id);
CREATE INDEX idx_reservations_table_id ON reservations(table_id);
CREATE INDEX idx_reservations_date ON reservations(reservation_date);
CREATE INDEX idx_reservations_status ON reservations(status);

-- Inventory indexes
CREATE INDEX idx_inventory_status ON inventory(status);
CREATE INDEX idx_inventory_expiry_date ON inventory(expiry_date);

-- =============================================
-- TRIGGERS
-- =============================================

-- Update updated_at timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_face_data_updated_at BEFORE UPDATE ON face_data FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tables_updated_at BEFORE UPDATE ON tables FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_accounts_updated_at BEFORE UPDATE ON customer_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- FOREIGN KEY CONSTRAINTS
-- =============================================

-- Add foreign key for tables.current_order_id
ALTER TABLE tables ADD CONSTRAINT fk_tables_current_order 
    FOREIGN KEY (current_order_id) REFERENCES orders(id) ON DELETE SET NULL;

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE face_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id::text = auth.uid()::text AND role = 'admin'
    )
);

-- RLS Policies for orders table
CREATE POLICY "Customers can view own orders" ON orders FOR SELECT USING (customer_id::text = auth.uid()::text);
CREATE POLICY "Staff can view all orders" ON orders FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id::text = auth.uid()::text AND role IN ('admin', 'staff')
    )
);

-- =============================================
-- SAMPLE DATA
-- =============================================

-- Insert sample categories
INSERT INTO categories (name, description, sort_order) VALUES
('Lanches', 'Hambúrguers e sanduíches artesanais', 1),
('Pizzas', 'Pizzas tradicionais e especiais', 2),
('Bebidas', 'Cervejas, refrigerantes e sucos', 3),
('Sobremesas', 'Doces e sobremesas da casa', 4),
('Entradas', 'Petiscos e aperitivos', 5);

-- Insert sample admin user
INSERT INTO users (cpf, name, email, password, role) VALUES
('12345678901', 'João Silva', 'admin@restaurant.com', 'admin123', 'admin');

-- Insert sample staff user
INSERT INTO users (cpf, name, email, password, role) VALUES
('98765432100', 'Maria Santos', 'maria@restaurant.com', 'staff123', 'staff');

-- Insert sample tables
INSERT INTO tables (number, capacity, location, qr_code) 
SELECT 
    generate_series(1, 20) as number,
    (RANDOM() * 6 + 2)::INTEGER as capacity,
    CASE WHEN RANDOM() > 0.5 THEN 'indoor' ELSE 'outdoor' END as location,
    'QR_TABLE_' || generate_series(1, 20) as qr_code;

-- Insert sample products
INSERT INTO products (name, description, price, category_id, preparation_time, available) 
SELECT 
    product_data.name,
    product_data.description,
    product_data.price,
    c.id,
    product_data.prep_time,
    true
FROM (
    VALUES 
    ('Hambúrguer Artesanal', 'Hambúrguer premium com carne angus, queijo cheddar e molho especial', 35.90, 'Lanches', 15),
    ('X-Bacon Gourmet', 'Hambúrguer com bacon crocante, queijo e cebola caramelizada', 42.50, 'Lanches', 18),
    ('Pizza Margherita', 'Pizza tradicional com molho de tomate, mussarela e manjericão', 42.00, 'Pizzas', 20),
    ('Pizza Portuguesa', 'Pizza com presunto, ovos, cebola, azeitona e queijo', 48.00, 'Pizzas', 22),
    ('Cerveja Artesanal IPA', 'Cerveja artesanal com lúpulo especial', 18.50, 'Bebidas', 2),
    ('Refrigerante Lata', 'Coca-Cola, Pepsi ou Guaraná', 8.00, 'Bebidas', 1),
    ('Tiramisu', 'Sobremesa italiana com café e mascarpone', 22.00, 'Sobremesas', 5),
    ('Bruschetta', 'Pão italiano com tomate, manjericão e azeite', 16.50, 'Entradas', 8)
) AS product_data(name, description, price, category_name, prep_time)
JOIN categories c ON c.name = product_data.category_name;

-- Insert sample inventory items
INSERT INTO inventory (name, quantity, unit, min_quantity, supplier, expiry_date, status) VALUES
('Carne Bovina', 50.0, 'kg', 10.0, 'Frigorífico Premium', '2024-02-15', 'ok'),
('Queijo Mussarela', 20.0, 'kg', 5.0, 'Laticínios Bom Gosto', '2024-02-10', 'ok'),
('Farinha de Trigo', 100.0, 'kg', 20.0, 'Moinho Dourado', '2024-06-01', 'ok'),
('Cerveja IPA', 48.0, 'unidades', 12.0, 'Cervejaria Artesanal', '2024-12-31', 'ok'),
('Tomate', 15.0, 'kg', 3.0, 'Hortifruti Central', '2024-01-25', 'expiring_soon');

COMMENT ON TABLE users IS 'Tabela de usuários do sistema (admin, staff, customer)';
COMMENT ON TABLE face_data IS 'Dados de reconhecimento facial dos usuários';
COMMENT ON TABLE categories IS 'Categorias de produtos do menu';
COMMENT ON TABLE products IS 'Produtos disponíveis no menu';
COMMENT ON TABLE tables IS 'Mesas do restaurante';
COMMENT ON TABLE orders IS 'Pedidos realizados pelos clientes';
COMMENT ON TABLE order_items IS 'Itens individuais de cada pedido';
COMMENT ON TABLE payments IS 'Pagamentos processados';
COMMENT ON TABLE customer_accounts IS 'Contas dos clientes com histórico';
COMMENT ON TABLE reservations IS 'Reservas de mesas';
COMMENT ON TABLE staff IS 'Informações adicionais dos funcionários';
COMMENT ON TABLE inventory IS 'Controle de estoque';
COMMENT ON TABLE audit_log IS 'Log de auditoria do sistema';


-- =============================
-- SUPPLIER MANAGEMENT TABLES
-- =============================

-- Suppliers table
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    document VARCHAR(20) UNIQUE, -- CNPJ
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    bank_info JSONB, -- Bank account information
    payment_terms VARCHAR(100), -- Payment terms (30 days, etc.)
    status supplier_status DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supplier status enum
CREATE TYPE supplier_status AS ENUM ('active', 'inactive', 'suspended');

-- Supplier users (for supplier portal access)
CREATE TABLE supplier_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'supplier',
    permissions JSONB DEFAULT '[]',
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update inventory table to include supplier reference
ALTER TABLE inventory ADD COLUMN supplier_id UUID REFERENCES suppliers(id);
ALTER TABLE inventory ADD COLUMN min_quantity INTEGER DEFAULT 0;
ALTER TABLE inventory ADD COLUMN max_quantity INTEGER;
ALTER TABLE inventory ADD COLUMN reorder_point INTEGER DEFAULT 0;
ALTER TABLE inventory ADD COLUMN unit_price DECIMAL(10,2) DEFAULT 0;

-- Update products table to include supplier reference
ALTER TABLE products ADD COLUMN supplier_id UUID REFERENCES suppliers(id);

-- Purchase orders
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status purchase_order_status DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    expected_delivery DATE,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE purchase_order_status AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');

-- Purchase order items
CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    inventory_item_id UUID NOT NULL REFERENCES inventory(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================
-- WHATSAPP INTEGRATION TABLES
-- =============================

-- WhatsApp messages
CREATE TABLE whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) NOT NULL,
    message_body TEXT NOT NULL,
    message_id VARCHAR(255), -- WhatsApp message ID
    direction message_direction NOT NULL,
    status message_status DEFAULT 'received',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ai_processed BOOLEAN DEFAULT FALSE,
    ai_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE message_direction AS ENUM ('incoming', 'outgoing');
CREATE TYPE message_status AS ENUM ('received', 'sent', 'delivered', 'read', 'failed');

-- WhatsApp conversations
CREATE TABLE whatsapp_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    customer_id UUID REFERENCES users(id),
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status conversation_status DEFAULT 'active',
    ai_context JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE conversation_status AS ENUM ('active', 'archived', 'blocked');

-- AI learning data
CREATE TABLE ai_learning_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES whatsapp_conversations(id),
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    user_feedback INTEGER CHECK (user_feedback >= 1 AND user_feedback <= 5),
    context JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================
-- PAYMENT INTEGRATION TABLES
-- =============================

-- Enhanced payments table (updating existing)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'manual';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider_data JSONB DEFAULT '{}';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS qr_code TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS qr_code_base64 TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS pix_key VARCHAR(255);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS checkout_url TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS sandbox_url TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS installments INTEGER DEFAULT 1;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS status_detail VARCHAR(100);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS expiration_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS expired_at TIMESTAMP WITH TIME ZONE;

-- Webhook logs
CREATE TABLE webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    data JSONB NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processing_status webhook_status DEFAULT 'success',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE webhook_status AS ENUM ('success', 'failed', 'pending');

-- Bank transactions (for reconciliation)
CREATE TABLE bank_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(255) NOT NULL,
    type transaction_type NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL,
    payment_id UUID REFERENCES payments(id),
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE transaction_type AS ENUM ('credit', 'debit', 'transfer', 'fee', 'refund');

-- =============================
-- ADDITIONAL FEATURES TABLES
-- =============================

-- Customer preferences (for AI personalization)
CREATE TABLE customer_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dietary_restrictions TEXT[],
    favorite_items UUID[],
    preferred_table_location VARCHAR(50),
    communication_preferences JSONB DEFAULT '{}',
    ai_interaction_history JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification templates
CREATE TABLE notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    type notification_type NOT NULL,
    subject VARCHAR(255),
    body TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE notification_type AS ENUM ('email', 'whatsapp', 'sms', 'push');

-- Notification queue
CREATE TABLE notification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient VARCHAR(255) NOT NULL,
    type notification_type NOT NULL,
    subject VARCHAR(255),
    body TEXT NOT NULL,
    status queue_status DEFAULT 'pending',
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE queue_status AS ENUM ('pending', 'sent', 'failed', 'cancelled');

-- =============================
-- SAMPLE DATA FOR SUPPLIERS
-- =============================

-- Insert sample suppliers
INSERT INTO suppliers (company_name, contact_name, email, phone, document, address, city, state, zip_code, payment_terms) VALUES
('Distribuidora Premium Ltda', 'João Silva', 'joao@distribuidorapremium.com', '11987654321', '12345678000195', 'Rua das Flores, 123', 'São Paulo', 'SP', '01234-567', '30 dias'),
('Fornecedor Gourmet S.A.', 'Maria Santos', 'maria@fornecedorgourmet.com', '11876543210', '98765432000187', 'Av. Central, 456', 'São Paulo', 'SP', '04567-890', '15 dias'),
('Bebidas & Cia', 'Carlos Oliveira', 'carlos@bebidasecia.com', '11765432109', '11223344000156', 'Rua do Comércio, 789', 'São Paulo', 'SP', '02345-678', '45 dias');

-- Insert sample supplier users
INSERT INTO supplier_users (supplier_id, name, email, password_hash, role) VALUES
((SELECT id FROM suppliers WHERE email = 'joao@distribuidorapremium.com'), 'João Silva', 'joao@distribuidorapremium.com', '$2b$10$example_hash_1', 'supplier'),
((SELECT id FROM suppliers WHERE email = 'maria@fornecedorgourmet.com'), 'Maria Santos', 'maria@fornecedorgourmet.com', '$2b$10$example_hash_2', 'supplier'),
((SELECT id FROM suppliers WHERE email = 'carlos@bebidasecia.com'), 'Carlos Oliveira', 'carlos@bebidasecia.com', '$2b$10$example_hash_3', 'supplier');

-- Insert sample notification templates
INSERT INTO notification_templates (name, type, subject, body, variables) VALUES
('payment_approved', 'whatsapp', NULL, '✅ Pagamento aprovado! Seu pedido #{order_id} foi confirmado. Total: R$ {amount}. Obrigado!', '["order_id", "amount"]'),
('reservation_confirmed', 'whatsapp', NULL, '📅 Reserva confirmada para {date} às {time} para {party_size} pessoas. Código: {reservation_id}', '["date", "time", "party_size", "reservation_id"]'),
('order_ready', 'whatsapp', NULL, '🍽️ Seu pedido #{order_id} está pronto! Pode vir buscar ou aguardar na mesa.', '["order_id"]'),
('low_stock_alert', 'email', 'Alerta de Estoque Baixo', 'O item {item_name} está com estoque baixo. Quantidade atual: {current_quantity}. Ponto de pedido: {reorder_point}.', '["item_name", "current_quantity", "reorder_point"]');

