import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/utils/api";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

interface Announcement {
  _id: string;
  title: string;
  content: string;
  type: 'info' | 'alert' | 'event';
  created_at: string;
  author_name: string;
}

const VIEWED_ANNOUNCEMENTS_KEY = 'viewed_announcements';

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Fonction pour obtenir les annonces vues
  const getViewedAnnouncements = (): Set<string> => {
    const viewed = localStorage.getItem(VIEWED_ANNOUNCEMENTS_KEY);
    return new Set(viewed ? JSON.parse(viewed) : []);
  };

  // Fonction pour marquer une annonce comme vue
  const markAnnouncementAsViewed = (announcementId: string) => {
    const viewed = getViewedAnnouncements();
    viewed.add(announcementId);
    localStorage.setItem(VIEWED_ANNOUNCEMENTS_KEY, JSON.stringify([...viewed]));
  };

  // Fonction pour vérifier si une annonce est nouvelle
  const isNewAnnouncement = (announcement: Announcement): boolean => {
    const viewed = getViewedAnnouncements();
    const isNew = !viewed.has(announcement._id);
    const isRecent = (new Date().getTime() - new Date(announcement.created_at).getTime()) <= 24 * 60 * 60 * 1000;
    return isNew && isRecent;
  };

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await api.get('/announcements');
        setAnnouncements(response.data);
        
        // Filtrer les nouvelles annonces non vues
        const newAnnouncements = response.data.filter((ann: Announcement) => isNewAnnouncement(ann));

        // Afficher les notifications pour les nouvelles annonces
        newAnnouncements.forEach((ann: Announcement) => {
          toast({
            title: `Nouvelle ${ann.type === 'alert' ? 'alerte' : ann.type === 'event' ? 'événement' : 'information'} !`,
            description: ann.title,
            variant: ann.type === 'alert' ? 'destructive' : 'default',
            onClick: () => {
              // Faire défiler jusqu'à l'annonce
              const element = document.getElementById(`announcement-${ann._id}`);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
                element.classList.add('highlight-announcement');
                setTimeout(() => {
                  element.classList.remove('highlight-announcement');
                }, 2000);
              }
              // Marquer comme vue
              markAnnouncementAsViewed(ann._id);
            },
          });
          // Marquer automatiquement comme vue après 5 secondes
          setTimeout(() => {
            markAnnouncementAsViewed(ann._id);
          }, 5000);
        });

      } catch (error) {
        console.error("Erreur lors de la récupération des annonces:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les annonces",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();

    // Rafraîchir les annonces toutes les 5 minutes
    const interval = setInterval(fetchAnnouncements, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredAnnouncements = announcements
    .filter(ann => 
      (filterType === 'all' || ann.type === filterType) &&
      (ann.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
       ann.content.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'alert':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'event':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <style jsx global>{`
        .highlight-announcement {
          animation: highlight 2s ease-in-out;
        }
        
        @keyframes highlight {
          0% { background-color: rgba(59, 130, 246, 0.1); }
          50% { background-color: rgba(59, 130, 246, 0.2); }
          100% { background-color: transparent; }
        }
      `}</style>

      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Bell className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Annonces</h1>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              className="pl-10"
              placeholder="Rechercher une annonce..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrer par type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="info">Information</SelectItem>
              <SelectItem value="alert">Alerte</SelectItem>
              <SelectItem value="event">Événement</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredAnnouncements.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  {searchTerm || filterType !== 'all' 
                    ? "Aucune annonce ne correspond à vos critères."
                    : "Aucune annonce disponible pour le moment."}
                </CardContent>
              </Card>
            ) : (
              filteredAnnouncements.map((announcement) => (
                <Card 
                  key={announcement._id} 
                  id={`announcement-${announcement._id}`}
                  className={`overflow-hidden transition-all duration-300 ${
                    isNewAnnouncement(announcement) ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          {announcement.title}
                          {isNewAnnouncement(announcement) && (
                            <Badge className="bg-primary text-primary-foreground">Nouveau</Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          <div className="flex items-center gap-2">
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
                          </div>
                        </CardDescription>
                      </div>
                      <Badge className={getTypeColor(announcement.type)}>
                        {announcement.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{announcement.content}</p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AnnouncementsPage; 