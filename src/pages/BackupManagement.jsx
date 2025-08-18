import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../hooks/usePermissions'
import BackupService from '../services/BackupService'
import { toast } from 'react-hot-toast'

const BackupManagement = () => {
  const { user } = useAuth()
  const permissions = usePermissions()
  const [loading, setLoading] = useState(true)
  const [backups, setBackups] = useState([])
  const [selectedBackups, setSelectedBackups] = useState([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState(null)
  const [loadingAction, setLoadingAction] = useState(false)
  const [backupOptions, setBackupOptions] = useState({
    description: '',
    includeTables: ['all'],
    compression: true
  })

  // Verificar permissões
  if (!permissions.manageBackups) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">Acesso Negado</h1>
          <p className="text-gray-400">Você não tem permissão para gerenciar backups.</p>
        </div>
      </div>
    )
  }

  useEffect(() => {
    loadBackups()
  }, [])

  const loadBackups = async () => {
    setLoading(true)
    try {
      const result = await BackupService.getBackupHistory(50)
      if (result.success) {
        setBackups(result.data)
      } else {
        toast.error('Erro ao carregar histórico de backups')
      }
    } catch (error) {
      console.error('Erro ao carregar backups:', error)
      toast.error('Erro ao carregar backups')
    } finally {
      setLoading(false)
    }
  }

  const createBackup = async () => {
    setLoadingAction(true)
    try {
      const result = await BackupService.createManualBackup(user.id, backupOptions)
      
      if (result.success) {
        toast.success('Backup criado com sucesso!')
        setShowCreateModal(false)
        setBackupOptions({
          description: '',
          includeTables: ['all'],
          compression: true
        })
        loadBackups()
      } else {
        toast.error('Erro ao criar backup')
      }
    } catch (error) {
      console.error('Erro ao criar backup:', error)
      toast.error('Erro ao criar backup')
    } finally {
      setLoadingAction(false)
    }
  }

  const restoreBackup = async () => {
    if (!selectedBackup) return

    setLoadingAction(true)
    try {
      const result = await BackupService.restoreBackup(selectedBackup.id, user.id)
      
      if (result.success) {
        toast.success('Backup restaurado com sucesso!')
        setShowRestoreModal(false)
        setSelectedBackup(null)
      } else {
        toast.error('Erro ao restaurar backup')
      }
    } catch (error) {
      console.error('Erro ao restaurar backup:', error)
      toast.error('Erro ao restaurar backup')
    } finally {
      setLoadingAction(false)
    }
  }

  const deleteBackups = async () => {
    if (selectedBackups.length === 0) return

    if (!confirm(`Tem certeza que deseja excluir ${selectedBackups.length} backup(s)? Esta ação não pode ser desfeita.`)) {
      return
    }

    setLoadingAction(true)
    try {
      const promises = selectedBackups.map(backupId => 
        BackupService.deleteBackup(backupId, user.id)
      )
      
      const results = await Promise.all(promises)
      const successCount = results.filter(r => r.success).length
      
      if (successCount === selectedBackups.length) {
        toast.success(`${successCount} backup(s) excluído(s) com sucesso!`)
      } else {
        toast.error(`Erro ao excluir alguns backups. ${successCount}/${selectedBackups.length} excluídos.`)
      }
      
      setSelectedBackups([])
      loadBackups()
    } catch (error) {
      console.error('Erro ao excluir backups:', error)
      toast.error('Erro ao excluir backups')
    } finally {
      setLoadingAction(false)
    }
  }

  const cleanupOldBackups = async () => {
    if (!confirm('Tem certeza que deseja limpar backups antigos (mais de 30 dias)? Esta ação não pode ser desfeita.')) {
      return
    }

    setLoadingAction(true)
    try {
      const result = await BackupService.cleanupOldBackups(30)
      
      if (result.success) {
        toast.success(`${result.data.deletedCount} backup(s) antigo(s) removido(s)!`)
        loadBackups()
      } else {
        toast.error('Erro ao limpar backups antigos')
      }
    } catch (error) {
      console.error('Erro ao limpar backups:', error)
      toast.error('Erro ao limpar backups')
    } finally {
      setLoadingAction(false)
    }
  }

  const toggleBackupSelection = (backupId) => {
    setSelectedBackups(prev => 
      prev.includes(backupId) 
        ? prev.filter(id => id !== backupId)
        : [...prev, backupId]
    )
  }

  const selectAllBackups = () => {
    if (selectedBackups.length === backups.length) {
      setSelectedBackups([])
    } else {
      setSelectedBackups(backups.map(backup => backup.id))
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-900 text-green-300'
      case 'failed': return 'bg-red-900 text-red-300'
      case 'running': return 'bg-yellow-900 text-yellow-300'
      default: return 'bg-gray-900 text-gray-300'
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'manual': return 'bg-blue-900 text-blue-300'
      case 'scheduled': return 'bg-green-900 text-green-300'
      case 'automatic': return 'bg-purple-900 text-purple-300'
      default: return 'bg-gray-900 text-gray-300'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando backups...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-yellow-400 mb-2">💾 Gerenciamento de Backups</h1>
            <p className="text-gray-400">Gerencie backups do sistema e restaurações</p>
          </div>
          
          <div className="flex flex-wrap gap-4 mt-4 md:mt-0">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
            >
              ➕ Criar Backup
            </button>
            <button
              onClick={cleanupOldBackups}
              disabled={loadingAction}
              className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
            >
              🧹 Limpar Antigos
            </button>
            {selectedBackups.length > 0 && (
              <button
                onClick={deleteBackups}
                disabled={loadingAction}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
              >
                🗑️ Excluir ({selectedBackups.length})
              </button>
            )}
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
            <h3 className="text-lg font-semibold text-blue-400 mb-2">Total de Backups</h3>
            <p className="text-3xl font-bold text-white">{backups.length}</p>
          </div>
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
            <h3 className="text-lg font-semibold text-green-400 mb-2">Concluídos</h3>
            <p className="text-3xl font-bold text-white">
              {backups.filter(b => b.status === 'completed').length}
            </p>
          </div>
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
            <h3 className="text-lg font-semibold text-red-400 mb-2">Falharam</h3>
            <p className="text-3xl font-bold text-white">
              {backups.filter(b => b.status === 'failed').length}
            </p>
          </div>
          <div className="bg-gray-900 p-6 rounded-lg border border-gray-800">
            <h3 className="text-lg font-semibold text-yellow-400 mb-2">Tamanho Total</h3>
            <p className="text-3xl font-bold text-white">
              {formatFileSize(backups.reduce((total, backup) => total + (backup.file_size || 0), 0))}
            </p>
          </div>
        </div>

        {/* Lista de backups */}
        <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-800">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">Histórico de Backups</h2>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedBackups.length === backups.length && backups.length > 0}
                  onChange={selectAllBackups}
                  className="w-5 h-5 text-yellow-400 bg-gray-800 border-gray-600 rounded focus:ring-yellow-400"
                />
                <span className="text-gray-300">Selecionar todos</span>
              </label>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Seleção
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Data/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Tamanho
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Criado por
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {backups.map((backup) => (
                  <tr key={backup.id} className="hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedBackups.includes(backup.id)}
                        onChange={() => toggleBackupSelection(backup.id)}
                        className="w-5 h-5 text-yellow-400 bg-gray-800 border-gray-600 rounded focus:ring-yellow-400"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-white">
                      {new Date(backup.started_at).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs ${getTypeColor(backup.backup_type)}`}>
                        {backup.backup_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(backup.status)}`}>
                        {backup.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                      {formatFileSize(backup.file_size || 0)}
                    </td>
                    <td className="px-6 py-4 text-gray-300 max-w-xs truncate">
                      {backup.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                      {backup.createdBy || 'Sistema'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {backup.status === 'completed' && (
                          <button
                            onClick={() => {
                              setSelectedBackup(backup)
                              setShowRestoreModal(true)
                            }}
                            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-colors"
                          >
                            🔄 Restaurar
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedBackups([backup.id])
                            deleteBackups()
                          }}
                          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition-colors"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {backups.length === 0 && (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">💾</div>
              <h3 className="text-xl font-semibold text-gray-400 mb-2">Nenhum backup encontrado</h3>
              <p className="text-gray-500">Crie seu primeiro backup para começar.</p>
            </div>
          )}
        </div>

        {/* Modal Criar Backup */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 w-full max-w-md">
              <h3 className="text-xl font-semibold text-white mb-4">Criar Novo Backup</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Descrição
                  </label>
                  <input
                    type="text"
                    value={backupOptions.description}
                    onChange={(e) => setBackupOptions(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição do backup..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Tabelas a incluir
                  </label>
                  <select
                    value={backupOptions.includeTables[0]}
                    onChange={(e) => setBackupOptions(prev => ({ ...prev, includeTables: [e.target.value] }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                  >
                    <option value="all">Todas as tabelas</option>
                    <option value="essential">Apenas essenciais</option>
                    <option value="data">Apenas dados</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={backupOptions.compression}
                      onChange={(e) => setBackupOptions(prev => ({ ...prev, compression: e.target.checked }))}
                      className="w-5 h-5 text-yellow-400 bg-gray-800 border-gray-600 rounded focus:ring-yellow-400"
                    />
                    <span className="text-gray-300">Habilitar compressão</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={createBackup}
                  disabled={loadingAction}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-2 rounded-lg transition-colors"
                >
                  {loadingAction ? 'Criando...' : 'Criar Backup'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Restaurar Backup */}
        {showRestoreModal && selectedBackup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-900 p-6 rounded-lg border border-gray-800 w-full max-w-md">
              <h3 className="text-xl font-semibold text-white mb-4">Restaurar Backup</h3>
              
              <div className="space-y-4">
                <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <span className="text-yellow-400">⚠️</span>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-400">
                        Atenção!
                      </h3>
                      <div className="mt-2 text-sm text-yellow-300">
                        <p>Esta ação irá substituir todos os dados atuais pelos dados do backup. Esta operação não pode ser desfeita.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-gray-300">
                    <strong>Backup:</strong> {new Date(selectedBackup.started_at).toLocaleString('pt-BR')}
                  </p>
                  <p className="text-gray-300">
                    <strong>Tamanho:</strong> {formatFileSize(selectedBackup.file_size || 0)}
                  </p>
                  <p className="text-gray-300">
                    <strong>Descrição:</strong> {selectedBackup.description || 'Sem descrição'}
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => {
                    setShowRestoreModal(false)
                    setSelectedBackup(null)
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={restoreBackup}
                  disabled={loadingAction}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-6 py-2 rounded-lg transition-colors"
                >
                  {loadingAction ? 'Restaurando...' : 'Confirmar Restauração'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BackupManagement
