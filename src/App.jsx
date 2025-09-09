import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { StoreProvider } from './contexts/StoreContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { Toaster } from 'react-hot-toast'

// Components
import LoginPage from './pages/Login'
import RegisterPage from './pages/RegisterPage'  // ← ADICIONADO
import AdminDashboard from './pages/AdminDashboard'
import StaffDashboard from './pages/StaffDashboard'
import OperationalDashboard from './pages/OperationalDashboard'
import CustomerMenu from './pages/CustomerMenu'
import CustomerAccount from './pages/CustomerAccount'
import CustomerCheckout from './pages/CustomerCheckout'
import OrderTracking from './pages/OrderTracking'
import SupplierDashboard from './pages/SupplierDashboard'
import CashierDashboard from './pages/CashierDashboard'
import ProductManagement from './pages/ProductManagement'
import DailyReport from './pages/DailyReport'
import CompanySettings from './pages/CompanySettings'
import Ingredients from './pages/Ingredients'
import QRScanner from './components/QRScanner'
import LoadingScreen from './components/LoadingScreen'

// Staff Management Pages
import EmployeeManagement from './pages/EmployeeManagement'
import ScheduleManagement from './pages/ScheduleManagement'
import PermissionManagement from './pages/PermissionManagement'

// Advanced Features Pages
import AdvancedReports from './pages/AdvancedReports'
import SystemSettings from './pages/SystemSettings'
import BackupManagement from './pages/BackupManagement'

// Staff Components
import BatchManagement from './components/BatchManagement'
import ExpirationControl from './components/ExpirationControl'
import MenuManagement from './components/MenuManagement'
import ExitCamera from './components/ExitCamera'
import StaffDailyReport from './components/StaffDailyReport'

// Recipe Management Components
import RecipeManagementDashboard from './components/RecipeManagementDashboard'
import IngredientManagement from './components/IngredientManagement'
import RecipeManagement from './components/RecipeManagement'
import SalesIntegration from './components/SalesIntegration'
import StockIntegrationDemo from './components/integration/StockIntegrationDemo'

// Styles
import './App.css'

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return <LoadingScreen />
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />
  }
  
  return children
}

// Main App Component
function AppContent() {
  const { user, isAuthenticated } = useAuth()
  
  return (
    <div className="min-h-screen animated-bg">
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />  {/* ← ADICIONADO */}
        <Route path="/qr-scan" element={<QRScanner />} />
        
        {/* Protected Routes */}
        <Route 
          path="/admin-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Alias for /admin */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/company-settings" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <CompanySettings />
            </ProtectedRoute>
          } 
        />
        
        {/* Staff Management Routes */}
        <Route 
          path="/employee-management" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <EmployeeManagement />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/schedule-management" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ScheduleManagement />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/permission-management" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <PermissionManagement />
            </ProtectedRoute>
          } 
        />
        
        {/* Advanced Features Routes */}
        <Route 
          path="/advanced-reports" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdvancedReports />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/system-settings" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <SystemSettings />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/backup-management" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <BackupManagement />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/staff/*" 
          element={
            <ProtectedRoute allowedRoles={['staff', 'admin']}>
              <StaffDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/staff-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['staff', 'admin']}>
              <StaffDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/operational-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['staff', 'admin']}>
              <OperationalDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/customer/*" 
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerMenu />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/customer-account" 
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerAccount />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/customer-checkout" 
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerCheckout />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/order-tracking/:orderId" 
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <OrderTracking />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/supplier/*" 
          element={
            <ProtectedRoute allowedRoles={['supplier']}>
              <SupplierDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/cashier-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['staff', 'admin', 'cashier']}>
              <CashierDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/admin/products" 
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ProductManagement />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/daily-report" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <DailyReport />
            </ProtectedRoute>
          } 
        />
        
        {/* Staff Module Routes */}
        <Route 
          path="/batch-management" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <BatchManagement />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/expiration-control" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <ExpirationControl />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/menu-management" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <MenuManagement />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/exit-camera" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <ExitCamera />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/staff-daily-report" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <StaffDailyReport />
            </ProtectedRoute>
          } 
        />
        
        {/* Recipe Management Routes */}
        <Route 
          path="/recipe-dashboard" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <RecipeManagementDashboard />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/ingredients" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <Ingredients />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/recipes" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <RecipeManagement />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/sales-integration" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <SalesIntegration />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/stock-integration-demo" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <StockIntegrationDemo />
            </ProtectedRoute>
          } 
        />
        
        {/* Order Management - Redirect to Operational Dashboard */}
        <Route 
          path="/order-management" 
          element={
            <ProtectedRoute allowedRoles={['admin', 'staff']}>
              <Navigate to="/operational-dashboard" replace />
            </ProtectedRoute>
          } 
        />
        
        {/* Default Redirects */}
        <Route 
          path="/" 
          element={
            isAuthenticated ? (
              user?.role === 'admin' ? <Navigate to="/admin" replace /> :
              user?.role === 'staff' ? <Navigate to="/staff" replace /> :
              user?.role === 'customer' ? <Navigate to="/customer" replace /> :
              <Navigate to="/login" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        
        {/* 404 and Unauthorized */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  )
}

// Unauthorized Page
function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-card p-8 text-center max-w-md">
        <h1 className="text-2xl font-bold text-gold-gradient mb-4">
          Acesso Negado
        </h1>
        <p className="text-gold/80 mb-6">
          Você não tem permissão para acessar esta área.
        </p>
        <button 
          onClick={() => window.history.back()}
          className="btn-luxury"
        >
          Voltar
        </button>
      </div>
    </div>
  )
}

// 404 Page
function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="glass-card p-8 text-center max-w-md">
        <h1 className="text-4xl font-bold text-gold-gradient mb-4">404</h1>
        <p className="text-gold/80 mb-6">Página não encontrada</p>
        <button 
          onClick={() => window.location.href = '/'}
          className="btn-luxury"
        >
          Ir para Início
        </button>
      </div>
    </div>
  )
}

// Main App with Providers
function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <StoreProvider>
            <AppContent />
            <Toaster 
              position="top-center"
              toastOptions={{
                duration: 3000,
                style: {
                  background: 'rgba(0, 0, 0, 0.9)',
                  color: '#FFD700',
                  backdropFilter: 'blur(15px)',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                },
                success: {
                  iconTheme: {
                    primary: '#FFD700',
                    secondary: 'black',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ff4b4b',
                    secondary: 'black',
                  },
                },
              }}
            />
          </StoreProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  )
}

export default App

