-- ItSells - Complete Database Schema
-- Modelagem completa do banco de dados

-- =============================================================================
-- TABELAS EXISTENTES (já implementadas)
-- =============================================================================

-- users (já existe)
-- products (já existe)
-- categories (já existe)
-- orders (já existe)
-- order_items (já existe)
-- payments (já existe)
-- ingredients (já existe)
-- ingredient_batches (já existe)
-- recipes (já existe)
-- recipe_ingredients (já existe)
-- company_settings (já existe)

-- =============================================================================
-- NOVAS TABELAS PARA COMPLETAR A MODELAGEM
-- =============================================================================

-- 1. EMPLOYEE_SCHEDULES - Gestão de Horários
CREATE TABLE IF NOT EXISTS employee_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    shift_type VARCHAR(20) NOT NULL CHECK (shift_type IN ('morning', 'afternoon', 'night', 'full')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_start TIME,
    break_end TIME,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'absent', 'late')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. PERMISSION_PROFILES - Perfis de Permissão
CREATE TABLE IF NOT EXISTS permission_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. USER_PERMISSIONS - Permissões Granulares por Usuário
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    permission_profile_id UUID REFERENCES permission_profiles(id) ON DELETE SET NULL,
    custom_permissions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 4. AUDIT_LOGS - Logs de Auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. SYSTEM_SETTINGS - Configurações do Sistema
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. BACKUP_LOGS - Logs de Backup
CREATE TABLE IF NOT EXISTS backup_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    backup_type VARCHAR(50) NOT NULL CHECK (backup_type IN ('manual', 'scheduled', 'automatic')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    file_path TEXT,
    file_size BIGINT,
    tables_included TEXT[],
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- 7. NOTIFICATIONS - Sistema de Notificações
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. ANALYTICS_CACHE - Cache para Analytics
CREATE TABLE IF NOT EXISTS analytics_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cache_key VARCHAR(200) NOT NULL UNIQUE,
    data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- ÍNDICES PARA PERFORMANCE
-- =============================================================================

-- Employee Schedules
CREATE INDEX IF NOT EXISTS idx_employee_schedules_employee_date ON employee_schedules(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_employee_schedules_date ON employee_schedules(date);
CREATE INDEX IF NOT EXISTS idx_employee_schedules_status ON employee_schedules(status);

-- User Permissions
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_profile_id ON user_permissions(permission_profile_id);

-- Audit Logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Analytics Cache
CREATE INDEX IF NOT EXISTS idx_analytics_cache_expires_at ON analytics_cache(expires_at);

-- =============================================================================
-- TRIGGERS PARA UPDATED_AT
-- =============================================================================

-- Function para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para tabelas com updated_at
CREATE TRIGGER update_employee_schedules_updated_at BEFORE UPDATE ON employee_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_permission_profiles_updated_at BEFORE UPDATE ON permission_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_permissions_updated_at BEFORE UPDATE ON user_permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- RLS (ROW LEVEL SECURITY) POLICIES
-- =============================================================================

-- Employee Schedules
ALTER TABLE employee_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own schedules" ON employee_schedules
    FOR SELECT USING (
        auth.uid() = employee_id OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'staff')
        )
    );

CREATE POLICY "Admins can manage all schedules" ON employee_schedules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- User Permissions
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all permissions" ON user_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Permission Profiles
ALTER TABLE permission_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage permission profiles" ON permission_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Audit Logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- System Settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage system settings" ON system_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Users can view public settings" ON system_settings
    FOR SELECT USING (is_public = true);

-- Backup Logs
ALTER TABLE backup_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage backup logs" ON backup_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all notifications" ON notifications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Analytics Cache
ALTER TABLE analytics_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and staff can access analytics cache" ON analytics_cache
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'staff')
        )
    );

-- =============================================================================
-- DADOS INICIAIS
-- =============================================================================

-- Perfis de Permissão Padrão
INSERT INTO permission_profiles (name, description, permissions, is_default) VALUES
('Admin Completo', 'Acesso total ao sistema', 
 '["view_dashboard", "manage_products", "manage_orders", "manage_inventory", "manage_employees", "manage_schedules", "manage_permissions", "view_financial", "manage_payments", "manage_settings", "view_reports", "manage_backup"]'::jsonb, 
 true),
