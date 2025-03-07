import React, { useState, useEffect } from 'react';
import { Wallet } from 'lucide-react';
import { accountService, Account } from '../services/accountService';

interface AccountSelectorProps {
  onSelect: (accountId: string) => void;
  selectedAccountId?: string;
}

const AccountSelector: React.FC<AccountSelectorProps> = ({ onSelect, selectedAccountId }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
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
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          Carteira
        </div>
      </label>
      <select
        value={selectedAccountId || ''}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Selecione uma carteira</option>
        {accounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name} - R$ {account.balance.toFixed(2)}
          </option>
        ))}
      </select>
    </div>
  );
};

export default AccountSelector; 