import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Navigation: React.FC = () => {
  const location = useLocation();
  const { signOut, user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-gray-800">
                Sistema Financeiro
              </span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
              <Link
                to="/dashboard"
                className={`inline-flex items-center px-4 py-2 text-sm font-medium ${
                  isActive('/dashboard')
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <LayoutDashboard className="h-5 w-5 mr-2" />
                Dashboard
              </Link>
              <Link
                to="/transactions"
                className={`inline-flex items-center px-4 py-2 text-sm font-medium ${
                  isActive('/transactions')
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <PlusCircle className="h-5 w-5 mr-2" />
                Lançamentos
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-4">{user?.email}</span>
            <button
              onClick={() => signOut()}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Sair
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 