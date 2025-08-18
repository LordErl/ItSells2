import { useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { USER_ROLES } from '../lib/constants'

/**
 * Hook para gerenciar permissões baseadas no role do usuário
 */
export const usePermissions = () => {
  const { user } = useAuth()

  const permissions = useMemo(() => {
    if (!user) return {}

    const role = user.role

    return {
      // Permissões gerais
      canViewAdminDashboard: [USER_ROLES.ADMIN].includes(role),
      canViewStaffDashboard: [USER_ROLES.ADMIN, USER_ROLES.STAFF].includes(role),
      canViewCashierDashboard: [USER_ROLES.ADMIN, USER_ROLES.STAFF, USER_ROLES.CASHIER].includes(role),

      // Permissões de gestão
      canManageProducts: [USER_ROLES.ADMIN, USER_ROLES.STAFF].includes(role),
      canManageOrders: [USER_ROLES.ADMIN, USER_ROLES.STAFF, USER_ROLES.CASHIER].includes(role),
      canManageInventory: [USER_ROLES.ADMIN, USER_ROLES.STAFF].includes(role),
      canManageEmployees: [USER_ROLES.ADMIN].includes(role),
      canManageCompanySettings: [USER_ROLES.ADMIN].includes(role),
      canManageRecipes: [USER_ROLES.ADMIN, USER_ROLES.STAFF].includes(role),
      canManageBatches: [USER_ROLES.ADMIN, USER_ROLES.STAFF].includes(role),
      canManageExpiration: [USER_ROLES.ADMIN, USER_ROLES.STAFF].includes(role),

      // Permissões de visualização
      canViewSalesReports: [USER_ROLES.ADMIN, USER_ROLES.STAFF].includes(role),
      canViewDailyReports: [USER_ROLES.ADMIN, USER_ROLES.STAFF, USER_ROLES.CASHIER].includes(role),
      canViewOperationalDashboard: [USER_ROLES.ADMIN, USER_ROLES.STAFF].includes(role),
      canViewFinancialData: [USER_ROLES.ADMIN].includes(role),
      canViewEmployeeData: [USER_ROLES.ADMIN].includes(role),
      canViewAdvancedReports: [USER_ROLES.ADMIN].includes(role),

      // Permissões de ações
      canProcessPayments: [USER_ROLES.ADMIN, USER_ROLES.STAFF, USER_ROLES.CASHIER].includes(role),
      canCreateOrders: [USER_ROLES.ADMIN, USER_ROLES.STAFF, USER_ROLES.CASHIER].includes(role),
      canCancelOrders: [USER_ROLES.ADMIN, USER_ROLES.STAFF].includes(role),
      canModifyPrices: [USER_ROLES.ADMIN].includes(role),
      canBackupData: [USER_ROLES.ADMIN].includes(role),
      canManageSystemSettings: [USER_ROLES.ADMIN].includes(role),
      canManageBackups: [USER_ROLES.ADMIN].includes(role),

      // Role específico
      isAdmin: role === USER_ROLES.ADMIN,
      isStaff: role === USER_ROLES.STAFF,
      isCashier: role === USER_ROLES.CASHIER,
      isCustomer: role === USER_ROLES.CUSTOMER,

      // Informações do usuário
      userRole: role,
      userName: user.name,
      userId: user.id
    }
  }, [user])

  return permissions
}

/**
 * Configuração de cards do dashboard baseada em permissões
 */
export const getDashboardCardPermissions = (permissions) => {
  return {
    totalProducts: permissions.canManageProducts,
    activeOrders: permissions.canManageOrders,
    occupiedTables: permissions.canViewOperationalDashboard,
    todaySales: permissions.canViewFinancialData,
    totalEmployees: permissions.canViewEmployeeData,
    pendingPayments: permissions.canProcessPayments,
    lowStockItems: permissions.canManageInventory,
    expiringItems: permissions.canManageExpiration
  }
}

/**
 * Configuração de ações rápidas baseada em permissões
 */
export const getQuickActionsPermissions = (permissions) => {
  return {
    manageProducts: permissions.canManageProducts,
    dailyReport: permissions.canViewDailyReports,
    inventoryManagement: permissions.canManageInventory,
    companySettings: permissions.canManageCompanySettings,
    cashierModule: permissions.canViewCashierDashboard,
    operationalDashboard: permissions.canViewOperationalDashboard,
    recipes: permissions.canManageRecipes,
    expirationControl: permissions.canManageExpiration,
    viewReports: permissions.canViewAdvancedReports,
    manageSettings: permissions.canManageSystemSettings,
    manageBackups: permissions.canManageBackups
  }
}

/**
 * Configuração de seções de gestão baseada em permissões
 */
export const getManagementSectionsPermissions = (permissions) => {
  return {
    menuManagement: {
      products: permissions.canManageProducts,
      menuStaff: permissions.canManageProducts,
      recipes: permissions.canManageRecipes
    },
    operations: {
      operationalDashboard: permissions.canViewOperationalDashboard,
      cashierModule: permissions.canViewCashierDashboard,
      reports: permissions.canViewDailyReports,
      companySettings: permissions.canManageCompanySettings,
      salesIntegration: permissions.canViewSalesReports
    },
    inventory: {
      ingredients: permissions.canManageInventory,
      expirationControl: permissions.canManageExpiration,
      batchManagement: permissions.canManageBatches
    },
    staff: {
      employees: permissions.canManageEmployees,
      schedules: permissions.canManageEmployees,
      permissions: permissions.canManageEmployees
    }
  }
}
