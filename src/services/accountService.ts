import { supabase } from '../lib/supabase';

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'investment';
  balance: number;
  user_id: string;
}

export const accountService = {
  async createAccount(account: Omit<Account, 'id' | 'user_id'>) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User must be authenticated to create accounts');

      const { data, error } = await supabase
        .from('accounts')
        .insert({
          ...account,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      throw error;
    }
  },

  async getAccounts() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User must be authenticated to get accounts');

      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar contas:', error);
      throw error;
    }
  },

  async updateAccountBalance(accountId: string, newBalance: number) {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .update({ balance: newBalance })
        .eq('id', accountId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar saldo da conta:', error);
      throw error;
    }
  }
}; 