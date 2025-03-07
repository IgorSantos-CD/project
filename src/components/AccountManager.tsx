import React, { useState, useEffect } from 'react';
import { Wallet, Pencil, Trash2, Check, X } from 'lucide-react';
import { accountService, Account } from '../services/accountService';
import { toast } from 'react-hot-toast';

const AccountManager: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setIsLoading(true);
      const data = await accountService.getAccounts();
      setAccounts(data);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
      toast.error('Erro ao carregar contas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
  };

  const handleSave = async () => {
    if (!editingAccount) return;

    try {
      await accountService.updateAccount(editingAccount.id, {
        name: editingAccount.name,
        type: editingAccount.type,
        balance: editingAccount.balance
      });
      toast.success('Conta atualizada com sucesso!');
      setEditingAccount(null);
      loadAccounts();
    } catch (error) {
      console.error('Erro ao atualizar conta:', error);
      toast.error('Erro ao atualizar conta');
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await accountService.deleteAccount(accountId);
      toast.success('Conta excluída com sucesso!');
      loadAccounts();
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      toast.error('Erro ao excluir conta');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-6">
        <Wallet className="h-5 w-5 text-blue-500" />
        <h2 className="text-xl font-semibold">Gerenciar Carteiras</h2>
      </div>

      <div className="space-y-4">
        {accounts.map((account) => (
          <div
            key={account.id}
            className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            {editingAccount?.id === account.id ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={editingAccount.name}
                    onChange={(e) =>
                      setEditingAccount({ ...editingAccount, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={editingAccount.type}
                    onChange={(e) =>
                      setEditingAccount({
                        ...editingAccount,
                        type: e.target.value as Account['type']
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="checking">Conta Corrente</option>
                    <option value="savings">Conta Poupança</option>
                    <option value="investment">Conta Investimento</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Saldo Inicial
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingAccount.balance}
                    onChange={(e) =>
                      setEditingAccount({
                        ...editingAccount,
                        balance: parseFloat(e.target.value)
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingAccount(null)}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 text-sm text-green-600 hover:text-green-900"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{account.name}</h3>
                  <p className="text-sm text-gray-500">
                    {account.type === 'checking'
                      ? 'Conta Corrente'
                      : account.type === 'savings'
                      ? 'Conta Poupança'
                      : 'Conta Investimento'}
                  </p>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    Saldo Inicial: R$ {account.balance.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(account)}
                    className="p-2 text-gray-600 hover:text-gray-900"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(account.id)}
                    className="p-2 text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AccountManager; 