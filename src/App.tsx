import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { useAuth } from './hooks/useAuth';
import { useSidebar } from './contexts/SidebarContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import AccountManager from './components/AccountManager';
import { AuthForm } from './components/AuthForm';
import { transactionService, Transaction } from './services/transactionService';
import RecurringTransactions from './components/RecurringTransactions';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function AppContent() {
  const { user } = useAuth();
  const { isExpanded } = useSidebar();

  if (!user) {
    return <AuthForm />;
  }

  const handleTransactionSubmit = async (data: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => {
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
      <Sidebar />
      <main 
        className={`
          transition-all duration-300 ease-in-out
          ${isExpanded ? 'ml-64' : 'ml-20'}
        `}
      >
        <div className="max-w-7xl mx-auto py-6 px-4">
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
            <Route
              path="/accounts"
              element={
                <PrivateRoute>
                  <AccountManager />
                </PrivateRoute>
              }
            />
            <Route
              path="/recurring"
              element={
                <PrivateRoute>
                  <RecurringTransactions />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <SidebarProvider>
          <AppContent />
        </SidebarProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;