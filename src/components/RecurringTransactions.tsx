import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Wallet, Tag, ArrowUpCircle, ArrowDownCircle, Clock, Ban } from 'lucide-react';
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
      // Define a data de término como hoje
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
        <Clock className="h-5 w-5 text-blue-500" />
        <h2 className="text-xl font-semibold">Transações Recorrentes</h2>
      </div>

      <div className="space-y-4">
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            Nenhuma transação recorrente encontrada
          </p>
        ) : (
          transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {transaction.type === 'income' ? (
                      <ArrowUpCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <ArrowDownCircle className="h-5 w-5 text-red-500" />
                    )}
                    <h3 className="font-medium">{transaction.description}</h3>
                  </div>
                  
                  <div className="mt-2 space-y-1 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Wallet className="h-4 w-4" />
                      <span>R$ {transaction.amount.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {transaction.frequency === 'monthly' ? 'Mensal' : 'Semanal'} 
                        {transaction.interval > 1 ? ` (a cada ${transaction.interval} ${transaction.frequency === 'monthly' ? 'meses' : 'semanas'})` : ''}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Tag className="h-4 w-4" />
                      <span>{transaction.category?.name || 'Sem categoria'}</span>
                    </div>

                    {transaction.end_date && (
                      <div className="flex items-center gap-1 text-orange-500">
                        <Ban className="h-4 w-4" />
                        <span>
                          Encerra em {format(new Date(transaction.end_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {!transaction.end_date && (
                  <button
                    onClick={() => handleEndRecurring(transaction.id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                    title="Encerrar transação recorrente"
                  >
                    <Ban className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecurringTransactions; 