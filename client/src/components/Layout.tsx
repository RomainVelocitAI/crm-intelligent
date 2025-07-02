import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  BarChart3, 
  LogOut, 
  Menu, 
  X, 
  Settings,
  Bell,
  User,
  Crown,
  Archive
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import OnboardingFlow from './onboarding/OnboardingFlow';
import TutorialHeaderButton from './TutorialHeaderButton';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuthStore();
  

  const navigation = [
    { name: 'Contacts', href: '/contacts', icon: Users, count: null },
    { name: 'Opportunités', href: '/opportunites', icon: FileText, count: null },
    { name: 'Métriques', href: '/metriques', icon: BarChart3, count: null },
    { name: 'Archives', href: '/archives', icon: Archive, count: null },
  ];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar mobile */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ${
          sidebarOpen ? 'opacity-100' : 'opacity-0'
        }`} onClick={() => setSidebarOpen(false)} />
        
        <div className={`fixed inset-y-0 left-0 w-80 bg-white shadow-xl transform transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">V</span>
              </div>
              <span className="text-xl font-bold text-gray-900">VelocitaLeads</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <nav className="px-6 py-6">
            <div className="space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span>{item.name}</span>
                    {item.count && (
                      <span className="ml-auto bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                        {item.count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>

      {/* Sidebar desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-80 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">V</span>
              </div>
              <span className="text-xl font-bold text-gray-900">VelocitaLeads</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-6 py-6" data-tour="navigation">
            <div className="space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                const tourAttr = item.name === 'Contacts' ? 'contacts-tab' : 
                                item.name === 'Opportunités' ? 'quotes-tab' : 
                                item.name === 'Métriques' ? 'metrics-tab' : undefined;
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    data-tour={tourAttr}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span>{item.name}</span>
                    {item.count && (
                      <span className="ml-auto bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                        {item.count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User section */}
          <div className="px-6 py-4 border-t border-gray-200" data-tour="user-menu">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.prenom} {user?.nom}
                </p>
                <div className="flex items-center space-x-2">
                  <p className="text-xs text-gray-500 truncate">{user?.entreprise}</p>
                  {user?.isPremium && (
                    <Crown className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <TutorialHeaderButton />
              <button className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                <Settings className="w-4 h-4 mr-1" />
                Paramètres
              </button>
            </div>
            <button 
              onClick={handleLogout}
              className="mt-2 w-full flex items-center justify-center px-3 py-2 border border-red-300 bg-red-50 rounded-md text-sm font-medium text-red-700 hover:bg-red-100"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      {/* Header mobile */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-700"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">V</span>
            </div>
            <span className="text-lg font-bold text-gray-900">VelocitaLeads</span>
          </div>

          <div className="flex items-center space-x-3">
            <button className="text-gray-400 hover:text-gray-600">
              <Bell className="w-6 h-6" />
            </button>
            <button 
              onClick={handleLogout}
              className="text-gray-400 hover:text-gray-600"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-80">
        <main className="flex-1">
          {/* Header desktop */}
          <div className="hidden lg:flex items-center justify-between h-16 px-8 bg-white border-b border-gray-200">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="text-gray-400 hover:text-gray-600">
                <Bell className="w-6 h-6" />
              </button>
              
              {/* Bouton Tutorial intégré */}
              <TutorialHeaderButton />
              
              <div className="h-6 w-px bg-gray-300" />
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.prenom} {user?.nom}
                  </p>
                  <div className="flex items-center justify-end space-x-1">
                    <p className="text-xs text-gray-500">{user?.entreprise}</p>
                    {user?.isPremium && (
                      <Crown className="w-3 h-3 text-yellow-500" />
                    )}
                  </div>
                </div>
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Page content */}
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* Système d'onboarding et tutoriel */}
      <OnboardingFlow />
    </div>
  );
}