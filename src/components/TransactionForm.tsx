import React, { useState, useEffect } from 'react';
import { 
  Calendar,
  CreditCard,
  DollarSign,
  FileText,
  RefreshCw,
  Tag,
  Wallet
} from 'lucide-react';
import { format } from 'date-fns';
import { transactionService, Category, Transaction } from '../services/transactionService';
import AccountSelector from './AccountSelector';
import { toast } from 'react-hot-toast';

interface TransactionFormProps {
  onSubmit: (data: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => void;
}

interface FormData {
  description: string;
  amount: string;
  type: 'income' | 'expense';
  category: string;
  date: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  end_date: string;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onSubmit }) => {
  const [isRecurring, setIsRecurring] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({
    description: '',
    amount: '',
    type: 'expense',
    category: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    frequency: 'monthly',
    interval: 1,
    end_date: ''
  });

  useEffect(() => {
    loadCategories(formData.type as 'income' | 'expense');
  }, [formData.type]);

  const loadCategories = async (type: 'income' | 'expense') => {
    try {
      const data = await transactionService.getCategories(type);
      setCategories(data);
      // Reset category selection when type changes
      setFormData(prev => ({ ...prev, category: '' }));
      setNewCategory('');
      setIsNewCategory(false);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!selectedAccountId) {
        toast.error('Selecione uma carteira');
        return;
      }

      console.log('Submetendo formulário:', { formData, isRecurring });

      const transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'> = {
        description: formData.description,
        amount: Number(formData.amount),
        type: formData.type,
        category: isNewCategory ? newCategory : formData.category,
        date: formData.date,
        account_id: selectedAccountId
      };

      if (isRecurring) {
        await transactionService.createTransaction(transaction, {
          frequency: formData.frequency,
          interval: formData.interval,
          end_date: formData.end_date || undefined
        });
      } else {
        await transactionService.createTransaction(transaction);
      }

      onSubmit(transaction);
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      toast.error('Erro ao criar transação');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('recurrence.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        recurrence: {
          ...prev.recurrence,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6">Nova Transação</h2>
      
      <div className="space-y-4">
        {/* Carteira */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Carteira
            </div>
          </label>
          <AccountSelector
            onSelect={setSelectedAccountId}
            selectedAccountId={selectedAccountId}
          />
        </div>

        {/* Descrição */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Descrição
            </div>
          </label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Valor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valor
            </div>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">R$</span>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="0.01"
              required
            />
          </div>
        </div>

        {/* Tipo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Tipo
            </div>
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="expense">Despesa</option>
            <option value="income">Receita</option>
          </select>
        </div>

        {/* Categoria */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Categoria
            </div>
          </label>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="newCategory"
                checked={isNewCategory}
                onChange={(e) => setIsNewCategory(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="newCategory" className="text-sm text-gray-600">
                Nova categoria
              </label>
            </div>
            
            {isNewCategory ? (
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Digite o nome da nova categoria"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            ) : (
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Selecione uma categoria</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Data */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Data
            </div>
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Transação Recorrente */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isRecurring"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isRecurring" className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <RefreshCw className="h-4 w-4" />
            Transação Recorrente
          </label>
        </div>

        {/* Campos de Recorrência */}
        {isRecurring && (
          <div className="space-y-4 pl-6 border-l-2 border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequência
              </label>
              <select
                name="frequency"
                value={formData.frequency}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Diária</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
                <option value="yearly">Anual</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Intervalo
              </label>
              <input
                type="number"
                name="interval"
                value={formData.interval}
                onChange={handleChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Final (opcional)
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}
      </div>

      <button
        type="submit"
        className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        Salvar Transação
      </button>
    </form>
  );
};

export default TransactionForm;