('Staff Operacional', 'Acesso operacional básico', 
 '["view_dashboard", "manage_products", "manage_orders", "view_inventory", "view_schedules", "view_reports"]'::jsonb, 
 true),
('Caixa', 'Acesso ao módulo de caixa', 
 '["view_dashboard", "view_products", "manage_payments", "view_orders", "view_financial"]'::jsonb, 
 true);

-- Configurações do Sistema Padrão
INSERT INTO system_settings (setting_key, setting_value, description, is_public) VALUES
('app_name', '"ItSells"', 'Nome da aplicação', true),
('app_version', '"1.0.0"', 'Versão da aplicação', true),
('theme', '"dark"', 'Tema padrão da aplicação', true),
('timezone', '"America/Sao_Paulo"', 'Fuso horário do sistema', false),
('backup_frequency', '"daily"', 'Frequência de backup automático', false),
('max_login_attempts', '5', 'Máximo de tentativas de login', false),
('session_timeout', '3600', 'Timeout da sessão em segundos', false),
('enable_notifications', 'true', 'Habilitar sistema de notificações', false),
('enable_audit_logs', 'true', 'Habilitar logs de auditoria', false),
('currency', '"BRL"', 'Moeda padrão', true);

-- =============================================================================
-- VIEWS ÚTEIS
-- =============================================================================

-- View para estatísticas de funcionários
CREATE OR REPLACE VIEW employee_stats AS
SELECT 
    COUNT(*) as total_employees,
    COUNT(*) FILTER (WHERE status = 'active') as active_employees,
    COUNT(*) FILTER (WHERE status = 'inactive') as inactive_employees,
    COUNT(*) FILTER (WHERE role = 'admin') as admin_count,
    COUNT(*) FILTER (WHERE role = 'staff') as staff_count,
    COUNT(*) FILTER (WHERE role = 'cashier') as cashier_count
FROM users 
WHERE role IN ('admin', 'staff', 'cashier');

-- View para estatísticas de horários
CREATE OR REPLACE VIEW schedule_stats AS
SELECT 
    date,
    COUNT(*) as total_schedules,
    COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled_count,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
    COUNT(*) FILTER (WHERE status = 'absent') as absent_count,
    COUNT(*) FILTER (WHERE status = 'late') as late_count,
    COUNT(DISTINCT employee_id) as unique_employees
FROM employee_schedules
GROUP BY date;

-- View para relatórios de vendas
CREATE OR REPLACE VIEW sales_analytics AS
SELECT 
    DATE(created_at) as sale_date,
    COUNT(*) as total_orders,
    SUM(amount) as total_revenue,
    AVG(amount) as average_ticket,
    COUNT(DISTINCT customer_id) as unique_customers
FROM payments 
WHERE status = 'approved'
GROUP BY DATE(created_at);

-- =============================================================================
-- FUNCTIONS ÚTEIS
-- =============================================================================

-- Function para limpar cache expirado
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM analytics_cache WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function para criar notificação
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_title VARCHAR(200),
    p_message TEXT,
    p_type VARCHAR(50) DEFAULT 'info',
    p_priority VARCHAR(20) DEFAULT 'normal',
    p_action_url TEXT DEFAULT NULL,
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, title, message, type, priority, action_url, expires_at)
    VALUES (p_user_id, p_title, p_message, p_type, p_priority, p_action_url, p_expires_at)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function para audit log
CREATE OR REPLACE FUNCTION create_audit_log(
    p_user_id UUID,
    p_action VARCHAR(100),
    p_table_name VARCHAR(100),
    p_record_id UUID,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
    VALUES (p_user_id, p_action, p_table_name, p_record_id, p_old_values, p_new_values)
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- COMENTÁRIOS FINAIS
-- =============================================================================

-- Este schema completo inclui:
-- 1. Todas as tabelas necessárias para o sistema completo
-- 2. Índices para performance otimizada
-- 3. RLS policies para segurança
-- 4. Triggers para manutenção automática
-- 5. Views para relatórios e estatísticas
-- 6. Functions utilitárias
-- 7. Dados iniciais essenciais

-- Para executar este schema:
-- 1. Execute este arquivo no Supabase SQL Editor
-- 2. Verifique se todas as tabelas foram criadas
-- 3. Teste as policies de RLS
-- 4. Valide os dados iniciais
