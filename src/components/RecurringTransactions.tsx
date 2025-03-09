import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Wallet, Tag, ArrowUpCircle, ArrowDownCircle, Clock, Ban, AlertCircle } from 'lucide-react';
import { transactionService, RecurringTransaction } from '../services/transactionService';
import { toast } from 'react-hot-toast';

const RecurringTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<RecurringTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRecurringTransactions();
  }, []);

  const loadRecurringTransactions = async () => {
    try {
      setIsLoading(true);
      const data = await transactionService.getRecurringTransactions();
      setTransactions(data);
    } catch (error) {
      console.error('Erro ao carregar transações recorrentes:', error);
      toast.error('Erro ao carregar transações recorrentes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndRecurring = async (transactionId: string) => {
    if (!confirm('Deseja encerrar esta transação recorrente? As próximas ocorrências não serão mais geradas.')) {
      return;
    }

    try {
      await transactionService.updateRecurringTransaction(transactionId, {
        end_date: new Date().toISOString().split('T')[0]
      });
      toast.success('Transação recorrente encerrada com sucesso!');
      loadRecurringTransactions();
    } catch (error) {
      console.error('Erro ao encerrar transação recorrente:', error);
      toast.error('Erro ao encerrar transação recorrente');
    }
  };

  const formatFrequency = (transaction: RecurringTransaction) => {
    const frequencyMap = {
      daily: 'Diária',
      weekly: 'Semanal',
      monthly: 'Mensal',
      yearly: 'Anual'
    };

    const base = frequencyMap[transaction.frequency];
    if (transaction.interval === 1) return base;
    return `${base} (a cada ${transaction.interval} ${
      transaction.frequency === 'daily' ? 'dias' :
      transaction.frequency === 'weekly' ? 'semanas' :
      transaction.frequency === 'monthly' ? 'meses' : 'anos'
    })`;
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-500" />
          <h2 className="text-xl font-semibold">Transações Recorrentes</h2>
        </div>
        <div className="text-sm text-gray-500">
          Total: {transactions.length} transação(ões)
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma transação recorrente encontrada</p>
          <p className="text-sm mt-2">
            Crie uma nova transação e marque como recorrente para aparecer aqui
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2">
                    {transaction.type === 'income' ? (
                      <ArrowUpCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <ArrowDownCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    )}
                    <h3 className="font-medium">{transaction.description}</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-gray-400" />
                      <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                        R$ {transaction.amount.toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{formatFrequency(transaction)}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-gray-400" />
                      <span>{transaction.category?.name || 'Sem categoria'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>
                        Início: {format(new Date(transaction.start_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </div>
                  </div>

                  {transaction.end_date && (
                    <div className="flex items-center gap-2 text-sm text-orange-500">
                      <Ban className="h-4 w-4" />
                      <span>
                        Encerra em {format(new Date(transaction.end_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </div>
                  )}
                </div>

                {!transaction.end_date && (
                  <button
                    onClick={() => handleEndRecurring(transaction.id)}
                    className="ml-4 p-2 text-red-500 hover:text-red-700 transition-colors"
                    title="Encerrar transação recorrente"
                  >
                    <Ban className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecurringTransactions; 