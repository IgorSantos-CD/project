import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { transactionService } from '../services/transactionService';
import { accountService } from '../services/accountService';
import AccountSelector from './AccountSelector';
import BalanceChart from './BalanceChart';
import { toast } from 'react-hot-toast';

interface AccountOverviewData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  totalTransactions: number;
  initialBalance: number;
}

const AccountOverview: React.FC = () => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [overviewData, setOverviewData] = useState<AccountOverviewData>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    totalTransactions: 0,
    initialBalance: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedAccountId) {
      loadAccountData();
      loadOverviewData();
    }
  }, [selectedAccountId]);

  const loadAccountData = async () => {
    try {
      const account = await accountService.getAccount(selectedAccountId);
      setOverviewData(prev => ({ ...prev, initialBalance: account.balance }));
    } catch (error) {
      console.error('Erro ao carregar dados da conta:', error);
      toast.error('Erro ao carregar dados da conta');
    }
  };

  const loadOverviewData = async () => {
    try {
      setIsLoading(true);
      const transactions = await transactionService.getTransactions();
      
      // Filtrar transações pela carteira selecionada
      const accountTransactions = transactions.filter(
        transaction => transaction.account_id === selectedAccountId
      );

      // Calcular totais
      const totalIncome = accountTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpense = accountTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      setOverviewData(prev => ({
        ...prev,
        totalIncome,
        totalExpense,
        balance: prev.initialBalance + totalIncome - totalExpense,
        totalTransactions: accountTransactions.length
      }));
    } catch (error) {
      console.error('Erro ao carregar visão geral:', error);
      toast.error('Erro ao carregar visão geral da conta');
    } finally {
      setIsLoading(false);
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
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Visão Geral da Conta</h2>
          <div className="w-64">
            <AccountSelector
              onSelect={setSelectedAccountId}
              selectedAccountId={selectedAccountId}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-500" />
              <h3 className="text-sm font-medium text-gray-500">Total de Transações</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {overviewData.totalTransactions}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <h3 className="text-sm font-medium text-gray-500">Total de Receitas</h3>
            </div>
            <p className="text-2xl font-bold text-green-600 mt-2">
              R$ {overviewData.totalIncome.toFixed(2)}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <h3 className="text-sm font-medium text-gray-500">Total de Despesas</h3>
            </div>
            <p className="text-2xl font-bold text-red-600 mt-2">
              R$ {overviewData.totalExpense.toFixed(2)}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-500" />
              <h3 className="text-sm font-medium text-gray-500">Saldo Total</h3>
            </div>
            <p className={`text-2xl font-bold mt-2 ${
              overviewData.balance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              R$ {overviewData.balance.toFixed(2)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Saldo Inicial: R$ {overviewData.initialBalance.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {selectedAccountId && (
        <BalanceChart accountId={selectedAccountId} />
      )}
    </div>
  );
};

export default AccountOverview; 