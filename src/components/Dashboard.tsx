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
      
      // Filtrar transações pelo período selecionado
      const filteredTransactions = transactions.filter(transaction => {
        const transactionDate = transaction.date;
        return transactionDate >= dateRange.startDate && transactionDate <= dateRange.endDate;
      });

      // Calcular totais
      const totalIncome = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpense = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      // Agrupar por categoria
      const transactionsByCategory = Object.values(
        filteredTransactions.reduce((acc, transaction) => {
          const key = `${transaction.category}-${transaction.type}`;
          if (!acc[key]) {
            acc[key] = {
              category: transaction.category,
              amount: 0,
              type: transaction.type
            };
          }
          acc[key].amount += transaction.amount;
          return acc;
        }, {} as Record<string, { category: string; amount: number; type: 'income' | 'expense' }>)
      );

      // Agrupar por data
      const transactionsByDate = Object.values(
        filteredTransactions.reduce((acc, transaction) => {
          const date = transaction.date;
          if (!acc[date]) {
            acc[date] = {
              date,
              income: 0,
              expense: 0
            };
          }
          if (transaction.type === 'income') {
            acc[date].income += transaction.amount;
          } else {
            acc[date].expense += transaction.amount;
          }
          return acc;
        }, {} as Record<string, { date: string; income: number; expense: number }>)
      ).sort((a, b) => (a as { date: string }).date.localeCompare((b as { date: string }).date));

      setDashboardData({
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        transactionsByCategory: transactionsByCategory as { category: string; amount: number; type: 'income' | 'expense' }[],
        transactionsByDate: transactionsByDate as { date: string; income: number; expense: number }[],
        recentTransactions: filteredTransactions.slice(0, 5)
      });
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

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
    <div className="p-6 space-y-6">
      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros
        </h2>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              className="border rounded px-2 py-1"
            />
            <span>até</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              className="border rounded px-2 py-1"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleQuickFilter(7)}
              className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
            >
              7 dias
            </button>
            <button
              onClick={() => handleQuickFilter(30)}
              className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
            >
              30 dias
            </button>
            <button
              onClick={() => {
                setDateRange({
                  startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
                  endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd')
                });
              }}
              className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
            >
              Este mês
            </button>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Receitas</p>
              <p className="text-2xl font-bold text-green-600">
                R$ {dashboardData.totalIncome.toFixed(2)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Despesas</p>
              <p className="text-2xl font-bold text-red-600">
                R$ {dashboardData.totalExpense.toFixed(2)}
              </p>
            </div>
            <TrendingDown className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Saldo</p>
              <p className={`text-2xl font-bold ${dashboardData.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                R$ {dashboardData.balance.toFixed(2)}
              </p>
            </div>
            <DollarSign className={`h-8 w-8 ${dashboardData.balance >= 0 ? 'text-blue-500' : 'text-red-500'}`} />
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Barras - Receitas vs Despesas por Data */}
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
                <Bar dataKey="income" name="Receitas" fill="#4CAF50" />
                <Bar dataKey="expense" name="Despesas" fill="#f44336" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Pizza - Despesas por Categoria */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-4">Despesas por Categoria</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboardData.transactionsByCategory.filter(t => t.type === 'expense')}
                  dataKey="amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {dashboardData.transactionsByCategory
                    .filter(t => t.type === 'expense')
                    .map((_, index) => (
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

      {/* Transações Recentes */}
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