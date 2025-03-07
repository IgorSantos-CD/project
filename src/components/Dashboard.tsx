import React, { useState, useEffect, useCallback } from 'react';
import { format, subDays, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { transactionService } from '../services/transactionService';
import { Calendar, Filter, TrendingUp, TrendingDown, DollarSign, Trash2, CheckSquare, XSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import AccountSelector from './AccountSelector';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  category: string;
}

interface DashboardData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionsByCategory: {
    category: string;
    amount: number;
    type: 'income' | 'expense';
  }[];
  transactionsByDate: {
    date: string;
    income: number;
    expense: number;
  }[];
  recentTransactions: Transaction[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const Dashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
  });

  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    transactionsByCategory: [],
    transactionsByDate: [],
    recentTransactions: []
  });

  const [isLoading, setIsLoading] = useState(true);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const transactions = await transactionService.getTransactions();
      
      // Filtrar transações pelo período selecionado e pela carteira
      const filteredTransactions = transactions.filter(transaction => {
        const transactionDate = transaction.date;
        const matchesDate = transactionDate >= dateRange.startDate && transactionDate <= dateRange.endDate;
        const matchesAccount = !selectedAccountId || transaction.account_id === selectedAccountId;
        return matchesDate && matchesAccount;
      });

      // Calcular totais
      const totalIncome = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpense = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      // Agrupar transações por categoria
      const transactionsByCategory = filteredTransactions.reduce((acc, transaction) => {
        const existingCategory = acc.find((c: { category: string }) => c.category === transaction.category);
        if (existingCategory) {
          existingCategory.amount += transaction.amount;
        } else {
          acc.push({
            category: transaction.category,
            amount: transaction.amount,
            type: transaction.type
          });
        }
        return acc;
      }, [] as DashboardData['transactionsByCategory']);

      // Agrupar transações por data
      const transactionsByDate = filteredTransactions.reduce((acc, transaction) => {
        const date = transaction.date;
        const existingDate = acc.find((d: { date: string }) => d.date === date);
        if (existingDate) {
          if (transaction.type === 'income') {
            existingDate.income += transaction.amount;
          } else {
            existingDate.expense += transaction.amount;
          }
        } else {
          acc.push({
            date,
            income: transaction.type === 'income' ? transaction.amount : 0,
            expense: transaction.type === 'expense' ? transaction.amount : 0
          });
        }
        return acc;
      }, [] as DashboardData['transactionsByDate']);

      // Ordenar transações por data
      transactionsByDate.sort((a: { date: string }, b: { date: string }) => a.date.localeCompare(b.date));

      // Pegar as transações mais recentes
      const recentTransactions = filteredTransactions
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 10);

      setDashboardData({
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        transactionsByCategory,
        transactionsByDate,
        recentTransactions
      });
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [dateRange, selectedAccountId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleQuickFilter = (days: number) => {
    const end = new Date();
    const start = subDays(end, days);
    setDateRange({
      startDate: format(start, 'yyyy-MM-dd'),
      endDate: format(end, 'yyyy-MM-dd')
    });
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await transactionService.deleteTransaction(id);
      toast.success('Transação excluída com sucesso!');
      loadDashboardData();
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      toast.error('Erro ao excluir transação');
    }
  };

  const handleDeleteSelected = async () => {
    try {
      await transactionService.deleteMultipleTransactions(selectedTransactions);
      toast.success('Transações excluídas com sucesso!');
      setSelectedTransactions([]);
      setShowDeleteConfirm(false);
      loadDashboardData();
    } catch (error) {
      console.error('Erro ao excluir transações:', error);
      toast.error('Erro ao excluir transações');
    }
  };

  const toggleTransactionSelection = (id: string) => {
    setSelectedTransactions(prev =>
      prev.includes(id)
        ? prev.filter(transactionId => transactionId !== id)
        : [...prev, id]
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1">
            <AccountSelector
              onSelect={setSelectedAccountId}
              selectedAccountId={selectedAccountId}
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              />
              <span className="text-gray-500">até</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <button
                onClick={() => handleQuickFilter(7)}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
              >
                7 dias
              </button>
              <button
                onClick={() => handleQuickFilter(30)}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
              >
                30 dias
              </button>
              <button
                onClick={() => handleQuickFilter(90)}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
              >
                90 dias
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <h3 className="text-lg font-semibold">Receitas</h3>
          </div>
          <p className="text-2xl font-bold text-green-600 mt-2">
            R$ {dashboardData.totalIncome.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-500" />
            <h3 className="text-lg font-semibold">Despesas</h3>
          </div>
          <p className="text-2xl font-bold text-red-600 mt-2">
            R$ {dashboardData.totalExpense.toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-semibold">Saldo</h3>
          </div>
          <p className={`text-2xl font-bold mt-2 ${
            dashboardData.balance >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            R$ {dashboardData.balance.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-4">Receitas vs Despesas</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardData.transactionsByDate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="income" name="Receitas" fill="#10B981" />
                <Bar dataKey="expense" name="Despesas" fill="#EF4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-4">Distribuição por Categoria</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboardData.transactionsByCategory}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {dashboardData.transactionsByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tabela de Transações */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Transações Recentes</h3>
          {selectedTransactions.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {selectedTransactions.length} selecionado(s)
              </span>
              {showDeleteConfirm ? (
                <>
                  <button
                    onClick={handleDeleteSelected}
                    className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                  >
                    <CheckSquare className="h-4 w-4 mr-1" />
                    Confirmar
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setSelectedTransactions([]);
                    }}
                    className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    <XSquare className="h-4 w-4 mr-1" />
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Excluir Selecionados
                </button>
              )}
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedTransactions.length === dashboardData.recentTransactions.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTransactions(dashboardData.recentTransactions.map(t => t.id));
                      } else {
                        setSelectedTransactions([]);
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dashboardData.recentTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedTransactions.includes(transaction.id)}
                      onChange={() => toggleTransactionSelection(transaction.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(parseISO(transaction.date), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.category}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    R$ {transaction.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleDeleteTransaction(transaction.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;