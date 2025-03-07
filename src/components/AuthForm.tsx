import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Loader2, Mail, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export function AuthForm() {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showVerificationInstructions, setShowVerificationInstructions] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { user } = await signUp(formData.email, formData.password);
        if (user) {
          setShowVerificationInstructions(true);
          toast.success('Conta criada com sucesso!');
        }
      } else {
        await signIn(formData.email, formData.password);
        toast.success('Login realizado com sucesso!');
      }
    } catch (error: unknown) {
      console.error('Auth error:', error);
      if (error instanceof Error) {
        if (error.message.includes('Email not confirmed')) {
          toast.error('Por favor, verifique seu email para confirmar sua conta antes de fazer login.');
        } else if (error.message.includes('Invalid login credentials')) {
          toast.error('Email ou senha incorretos.');
        } else {
          toast.error(isSignUp ? 'Erro ao criar conta' : 'Erro ao fazer login');
        }
      } else {
        toast.error('Ocorreu um erro inesperado');
      }
    } finally {
      setLoading(false);
    }
  };

  if (showVerificationInstructions) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <div className="text-center mb-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800">Conta Criada com Sucesso!</h2>
            <p className="text-gray-600 mt-2">Agora precisamos confirmar seu email</p>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg mb-6">
            <div className="flex items-start mb-4">
              <Mail className="h-6 w-6 text-blue-500 mt-1 mr-3" />
              <div>
                <h3 className="font-semibold text-blue-800">Verifique seu email</h3>
                <p className="text-blue-700 mt-1">
                  Enviamos um link de confirmação para:
                  <span className="block font-medium mt-1">{formData.email}</span>
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-blue-700">
              <p>Para ativar sua conta:</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Abra seu email</li>
                <li>Procure por um email do nosso sistema</li>
                <li>Clique no link de confirmação</li>
                <li>Volte para o app e faça login</li>
              </ol>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => setShowVerificationInstructions(false)}
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              Voltar para o login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">
          {isSignUp ? 'Criar Conta' : 'Entrar'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Senha
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              isSignUp ? 'Criar Conta' : 'Entrar'
            )}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            {isSignUp
              ? 'Já tem uma conta? Entre aqui'
              : 'Não tem uma conta? Cadastre-se'}
          </button>
        </div>
      </div>
    </div>
  );
}