import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Megaphone, Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { adminService } from '@/utils/api';
import Swal from 'sweetalert2';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  created_at?: string;
}

interface AnnouncementFormData {
  type: 'announcement';
  _id?: string;
  title: string;
  content: string;
  announcementType: 'info' | 'warning' | 'success' | 'error';
}

interface PaginationState {
  page: number;
  limit: number;
  total: number;
}

const AdminAnnouncements = () => {
  const [loading, setLoading] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementPagination, setAnnouncementPagination] = useState<PaginationState>({ page: 1, limit: 10, total: 0 });
  const [formState, setFormState] = useState<{
    isOpen: boolean;
    data: AnnouncementFormData;
  }>({
    isOpen: false,
    data: {} as AnnouncementFormData
  });

  useEffect(() => {
    fetchAnnouncements();
  }, [announcementPagination.page]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await adminService.getAnnouncementsPaginated({
        page: announcementPagination.page,
        limit: announcementPagination.limit
      });
      setAnnouncements(response.data);
      setAnnouncementPagination(prev => ({
        ...prev,
        total: response.total
      }));
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur de chargement',
        text: `Impossible de charger les annonces. Veuillez réessayer.`,
        timer: 3000,
        timerProgressBar: true,
        toast: true,
        position: 'top-end'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormState({
      isOpen: true,
      data: {
        type: 'announcement',
        title: '',
        content: '',
        announcementType: 'info'
      }
    });
  };

  const handleEdit = (announcement: Announcement) => {
    setFormState({
      isOpen: true,
      data: {
        type: 'announcement',
        _id: announcement._id,
        title: announcement.title,
        content: announcement.content,
        announcementType: announcement.type
      }
    });
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Êtes-vous sûr?',
      text: "Voulez-vous vraiment supprimer cette annonce?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Oui, supprimer!',
      cancelButtonText: 'Annuler',
      timer: 10000,
      timerProgressBar: true
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await adminService.deleteAnnouncement(id);
      setAnnouncements(prev => prev.filter(a => a._id !== id));
      Swal.fire({
        icon: 'success',
        title: 'Supprimé!',
        text: "Annonce supprimée avec succès",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        toast: true,
        position: 'top-end'
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: `Erreur lors de la suppression de l'annonce.`,
        timer: 3000,
        timerProgressBar: true,
        toast: true,
        position: 'top-end'
      });
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formState.data.title || !formState.data.content || !formState.data.announcementType) {
      Swal.fire({
        icon: 'warning',
        title: 'Champs manquants',
        text: `Veuillez remplir tous les champs requis.`,
        timer: 3000,
        timerProgressBar: true,
        toast: true,
        position: 'top-end'
      });
      return;
    }

    try {
      if (formState.data._id) {
        // Update existing
        await adminService.updateAnnouncement(formState.data._id, {
          title: formState.data.title,
          content: formState.data.content,
          type: formState.data.announcementType
        });
        setAnnouncements(prev => prev.map(a => 
          a._id === formState.data._id 
            ? {
                ...a,
                title: formState.data.title,
                content: formState.data.content,
                type: formState.data.announcementType
              }
            : a
        ));
      } else {
        // Create new
        const response = await adminService.createAnnouncement({
          title: formState.data.title,
          content: formState.data.content,
          type: formState.data.announcementType
        });
        setAnnouncements(prev => [response.data, ...prev]);
      }

      setFormState({ isOpen: false, data: {} as AnnouncementFormData });
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: formState.data._id ? "Annonce modifiée avec succès" : "Annonce créée avec succès",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        toast: true,
        position: 'top-end'
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: `Erreur lors de l'enregistrement de l'annonce.`,
        timer: 3000,
        timerProgressBar: true,
        toast: true,
        position: 'top-end'
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'success': return <CheckCircle className="w-5 h-5" />;
      case 'error': return <XCircle className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  const Pagination = () => {
    const totalPages = Math.ceil(announcementPagination.total / announcementPagination.limit);
    
    return (
      <div className="flex justify-between items-center mt-8 px-6">
        <div className="text-sm text-gray-600">
          Affichage de {((announcementPagination.page - 1) * announcementPagination.limit) + 1} à {Math.min(announcementPagination.page * announcementPagination.limit, announcementPagination.total)} sur {announcementPagination.total} entrées
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setAnnouncementPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={announcementPagination.page === 1}
            className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-sm hover:shadow-md"
          >
            Précédent
          </button>
          <button
            onClick={() => setAnnouncementPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={announcementPagination.page === totalPages}
            className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-sm hover:shadow-md"
          >
            Suivant
          </button>
        </div>
      </div>
    );
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
        {[...Array(6)].map((_, i) => (
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

      <div className="relative z-10 min-h-screen p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 animate-fade-in-up">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-orange-400 rounded-full blur-md opacity-60 animate-pulse"></div>
              <div className="relative bg-white p-3 rounded-full shadow-xl">
                <Megaphone className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 bg-clip-text text-transparent">
                Gestion des Annonces
              </h1>
              <p className="text-gray-600 mt-1">Créez et gérez les annonces pour les étudiants</p>
            </div>
          </div>
          
          <button 
            onClick={handleCreate}
            className="group relative bg-gradient-to-r from-blue-600 to-orange-500 text-white font-bold py-3 px-6 rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
          >
            <span className="relative z-10 flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Nouvelle Annonce</span>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>

        {/* Main content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-blue-50 to-orange-50">
                    <tr>
                      <th className="px-8 py-6 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">Titre</th>
                      <th className="px-8 py-6 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">Contenu</th>
                      <th className="px-8 py-6 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">Type</th>
                      <th className="px-8 py-6 text-left text-sm font-bold text-gray-800 uppercase tracking-wider">Date</th>
                      <th className="px-8 py-6 text-right text-sm font-bold text-gray-800 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {announcements.map((announcement, index) => (
                      <tr 
                        key={announcement._id} 
                        className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-orange-50/50 transition-all duration-300 animate-fade-in-up"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <td className="px-8 py-6">
                          <div className="font-semibold text-gray-900 text-lg">{announcement.title}</div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="text-gray-700 line-clamp-2 max-w-md">{announcement.content}</div>
                        </td>
                        <td className="px-8 py-6">
                          <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${
                            announcement.type === 'info' 
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : announcement.type === 'warning'
                              ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                              : announcement.type === 'success'
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}>
                            {getTypeIcon(announcement.type)}
                            <span className="capitalize">{announcement.type}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="text-gray-600 font-medium">
                            {new Date(announcement.created_at || '').toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex justify-end space-x-3">
                            <button 
                              onClick={() => handleEdit(announcement)}
                              className="p-2 text-blue-600 hover:text-white hover:bg-blue-600 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(announcement._id)}
                              className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination />
            </>
          )}
        </div>

        {/* Modal Dialog */}
        {formState.isOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl w-full max-w-2xl animate-fade-in-up">
              <div className="p-8">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent mb-6">
                  {formState.data._id ? 'Modifier une annonce' : 'Créer une annonce'}
                </h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Titre</label>
                    <input
                      type="text"
                      value={formState.data.title || ''}
                      onChange={(e) => setFormState(prev => ({
                        ...prev,
                        data: { ...prev.data, title: e.target.value }
                      }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/80 backdrop-blur-sm"
                      placeholder="Entrez le titre de l'annonce"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Contenu</label>
                    <textarea
                      value={formState.data.content || ''}
                      onChange={(e) => setFormState(prev => ({
                        ...prev,
                        data: { ...prev.data, content: e.target.value }
                      }))}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/80 backdrop-blur-sm resize-none"
                      placeholder="Entrez le contenu de l'annonce"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                    <select
                      value={formState.data.announcementType || ''}
                      onChange={(e) => setFormState(prev => ({
                        ...prev,
                        data: { ...prev.data, announcementType: e.target.value as 'info' | 'warning' | 'success' | 'error' }
                      }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-white/80 backdrop-blur-sm"
                    >
                      <option value="">Sélectionner un type</option>
                      <option value="info">Information</option>
                      <option value="warning">Avertissement</option>
                      <option value="success">Succès</option>
                      <option value="error">Erreur</option>
                    </select>
                  </div>
                  
                  <div className="flex justify-end space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setFormState({ isOpen: false, data: {} as AnnouncementFormData })}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 font-medium"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleFormSubmit}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-medium"
                    >
                      {formState.data._id ? 'Modifier' : 'Créer'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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
        
        .hover\\:shadow-3xl:hover {
          box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default AdminAnnouncements; 