import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Wallet, 
  ChevronLeft,
  ChevronRight,
  LogOut,
  Clock
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useSidebar } from '../contexts/SidebarContext';

const Sidebar: React.FC = () => {
  const { isExpanded, toggleSidebar } = useSidebar();
  const location = useLocation();
  const { signOut, user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div 
      className={`
        bg-white shadow-lg h-screen fixed left-0 top-0 z-30
        transition-all duration-300 ease-in-out
        ${isExpanded ? 'w-64' : 'w-20'}
      `}
    >
      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-9 bg-white rounded-full p-1 shadow-md"
      >
        {isExpanded ? (
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-600" />
        )}
      </button>

      {/* Logo */}
      <div className="p-4 border-b">
        {isExpanded ? (
          <span className="text-xl font-bold text-gray-800">
            Sistema Financeiro
          </span>
        ) : (
          <span className="text-xl font-bold text-gray-800">SF</span>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="p-4">
        <ul className="space-y-2">
          <li>
            <Link
              to="/dashboard"
              className={`
                flex items-center p-3 rounded-lg transition-colors
                ${isActive('/dashboard')
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'}
              `}
            >
              <LayoutDashboard className="h-5 w-5" />
              {isExpanded && <span className="ml-3">Dashboard</span>}
            </Link>
          </li>
          <li>
            <Link
              to="/transactions"
              className={`
                flex items-center p-3 rounded-lg transition-colors
                ${isActive('/transactions')
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'}
              `}
            >
              <PlusCircle className="h-5 w-5" />
              {isExpanded && <span className="ml-3">Lançamentos</span>}
            </Link>
          </li>
          <li>
            <Link
              to="/accounts"
              className={`
                flex items-center p-3 rounded-lg transition-colors
                ${isActive('/accounts')
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'}
              `}
            >
              <Wallet className="h-5 w-5" />
              {isExpanded && <span className="ml-3">Carteiras</span>}
            </Link>
          </li>
          <li>
            <Link
              to="/recurring"
              className={`
                flex items-center p-3 rounded-lg transition-colors
                ${isActive('/recurring')
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'}
              `}
            >
              <Clock className="h-5 w-5" />
              {isExpanded && <span className="ml-3">Recorrentes</span>}
            </Link>
          </li>
        </ul>
      </nav>

      {/* User Info and Logout */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
        {isExpanded && (
          <div className="text-sm text-gray-500 mb-2 truncate">
            {user?.email}
          </div>
        )}
        <button
          onClick={() => signOut()}
          className={`
            flex items-center w-full p-3 rounded-lg
            text-gray-600 hover:bg-gray-50 transition-colors
          `}
        >
          <LogOut className="h-5 w-5" />
          {isExpanded && <span className="ml-3">Sair</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 