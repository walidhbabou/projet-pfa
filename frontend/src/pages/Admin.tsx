import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users as UsersIcon, 
  MessageSquare, 
  BarChart3, 
  Bell, 
  History,
  Download,
  CheckCircle,
  AlertCircle,
  Plus,
  FileText
} from "lucide-react";
import { api, adminService, adminExportService } from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { handleError } from '@/utils/error-handler';

import Navbar from '@/components/Navbar';
import Swal from 'sweetalert2';
import ChatHistory from './ChatHistory';
import UsersManagement from './UsersManagement';
import AdminAnnouncements from '@/components/admin/AdminAnnouncements';
import { ActivityChart } from '@/components/ActivityChart';
import Anouncfsts from '@/components/admin/anouncefst';

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  total?: number;
}

interface Stats {
  total_users: number;
  active_users: number;
  total_conversations: number;
  total_announcements: number;
}

interface Charte {
  id: number;
  titre: string;
  description: string;
  type: string;
  dateCreation: string;
  statut: string;
  fichier: string;
  taille: string;
}

interface Announcement {
  _id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success' | 'error';
  createdAt?: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  status?: string;
}

interface PaginationState {
  page: number;
  limit: number;
  total: number;
}

interface SearchState {
  query: string;
  category?: string;
  status?: string;
}

interface UserFormData {
  type: 'user';
  _id?: string;
  name: string;
  email: string;
  role: string;
  password?: string;
}

interface AnnouncementFormData {
  type: 'announcement';
  _id?: string;
  title: string;
  content: string;
  announcementType: 'info' | 'warning' | 'success' | 'error';
}

type FormData = UserFormData | AnnouncementFormData;

// Interface pour les données de graphique
interface ChartData {
  name: string;
  value: number;
}

interface ActivityDataItem {
  date: string;
  users: number;
  messages: number;
}

interface UserTypeDataItem {
  name: string;
  value: number;
}

interface StatsData {
  activity_data: ActivityDataItem[];
  user_types: UserTypeDataItem[];
}

