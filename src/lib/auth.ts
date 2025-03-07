import { supabase } from './supabase';
import { User } from '@supabase/supabase-js';

export const auth = {
  async signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin
      }
    });

    if (error) {
      console.error('Erro no signUp:', error);
      throw new Error(error.message);
    }

    // Verifica se o usuário foi criado na tabela users
    if (data.user) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (userError) {
        console.error('Erro ao verificar usuário:', userError);
        // Não lançamos o erro aqui, pois o usuário já foi criado no auth
      }
    }

    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Erro no signIn:', error);
      throw new Error(error.message);
    }

    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Erro no signOut:', error);
      throw new Error(error.message);
    }
  },

  async getCurrentUser(): Promise<User | null> {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Erro ao obter usuário:', error);
      throw new Error(error.message);
    }
    return user;
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      callback(session?.user ?? null);
    });
  }
};