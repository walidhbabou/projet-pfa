import React, { useState, useEffect } from 'react';
import { Megaphone, Info, AlertTriangle, CheckCircle, XCircle, Calendar, Clock, Filter, Search } from "lucide-react";
import { announcementService } from '@/utils/api';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  created_at: string;
}

const Announcements = () => {
  const [loading, setLoading] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    const fetchAndFilterAnnouncements = async () => {
      setLoading(true);
      try {
        const response = await announcementService.getAllAnnouncements();
        const fetchedAnnouncements = response.data.map((ann: Announcement) => ({
          ...ann,
          created_at: ann.created_at || new Date().toISOString() // Use created_at directly as per interface
        }));
        setAnnouncements(fetchedAnnouncements);
        
        let filtered = fetchedAnnouncements;

        // Filter by search term
        if (searchTerm) {
          filtered = filtered.filter(announcement =>
            announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            announcement.content.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }

        // Filter by type
        if (filterType !== 'all') {
          filtered = filtered.filter(announcement => announcement.type === filterType);
        }

        // Sort by date (newest first)
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setFilteredAnnouncements(filtered);
      } catch (error) {
        console.error('Error fetching announcements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAndFilterAnnouncements();
  }, [searchTerm, filterType]);

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'info':
        return {
          icon: <Info className="w-6 h-6" />,
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200',
          accentColor: 'bg-blue-600'
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-6 h-6" />,
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200',
          accentColor: 'bg-yellow-600'
        };
      case 'success':
        return {
          icon: <CheckCircle className="w-6 h-6" />,
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-200',
          accentColor: 'bg-green-600'
        };
      case 'error':
        return {
          icon: <XCircle className="w-6 h-6" />,
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-200',
          accentColor: 'bg-red-600'
        };
      default:
        return {
          icon: <Info className="w-6 h-6" />,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200',
          accentColor: 'bg-gray-600'
        };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Aujourd\'hui';
    if (diffDays === 2) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays - 1} jours`;
    
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'info': return 'Information';
      case 'warning': return 'Avertissement';
      case 'success': return 'Succès';
      case 'error': return 'Important';
      default: return 'Information';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-orange-400 rounded-full animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          ></div>
        ))}
      </div>

      <div className="relative z-10 min-h-screen p-4 sm:p-8">
        {/* Header */}
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 animate-fade-in-up">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-orange-400 rounded-full blur-md opacity-60 animate-pulse"></div>
                <div className="relative bg-white p-4 rounded-full shadow-xl">
                  <Megaphone className="w-10 h-10 text-blue-600" />
                </div>
              </div>
            </div>            
            <div className="h-1 w-32 bg-gradient-to-r from-blue-500 to-orange-500 mx-auto rounded-full mt-4"></div>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher dans les annonces..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/80"
                />
              </div>
              
              {/* Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="text-gray-500 w-5 h-5" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/80"
                >
                  <option value="all">Tous les types</option>
                  <option value="info">Informations</option>
                  <option value="warning">Avertissements</option>
                  <option value="success">Succès</option>
                  <option value="error">Important</option>
                </select>
              </div>
            </div>
          </div>

          {/* Announcements Grid */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredAnnouncements.map((announcement, index) => {
                const typeConfig = getTypeConfig(announcement.type);
                return (
                  <div
                    key={announcement._id}
                    className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden group hover:-translate-y-1 animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {/* Card Header */}
                    <div className={`h-2 ${typeConfig.accentColor}`}></div>
                    
                    <div className="p-6">
                      {/* Type Badge */}
                      <div className="flex items-center justify-between mb-4">
                        <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-semibold ${typeConfig.bgColor} ${typeConfig.textColor} ${typeConfig.borderColor} border`}>
                          {typeConfig.icon}
                          <span>{getTypeLabel(announcement.type)}</span>
                        </div>
                        
                        <div className="flex items-center text-gray-500 text-sm">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>{formatDate(announcement.created_at)}</span>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                        {announcement.title}
                      </h3>

                      {/* Content */}
                      <p className="text-gray-600 leading-relaxed mb-4 line-clamp-4">
                        {announcement.content}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center text-gray-400 text-sm">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>{new Date(announcement.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-100 to-orange-100 rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-orange-500 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* No Results */}
          {filteredAnnouncements.length === 0 && !loading && (
            <div className="text-center py-16 animate-fade-in-up">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 max-w-md mx-auto">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Aucune annonce trouvée</h3>
                <p className="text-gray-600">Essayez de modifier vos critères de recherche ou de filtrage.</p>
              </div>
            </div>
          )}

          {/* Stats Footer */}
          <div className="text-center mt-12 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 max-w-md mx-auto">
              <p className="text-gray-600">
                <span className="font-semibold text-blue-600">{filteredAnnouncements.length}</span>
                {filteredAnnouncements.length === 1 ? ' annonce affichée' : ' annonces affichées'}
                sur <span className="font-semibold text-orange-600">{announcements.length}</span> au total
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
        
        .line-clamp-4 {
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default Announcements; 