import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from "lucide-react";
import { adminService } from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Swal from 'sweetalert2';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
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

interface PaginationState {
  page: number;
  limit: number;
  total: number;
}

const UsersManagement = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [userPagination, setUserPagination] = useState<PaginationState>({ page: 1, limit: 10, total: 0 });
  const [formState, setFormState] = useState<{
    isOpen: boolean;
    data: UserFormData;
  }>({
    isOpen: false,
    data: {} as UserFormData
  });

  const loadUsers = async () => {
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
      console.error('Error:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [userPagination.page, userPagination.limit]);

  const handleCreate = () => {
    setFormState({
      isOpen: true,
      data: {
        type: 'user',
        name: '',
        email: '',
        role: 'user',
        password: ''
      }
    });
  };

  const handleEdit = (user: User) => {
    setFormState({
      isOpen: true,
      data: {
        type: 'user',
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        password: ''
      }
    });
  };

  const handleDelete = async (id: string) => {
    try {
      const result = await Swal.fire({
        title: 'Êtes-vous sûr?',
        text: "Voulez-vous vraiment supprimer cet utilisateur?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Oui, supprimer!',
        cancelButtonText: 'Annuler',
        timer: 10000,
        timerProgressBar: true
      });

      if (!result.isConfirmed) return;

      setLoading(true);
      const response = await adminService.deleteUser(id);

      if (response.success) {
        Swal.fire({
          icon: 'success',
          title: 'Supprimé!',
          text: "Utilisateur supprimé avec succès",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          toast: true,
          position: 'top-end'
        });
        await loadUsers();
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formState.data.name || !formState.data.email || !formState.data.role) {
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

      if (formState.data._id) {
        response = await adminService.updateUser(formState.data._id, formState.data);
      } else {
        if (!formState.data.password) {
          throw new Error("Le mot de passe est requis pour créer un nouvel utilisateur");
        }
        response = await adminService.createUser({
          name: formState.data.name,
          email: formState.data.email,
          password: formState.data.password,
          role: formState.data.role
        });
      }

      if (response.success) {
        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: formState.data._id ? "Utilisateur modifié avec succès" : "Utilisateur créé avec succès",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          toast: true,
          position: 'top-end'
        });
        await loadUsers();
        setFormState({ isOpen: false, data: {} as UserFormData });
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'opération",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const Pagination = () => {
    const totalPages = Math.ceil(userPagination.total / userPagination.limit);
    
    return (
      <div className="flex justify-between items-center mt-4">
        <div>
          Showing {((userPagination.page - 1) * userPagination.limit) + 1} to {Math.min(userPagination.page * userPagination.limit, userPagination.total)} of {userPagination.total} entries
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setUserPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={userPagination.page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setUserPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={userPagination.page === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestion des Utilisateurs</h2>
        <Button 
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nouvel Utilisateur
        </Button>
      </div>

      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-medium">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.status === 'active' ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button 
                            onClick={() => handleEdit(user)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="w-4 h-4" />
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

      <Dialog open={formState.isOpen} onOpenChange={(open) => setFormState(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {formState.data._id ? 'Modifier un utilisateur' : 'Ajouter un utilisateur'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nom</Label>
              <Input
                id="name"
                value={formState.data.name || ''}
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
                value={formState.data.email || ''}
                onChange={(e) => setFormState(prev => ({
                  ...prev,
                  data: { ...prev.data, email: e.target.value }
                }))}
              />
            </div>
            <div>
              <Label htmlFor="role">Rôle</Label>
              <Select
                value={formState.data.role || ''}
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
            {!formState.data._id && (
              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={formState.data.password || ''}
                  onChange={(e) => setFormState(prev => ({
                    ...prev,
                    data: { ...prev.data, password: e.target.value }
                  }))}
                />
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setFormState({ isOpen: false, data: {} as UserFormData })}>
                Annuler
              </Button>
              <Button type="submit">
                {formState.data._id ? 'Modifier' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersManagement; 