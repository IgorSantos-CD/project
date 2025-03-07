import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { transactionService } from '../services/transactionService';
import { accountService } from '../services/accountService';

interface BalanceChartProps {
  accountId: string;
}

interface MonthlyBalance {
  month: string;
  balance: number;
}

const BalanceChart: React.FC<BalanceChartProps> = ({ accountId }) => {
  const [data, setData] = useState<MonthlyBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBalanceData();
  }, [accountId]);

  const loadBalanceData = async () => {
    try {
      setIsLoading(true);
      
      // Buscar a conta para obter o saldo inicial
      const account = await accountService.getAccount(accountId);
      const transactions = await transactionService.getTransactions();
      
      // Filtrar transações da conta selecionada
      const accountTransactions = transactions.filter(
        transaction => transaction.account_id === accountId
      );

      // Gerar array com os últimos 12 meses
      const months = Array.from({ length: 12 }, (_, i) => {
        const date = subMonths(new Date(), i);
        return {
          start: startOfMonth(date),
          end: endOfMonth(date),
          label: format(date, 'MMM/yyyy', { locale: ptBR })
        };
      }).reverse();

      // Calcular saldo acumulado para cada mês
      let runningBalance = account.balance; // Começar com o saldo inicial
      const monthlyBalances = months.map(month => {
        const monthTransactions = accountTransactions.filter(transaction => {
          const transactionDate = new Date(transaction.date);
          return transactionDate >= month.start && transactionDate <= month.end;
        });

        // Calcular o saldo do mês
        const monthIncome = monthTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        const monthExpense = monthTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        // Atualizar o saldo acumulado
        runningBalance += (monthIncome - monthExpense);

        return {
          month: month.label,
          balance: runningBalance
        };
      });

      setData(monthlyBalances);
    } catch (error) {
      console.error('Erro ao carregar dados do gráfico:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">Evolução do Saldo</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip
              formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Saldo']}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="balance"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BalanceChart; 