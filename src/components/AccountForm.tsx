import React, { useState } from 'react';
import { Wallet } from 'lucide-react';
import { accountService } from '../services/accountService';
import { toast } from 'react-hot-toast';

interface AccountFormProps {
  onSubmit: () => void;
}

const AccountForm: React.FC<AccountFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'checking' as const,
    balance: '0'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await accountService.createAccount({
        name: formData.name,
        type: formData.type,
        balance: Number(formData.balance)
      });
      
      toast.success('Conta criada com sucesso!');
      onSubmit();
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      toast.error('Erro ao criar conta');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-6">Nova Conta</h2>
      
      <div className="space-y-4">
        {/* Nome da Conta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Nome da Conta
            </div>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Tipo de Conta */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Conta
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="checking">Conta Corrente</option>
            <option value="savings">Conta Poupança</option>
            <option value="investment">Conta Investimento</option>
          </select>
        </div>

        {/* Saldo Inicial */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Saldo Inicial
          </label>
          <input
            type="number"
            name="balance"
            value={formData.balance}
            onChange={handleChange}
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <button
        type="submit"
        className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        Criar Conta
      </button>
    </form>
  );
};

export default AccountForm; 