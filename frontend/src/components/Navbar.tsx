import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MessageSquare, Bell, User, Settings, Home, LogOut } from 'lucide-react';
import { authService } from '@/utils/api';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = authService.isAdmin();

  const handleLogout = () => {
    authService.logout();
    navigate('/auth');
  };

  const adminNavItems = [
    {
      label: "Tableau de Bord",
      icon: Home,
      href: "/admin",
      emoji: "📊"
    },
    {
      label: "Mon Profil",
      icon: User,
      href: "/profile",
      emoji: "👤"
    }
  ];

  const userNavItems = [
   
    {
      label: "Chat",
      icon: MessageSquare,
      href: "/chat",
      emoji: "💬"
    },
    {
      label: "Annonces",
      icon: Bell,
      href: "/announcements",
      emoji: "📢"
    },
    {
      label: "Mon Profil",
      icon: User,
      href: "/profile",
      emoji: "👤"
    }
  ];

  const navItems = isAdmin ? adminNavItems : userNavItems;

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-200/20 shadow-lg">
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 to-orange-50/30 pointer-events-none" />
      
      <div className="relative container mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link 
              to="/" 
              className="group flex items-center space-x-3 hover:scale-105 transition-transform duration-300"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-orange-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative p-3 bg-gradient-to-r from-blue-500 to-orange-500 rounded-2xl shadow-xl group-hover:shadow-2xl transition-shadow duration-300">
                  <Settings className="w-7 h-7 text-white transform group-hover:rotate-90 transition-transform duration-500" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-orange-500 bg-clip-text text-transparent">
                  FSTS
                </span>
                <span className="text-xs text-gray-500 font-medium">
                  Système de Gestion
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-2">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`group relative flex items-center space-x-3 px-5 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500 to-orange-500 text-white shadow-lg shadow-blue-500/25'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/80 hover:shadow-md'
                  }`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-orange-500 rounded-xl opacity-20 animate-pulse" />
                  )}
                  
                  {/* Icon with animation */}
                  <div className="relative">
                    <Icon className={`w-5 h-5 transition-transform duration-300 ${
                      isActive ? 'scale-110' : 'group-hover:scale-110'
                    }`} />
                  </div>
                  
                  {/* Label */}
                  <span className={`font-medium transition-all duration-300 ${
                    isActive ? 'font-semibold' : 'group-hover:font-semibold'
                  }`}>
                    {item.label}
                  </span>
                  
                  {/* Emoji with bounce effect */}
                  <span className={`text-lg transition-transform duration-300 ${
                    isActive ? 'animate-bounce' : 'group-hover:animate-bounce'
                  }`}>
                    {item.emoji}
                  </span>
                  
                  {/* Hover effect background */}
                  {!isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-orange-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  )}
                </Link>
              );
            })}

            {/* Divider */}
            <div className="w-px h-8 bg-gradient-to-b from-transparent via-gray-300 to-transparent mx-2" />

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="group relative flex items-center space-x-3 px-5 py-3 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50/80 transition-all duration-300 transform hover:scale-105 hover:shadow-md"
            >
              <div className="relative">
                <LogOut className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-hover:-translate-x-1" />
              </div>
              <span className="font-medium transition-all duration-300 group-hover:font-semibold">
                Déconnexion
              </span>
              <span className="text-lg transition-transform duration-300 group-hover:animate-pulse">
                🚪
              </span>
              
              {/* Hover effect background */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-red-600/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Bottom border gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
    </nav>
  );
};

export default Navbar;