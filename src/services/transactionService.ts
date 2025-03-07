import { supabase } from '../lib/supabase';
import { addMonths, addWeeks, addDays, addYears, parseISO, isBefore, format } from 'date-fns';

export interface Transaction {
  id?: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  recurring_transaction_id?: string;
}

export interface RecurringTransaction {
  id?: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category_id: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  start_date: string;
  end_date?: string;
  last_generated_date?: string;
  user_id: string;
  account_id: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
}

export const transactionService = {
  async getCategories(type?: 'income' | 'expense') {
    try {
      let query = supabase.from('categories').select('*');
      
      if (type) {
        query = query.eq('type', type);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      throw error;
    }
  },

  async findOrCreateCategory(name: string, type: 'income' | 'expense'): Promise<string> {
    try {
      // First, try to find an existing category
      const { data: existingCategories, error: searchError } = await supabase
        .from('categories')
        .select('*')
        .eq('name', name)
        .eq('type', type);

      if (searchError) throw searchError;

      // If category exists, return its ID
      if (existingCategories && existingCategories.length > 0) {
        return existingCategories[0].id;
      }

      // Get the current user's ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      if (!user) {
        throw new Error('User must be authenticated to create categories');
      }

      // If category doesn't exist, create it with user_id
      const { data: newCategory, error: createError } = await supabase
        .from('categories')
        .insert({
          name,
          type,
          user_id: user.id
        })
        .select()
        .single();

      if (createError) throw createError;

      return newCategory.id;
    } catch (error) {
      console.error('Erro ao buscar ou criar categoria:', error);
      throw error;
    }
  },

  async createTransaction(transaction: Transaction, recurring?: { frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'; interval: number; end_date?: string }) {
    try {
      console.log('Iniciando criação de transação:', { transaction, recurring });

      if (recurring) {
        console.log('Criando transação recorrente');
        return this.createRecurringTransaction(transaction, {
          ...recurring,
          description: transaction.description,
          amount: transaction.amount,
          type: transaction.type,
          category_id: transaction.category,
          start_date: transaction.date,
          user_id: '', // Será preenchido dentro do método
          account_id: '' // Será preenchido dentro do método
        });
      }

      // Get the current user's ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User must be authenticated to create transactions');

      // Get the user's default account (or first account)
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (accountsError) throw accountsError;
      if (!accounts || accounts.length === 0) {
        throw new Error('User must have at least one account to create transactions');
      }

      const accountId = accounts[0].id;

      // If category is not a UUID, treat it as a category name and find/create it
      let categoryId = transaction.category;
      if (!transaction.category.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        categoryId = await this.findOrCreateCategory(transaction.category, transaction.type);
      }

      // Cria a transação
      const { data, error } = await supabase
        .from('transactions')
        .insert({
          description: transaction.description,
          amount: transaction.amount,
          type: transaction.type,
          category_id: categoryId,
          date: transaction.date,
          user_id: user.id,
          account_id: accountId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      throw error;
    }
  },

  async getTransactions() {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          categories (
            id,
            name,
            type
          )
        `)
        .order('date', { ascending: false });

      if (error) throw error;
      
      return data.map(transaction => ({
        ...transaction,
        category: transaction.categories.name // Mapeia o nome da categoria para exibição
      }));
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      throw error;
    }
  },

  async getRecurringTransactions() {
    try {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .select(`
          *,
          categories (
            id,
            name,
            type
          )
        `);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar transações recorrentes:', error);
      throw error;
    }
  },

  async deleteTransaction(id: string) {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      throw error;
    }
  },

  async deleteMultipleTransactions(ids: string[]) {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .in('id', ids);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao excluir transações:', error);
      throw error;
    }
  },

  async generateRecurringTransactions() {
    try {
      // Buscar todas as transações recorrentes ativas
      const { data: recurringTransactions, error: fetchError } = await supabase
        .from('recurring_transactions')
        .select('*')
        .is('end_date', null);

      if (fetchError) throw fetchError;
      if (!recurringTransactions) return;

      for (const recurring of recurringTransactions) {
        await this.generateTransactionsForRecurring(recurring);
      }
    } catch (error) {
      console.error('Erro ao gerar transações recorrentes:', error);
      throw error;
    }
  },

  async generateTransactionsForRecurring(recurring: RecurringTransaction) {
    try {
      // Converter a data inicial para objeto Date
      const startDate = parseISO(recurring.start_date);
      const endDate = recurring.end_date ? parseISO(recurring.end_date) : null;

      // Função para calcular a próxima data baseada na frequência
      const getNextDate = (currentDate: Date) => {
        switch (recurring.frequency) {
          case 'daily':
            return addDays(currentDate, recurring.interval);
          case 'weekly':
            return addWeeks(currentDate, recurring.interval);
          case 'monthly':
            return addMonths(currentDate, recurring.interval);
          case 'yearly':
            return addYears(currentDate, recurring.interval);
          default:
            return addMonths(currentDate, recurring.interval);
        }
      };

      // Criar a primeira transação se não existir
      const { data: existingInitialTransaction } = await supabase
        .from('transactions')
        .select('id')
        .eq('recurring_transaction_id', recurring.id)
        .eq('date', format(startDate, 'yyyy-MM-dd'))
        .single();

      if (!existingInitialTransaction) {
        const { error: createError } = await supabase
          .from('transactions')
          .insert({
            description: recurring.description,
            amount: recurring.amount,
            type: recurring.type,
            category_id: recurring.category_id,
            date: format(startDate, 'yyyy-MM-dd'),
            recurring_transaction_id: recurring.id,
            user_id: recurring.user_id,
            account_id: recurring.account_id
          });

        if (createError) throw createError;
      }

      // Gerar todas as transações futuras
      let currentDate = startDate;
      let lastGeneratedDate = startDate;

      while (true) {
        // Calcular a próxima data
        currentDate = getNextDate(currentDate);

        // Verificar se atingiu a data final
        if (endDate && isBefore(endDate, currentDate)) {
          break;
        }

        // Verificar se já existe uma transação para esta data
        const { data: existingTransaction } = await supabase
          .from('transactions')
          .select('id')
          .eq('recurring_transaction_id', recurring.id)
          .eq('date', format(currentDate, 'yyyy-MM-dd'))
          .single();

        // Se não existir transação para esta data, criar uma
        if (!existingTransaction) {
          const { error: createError } = await supabase
            .from('transactions')
            .insert({
              description: recurring.description,
              amount: recurring.amount,
              type: recurring.type,
              category_id: recurring.category_id,
              date: format(currentDate, 'yyyy-MM-dd'),
              recurring_transaction_id: recurring.id,
              user_id: recurring.user_id,
              account_id: recurring.account_id
            });

          if (createError) throw createError;
        }

        lastGeneratedDate = currentDate;
      }

      // Atualizar a última data gerada
      const { error: updateError } = await supabase
        .from('recurring_transactions')
        .update({ last_generated_date: format(lastGeneratedDate, 'yyyy-MM-dd') })
        .eq('id', recurring.id);

      if (updateError) throw updateError;

      console.log('Transações recorrentes geradas com sucesso:', {
        startDate: format(startDate, 'yyyy-MM-dd'),
        lastGeneratedDate: format(lastGeneratedDate, 'yyyy-MM-dd'),
        frequency: recurring.frequency,
        interval: recurring.interval,
        endDate: endDate ? format(endDate, 'yyyy-MM-dd') : 'Sem data final'
      });
    } catch (error) {
      console.error('Erro ao gerar transações para recorrência:', error);
      throw error;
    }
  },

  async createRecurringTransaction(transaction: Transaction, recurring: RecurringTransaction) {
    try {
      console.log('Iniciando criação de transação recorrente:', { transaction, recurring });

      // Get the current user's ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User must be authenticated to create transactions');

      // Get the user's default account (or first account)
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (accountsError) throw accountsError;
      if (!accounts || accounts.length === 0) {
        throw new Error('User must have at least one account to create transactions');
      }

      const accountId = accounts[0].id;

      // If category is not a UUID, treat it as a category name and find/create it
      let categoryId = transaction.category;
      if (!transaction.category.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        categoryId = await this.findOrCreateCategory(transaction.category, transaction.type);
      }

      // Criar a transação recorrente
      const { data: recurringData, error: recurringError } = await supabase
        .from('recurring_transactions')
        .insert({
          description: transaction.description,
          amount: transaction.amount,
          type: transaction.type,
          category_id: categoryId,
          frequency: recurring.frequency,
          interval: recurring.interval,
          start_date: transaction.date,
          end_date: recurring.end_date,
          user_id: user.id,
          account_id: accountId
        })
        .select()
        .single();

      if (recurringError) throw recurringError;
      console.log('Transação recorrente criada:', recurringData);

      // Gerar todas as transações
      const startDate = parseISO(transaction.date);
      const endDate = recurring.end_date ? parseISO(recurring.end_date) : null;

      console.log('Datas de geração:', {
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: endDate ? format(endDate, 'yyyy-MM-dd') : 'Sem data final'
      });

      // Função para calcular a próxima data baseada na frequência
      const getNextDate = (currentDate: Date) => {
        switch (recurring.frequency) {
          case 'daily':
            return addDays(currentDate, recurring.interval);
          case 'weekly':
            return addWeeks(currentDate, recurring.interval);
          case 'monthly':
            return addMonths(currentDate, recurring.interval);
          case 'yearly':
            return addYears(currentDate, recurring.interval);
          default:
            return addMonths(currentDate, recurring.interval);
        }
      };

      // Criar todas as transações
      let currentDate = startDate;
      let lastGeneratedDate = startDate;
      let transactionCount = 0;

      // Criar a primeira transação
      const { error: firstTransactionError } = await supabase
        .from('transactions')
        .insert({
          description: transaction.description,
          amount: transaction.amount,
          type: transaction.type,
          category_id: categoryId,
          date: format(startDate, 'yyyy-MM-dd'),
          recurring_transaction_id: recurringData.id,
          user_id: user.id,
          account_id: accountId
        });

      if (firstTransactionError) throw firstTransactionError;
      transactionCount++;

      // Gerar as próximas transações
      while (true) {
        currentDate = getNextDate(currentDate);

        // Verificar se atingiu a data final
        if (endDate && isBefore(endDate, currentDate)) {
          break;
        }

        // Criar a transação
        const { error: createError } = await supabase
          .from('transactions')
          .insert({
            description: transaction.description,
            amount: transaction.amount,
            type: transaction.type,
            category_id: categoryId,
            date: format(currentDate, 'yyyy-MM-dd'),
            recurring_transaction_id: recurringData.id,
            user_id: user.id,
            account_id: accountId
          });

        if (createError) throw createError;
        transactionCount++;
        lastGeneratedDate = currentDate;
      }

      // Atualizar a última data gerada
      const { error: updateError } = await supabase
        .from('recurring_transactions')
        .update({ last_generated_date: format(lastGeneratedDate, 'yyyy-MM-dd') })
        .eq('id', recurringData.id);

      if (updateError) throw updateError;

      console.log('Transação recorrente criada com sucesso:', {
        recurringId: recurringData.id,
        startDate: format(startDate, 'yyyy-MM-dd'),
        lastGeneratedDate: format(lastGeneratedDate, 'yyyy-MM-dd'),
        frequency: recurring.frequency,
        interval: recurring.interval,
        endDate: endDate ? format(endDate, 'yyyy-MM-dd') : 'Sem data final',
        totalTransactions: transactionCount
      });

      return { recurring: recurringData };
    } catch (error) {
      console.error('Erro ao criar transação recorrente:', error);
      throw error;
    }
  }
};