// Couleurs pour les graphiques
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Admin = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [userPagination, setUserPagination] = useState<PaginationState>({ page: 1, limit: 10, total: 0 });
  const [announcementPagination, setAnnouncementPagination] = useState<PaginationState>({ page: 1, limit: 10, total: 0 });
  
  const [formState, setFormState] = useState<{
    isOpen: boolean;
    type: 'user' | 'announcement' | null;
    data: FormData;
  }>({
    isOpen: false,
    type: null,
    data: {} as FormData
  });

  const [activityData, setActivityData] = useState<ActivityDataItem[]>([]);
  const [userTypeData, setUserTypeData] = useState<UserTypeDataItem[]>([]);
  const [days, setDays] = useState(7);

  const handleError = (error: unknown) => {
    console.error('Error:', error);
    toast({
      title: "Erreur",
      description: "Une erreur est survenue. Veuillez réessayer.",
      variant: "destructive"
    });
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await adminService.getStats();
      if (response.success) {
        setStats({
          total_users: response.data.total_users || 0,
          total_announcements: response.data.total_announcements || 0,
          active_users: response.data.active_users || 0,
          total_conversations: response.data.total_conversations || 0
        });
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminService.getUsersPaginated({
        page: userPagination.page,
        limit: userPagination.limit,
      });
      
      if (response.success && response.data) {
        setUsers(response.data);
        setUserPagination(prev => ({
          ...prev,
          total: response.total || 0
        }));
      } else {
        toast({
          title: "Erreur",
          description: response.message || "Erreur lors du chargement des utilisateurs",
          variant: "destructive"
        });
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  }, [userPagination.page, userPagination.limit]);

  const loadChartData = async () => {
    setLoading(true);
    const activityResponse = await api.get(`/admin/stats/activity?days=${days}`);
    if (activityResponse.data.success) {
      setActivityData(activityResponse.data.data.activity_data || []);
    }
    setLoading(false);
  };

  const loadUserTypeStats = async () => {
    try {
      setLoading(true);
      const response = await adminService.getUserTypeStats();
      if (response.success) {
        setUserTypeData(response.data.data || []);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([
          loadStats(),
          loadUsers(),
          loadUserTypeStats()
        ]);
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab, loadUsers]);

  useEffect(() => {
    loadChartData();
  }, [days]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'users') {
      loadUsers();
    }
  };

  const handleCreate = (type: 'user' | 'announcement') => {
    const initialData = type === 'user' 
      ? {
          type: 'user' as const,
          name: '',
          email: '',
          role: 'user',
          password: ''
        } as UserFormData
      : {
          type: 'announcement' as const,
          title: '',
          content: '',
          announcementType: 'info' as const
        } as AnnouncementFormData;

    setFormState({
      isOpen: true,
      type,
      data: initialData
    });
  };

  const handleEdit = (type: 'user' | 'announcement', item: User | Announcement) => {
    let formData: FormData;
    
    if (type === 'user') {
      const user = item as User;
        formData = {
        type: 'user',
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        password: ''
      };
    } else {
      const announcement = item as Announcement;
        formData = {
        type: 'announcement',
        _id: announcement._id,
        title: announcement.title,
        content: announcement.content,
        announcementType: announcement.type
      };
    }

    setFormState({
      isOpen: true,
      type,
      data: formData
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formState.type || !validateFormData(formState.type, formState.data)) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs requis",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      let response;

      if (formState.type === 'user') {
        const userData = formState.data as UserFormData;
        if (userData._id) {
          response = await adminService.updateUser(userData._id, userData);
        } else {
          if (!userData.password) {
            throw new Error("Le mot de passe est requis pour créer un nouvel utilisateur");
          }
          response = await adminService.createUser({
            name: userData.name,
            email: userData.email,
            password: userData.password,
            role: userData.role
          });
        }
      } else {
        const announcementData = formState.data as AnnouncementFormData;
        if (announcementData._id) {
          response = await adminService.updateAnnouncement(announcementData._id, announcementData);
        } else {
          response = await adminService.createAnnouncement(announcementData);
        }
      }

      if (response.success) {
        // Configuration SweetAlert corrigée avec timer de 3 secondes
        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: formState.type === 'user'
            ? (formState.data._id ? "Utilisateur modifié avec succès" : "Utilisateur créé avec succès")
            : (formState.data._id ? "Annonce modifiée avec succès" : "Annonce créée avec succès"),
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          toast: true,
          position: 'top-end',
          customClass: {
            popup: 'animate-fade-in-up',
            title: 'text-lg font-bold',
            htmlContainer: 'text-gray-700'
          }
        });
    
        if (formState.type === 'user') {
          await loadUsers();
        }

        setFormState({ isOpen: false, type: null, data: {} as FormData });
      } else {
        throw new Error(response.message || "Une erreur est survenue");
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type: 'user' | 'announcement', id: string) => {
    try {
      // Confirmation avec SweetAlert corrigée
      const result = await Swal.fire({
        title: 'Êtes-vous sûr?',
        text: `Voulez-vous vraiment supprimer cet ${type === 'user' ? 'utilisateur' : 'annonce'}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Oui, supprimer!',
        cancelButtonText: 'Annuler',
        timer: 10000, // Auto-fermeture après 10 secondes
        timerProgressBar: true
      });

      if (!result.isConfirmed) {
        return;
      }

      setLoading(true);
      let response;

      if (type === 'user') {
        response = await adminService.deleteUser(id);
      } else {
        response = await adminService.deleteAnnouncement(id);
      }

      if (response.success) {
        // Notification de succès corrigée avec timer de 3 secondes
        Swal.fire({
          icon: 'success',
          title: 'Supprimé!',
          text: type === 'user' ? "Utilisateur supprimé avec succès" : "Annonce supprimée avec succès",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          toast: true,
          position: 'top-end',
          customClass: {
            popup: 'animate-fade-in-up',
            title: 'text-lg font-bold',
            htmlContainer: 'text-gray-700'
          }
        });
    
        if (type === 'user') {
          await loadUsers();
        }
      } else {
        throw new Error(response.message || "Une erreur est survenue");
      }
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const validateFormData = (type: 'user' | 'announcement', data: FormData): boolean => {
    if (type === 'user') {
        const userData = data as UserFormData;
        return !!(userData.name && userData.email && userData.role);
    } else if (type === 'announcement') {
        const announcementData = data as AnnouncementFormData;
        return !!(announcementData.title && announcementData.content && announcementData.announcementType);
    }
    return false;
  };

  const renderForm = () => {
    if (!formState.type) return null;

    if (formState.type === 'user') {
        const userData = formState.data as UserFormData;
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                value={userData.name || ''}
                onChange={(e) => setFormState(prev => ({
                  ...prev,
                  data: { ...prev.data, name: e.target.value }
                }))}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={userData.email || ''}
                onChange={(e) => setFormState(prev => ({
                  ...prev,
                  data: { ...prev.data, email: e.target.value }
                }))}
              />
            </div>
            <div>
              <Label htmlFor="role">Rôle</Label>
              <Select
                value={userData.role || ''}
                onValueChange={(value) => setFormState(prev => ({
                  ...prev,
                  data: { ...prev.data, role: value }
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Utilisateur</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!userData._id && (
              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={userData.password || ''}
                  onChange={(e) => setFormState(prev => ({
                    ...prev,
                    data: { ...prev.data, password: e.target.value }
                  }))}
                />
              </div>
            )}
          </div>
        );
    } else if (formState.type === 'announcement') {
        const announcementData = formState.data as AnnouncementFormData;
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titre</Label>
              <Input
                id="title"
                value={announcementData.title || ''}
                onChange={(e) => setFormState(prev => ({
                  ...prev,
                  data: { ...prev.data, title: e.target.value }
                }))}
              />
            </div>
            <div>
              <Label htmlFor="content">Contenu</Label>
              <Textarea
                id="content"
                value={announcementData.content || ''}
                onChange={(e) => setFormState(prev => ({
                  ...prev,
                  data: { ...prev.data, content: e.target.value }
                }))}
              />
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                value={announcementData.announcementType || ''}
                onValueChange={(value) => setFormState(prev => ({
                  ...prev,
                  data: { ...prev.data as AnnouncementFormData, announcementType: value as 'info' | 'warning' | 'success' | 'error' }
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Information</SelectItem>
                  <SelectItem value="warning">Avertissement</SelectItem>
                  <SelectItem value="error">Erreur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
    }

        return null;
  };

  const Pagination = ({ pagination, setPagination }: { pagination: PaginationState, setPagination: (p: PaginationState) => void }) => {
    const totalPages = Math.ceil(pagination.total / pagination.limit);
    
    return (
      <div className="flex justify-between items-center mt-4">
        <div>
          Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            disabled={pagination.page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={pagination.page === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: BarChart3 },
    { id: 'users', label: 'Utilisateurs', icon: UsersIcon },
    { id: 'announcements', label: 'Annonces', icon: Bell },
    { id: 'chat-history', label: 'Historique des Chats', icon: History }
  ];

  const statsCards = [
    { 
      title: "Total Utilisateurs", 
      value: stats?.total_users?.toString() || "0", 
      changeType: "positive",
      icon: UsersIcon, 
      color: "from-blue-500 to-blue-600",
      description: "Utilisateurs inscrits"
    },
    { 
      title: "Conversations", 
      value: stats?.total_conversations?.toString() || "0", 
      changeType: "positive",
      icon: MessageSquare, 
      color: "from-purple-500 to-purple-600",
      description: "Total conversations"
    },
    { 
      title: "Annonces Actives", 
      value: stats?.total_announcements?.toString() || "0", 
      changeType: "positive",
      icon: Bell, 
      color: "from-orange-500 to-orange-600",
      description: "Annonces publiées"
    }
  ];

  const Dashboard = () => (
    <div className="space-y-8">
      {/* Cartes de statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-items-center">
        {statsCards.slice(0, 3).map((card, index) => (
          <div 
            key={index}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 w-full max-w-xs hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${card.color} shadow-lg`}>
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 mb-1">{card.title}</h3>
                    <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">{card.description}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Graphiques et analyses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique d'activité */}
        <ActivityChart/>

         <Anouncfsts/>

      {/* Actions rapides - 1 colonne */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Actions rapides</h3>
        <div className="space-y-3">
          <button
            className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            onClick={() => handleCreate('user')}
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Nouvel utilisateur</span>
          </button>
          <button
            className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            onClick={() => handleCreate('announcement')}
          >
            <Bell className="w-5 h-5" />
            <span className="font-medium">Nouvelle annonce</span>
          </button>
          <button
            className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300"
          >
            <FileText className="w-5 h-5" />
            <span className="font-medium">Gérer les chartes</span>
          </button>
          <button
            className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            onClick={adminExportService.downloadAppReportPdf}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="font-medium">Rapport détaillé</span>
          </button>
          {/* Bouton de téléchargement CSV adapté */}
          <button
            className="w-full flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-500 to-gray-700 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            onClick={adminExportService.downloadUsersCsv}
          >
            <Download className="w-5 h-5" />
            <span className="font-medium">Télécharger la liste des utilisateurs</span>
          </button>
        </div>
      </div>
      {/* Actions rapides */}
      </div>
    </div>
  );
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-orange-400 rounded-full animate-float opacity-60"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          ></div>
        ))}
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        <Navbar />

        <div className="bg-white/60 backdrop-blur-sm border-b border-gray-200/30">
          <div className="container mx-auto px-6">
            <div className="flex space-x-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-all duration-300 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-blue-500 hover:border-blue-300'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 container mx-auto px-6 py-8">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <div className="animate-fade-in-up">
                  
                  <Dashboard />
                </div>
              )}

              {activeTab === 'users' && <UsersManagement />}
              {activeTab === 'announcements' && <AdminAnnouncements />}
              {activeTab === 'chat-history' && (
                <div className="animate-fade-in-up">
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Historique des Chats</h2>
                    <p className="text-gray-600">Consultez l'historique des conversations avec les utilisateurs</p>
                  </div>
                  <ChatHistory />
                </div>
              )}
            </>
          )}
        </div>

        <footer className="py-6 border-t border-gray-200/50 bg-white/30 backdrop-blur-sm">
          <div className="container mx-auto px-6 text-center">
            <p className="text-gray-600 text-sm">
              &copy; {new Date().getFullYear()} Faculté des Sciences et Techniques de Settat. Tous droits réservés.
            </p>
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
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
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        
        .animate-float {
          animation: float linear infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      <Dialog open={formState.isOpen} onOpenChange={(open) => setFormState(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {formState.type === 'user' && 'Ajouter un utilisateur'}
              {formState.type === 'announcement' && 'Créer une annonce'}
            </DialogTitle>
          </DialogHeader>
          {renderForm()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormState({ isOpen: false, type: null, data: {} as FormData })}>
              Annuler
            </Button>
            <Button type="submit" onClick={handleFormSubmit}>
              {formState.type === 'user' && 'Créer l\'utilisateur'}
              {formState.type === 'announcement' && 'Publier l\'annonce'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;