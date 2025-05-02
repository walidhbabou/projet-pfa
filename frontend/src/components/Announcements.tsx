import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Pencil, Trash, Save, X, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authService, api } from '@/utils/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Announcement {
  _id: string;
  title: string;
  content: string;
  type: 'info' | 'alert' | 'event';
  created_at: string;
  author_name: string;
}

const Announcements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');
  const { toast } = useToast();
  const isAdmin = authService.isAdmin();

  const fetchAnnouncements = async () => {
    try {
      const response = await api.get('/announcements');
      setAnnouncements(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des annonces:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les annonces.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleAdd = () => {
    setEditingAnnouncement({
      _id: '',
      title: '',
      content: '',
      type: 'info',
      created_at: new Date().toISOString(),
      author_name: ''
    });
    setIsAdding(true);
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement({ ...announcement });
    setIsAdding(false);
  };

  const handleSave = async () => {
    if (!editingAnnouncement?.title || !editingAnnouncement?.content) {
      toast({
        title: "Erreur",
        description: "Le titre et le contenu sont requis.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (isAdding) {
        const response = await api.post('/announcements', {
          title: editingAnnouncement.title,
          content: editingAnnouncement.content,
          type: editingAnnouncement.type
        });
        
        await fetchAnnouncements(); // Recharger toutes les annonces
        toast({
          title: "Succès",
          description: "L'annonce a été ajoutée avec succès."
        });
      } else {
        await api.put(`/announcements/${editingAnnouncement._id}`, {
          title: editingAnnouncement.title,
          content: editingAnnouncement.content,
          type: editingAnnouncement.type
        });
        
        await fetchAnnouncements(); // Recharger toutes les annonces
        toast({
          title: "Succès",
          description: "L'annonce a été mise à jour avec succès."
        });
      }

      setEditingAnnouncement(null);
      setIsAdding(false);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde de l'annonce.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/announcements/${id}`);
      await fetchAnnouncements(); // Recharger toutes les annonces
      toast({
        title: "Succès",
        description: "L'annonce a été supprimée avec succès."
      });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression de l'annonce.",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    setEditingAnnouncement(null);
    setIsAdding(false);
  };

  const filteredAndSortedAnnouncements = announcements
    .filter(ann => 
      ann.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ann.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      return a.title.localeCompare(b.title);
    });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div className="flex-1 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              className="pl-10"
              placeholder="Rechercher une annonce..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={sortBy} onValueChange={(value: 'date' | 'title') => setSortBy(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Trier par..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="title">Titre</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {isAdmin && (
          <Button onClick={handleAdd} disabled={!!editingAnnouncement || isLoading}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nouvelle annonce
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <>
          {(isAdding || editingAnnouncement) && (
            <Card key="edit-form" className="border-2 border-primary">
              <CardHeader>
                <CardTitle>
                  {isAdding ? "Nouvelle annonce" : "Modifier l'annonce"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Titre</label>
                    <Input
                      value={editingAnnouncement?.title}
                      onChange={(e) => setEditingAnnouncement(prev => ({
                        ...prev!,
                        title: e.target.value
                      }))}
                      placeholder="Titre de l'annonce"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <Select
                      value={editingAnnouncement?.type}
                      onValueChange={(value: 'info' | 'alert' | 'event') => 
                        setEditingAnnouncement(prev => ({
                          ...prev!,
                          type: value
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Information</SelectItem>
                        <SelectItem value="alert">Alerte</SelectItem>
                        <SelectItem value="event">Événement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Contenu</label>
                    <Textarea
                      value={editingAnnouncement?.content}
                      onChange={(e) => setEditingAnnouncement(prev => ({
                        ...prev!,
                        content: e.target.value
                      }))}
                      placeholder="Contenu de l'annonce"
                      rows={4}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleCancel}>
                      <X className="mr-2 h-4 w-4" />
                      Annuler
                    </Button>
                    <Button onClick={handleSave}>
                      <Save className="mr-2 h-4 w-4" />
                      Enregistrer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {filteredAndSortedAnnouncements.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                {searchTerm ? "Aucune annonce ne correspond à votre recherche." : "Aucune annonce pour le moment."}
              </CardContent>
            </Card>
          ) : (
            filteredAndSortedAnnouncements.map(announcement => (
              <Card key={announcement._id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{announcement.title}</CardTitle>
                      <div className="flex gap-2 text-sm text-muted-foreground">
                        <span>
                          {new Date(announcement.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span>•</span>
                        <span>{announcement.author_name}</span>
                        <span>•</span>
                        <span className={`capitalize ${
                          announcement.type === 'alert' ? 'text-red-500' :
                          announcement.type === 'event' ? 'text-green-500' :
                          'text-blue-500'
                        }`}>
                          {announcement.type}
                        </span>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(announcement)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(announcement._id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{announcement.content}</p>
                </CardContent>
              </Card>
            ))
          )}
        </>
      )}
    </div>
  );
};

export default Announcements; 