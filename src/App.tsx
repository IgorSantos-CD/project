import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import { AuthForm } from './components/AuthForm';
import { transactionService, Transaction } from './services/transactionService';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function AppContent() {
  const { user } = useAuth();

  if (!user) {
    return <AuthForm />;
  }

  const handleTransactionSubmit = async (data: Transaction) => {
    try {
      await transactionService.createTransaction(data);
      // Redirecionar para o dashboard após criar a transação
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Erro ao criar transação:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 px-4">
        <Routes>
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <PrivateRoute>
                <TransactionForm onSubmit={handleTransactionSubmit} />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;