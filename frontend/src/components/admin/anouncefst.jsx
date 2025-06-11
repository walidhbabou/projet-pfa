import React, { useState, useEffect } from 'react';
import { Calendar, Bell, ExternalLink, RefreshCw } from 'lucide-react';

// Service de scraping simulé
class FSTSAnnouncementService {
  async scrapeAnnouncements() {
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Données simulées
    return {
      success: true,
      data: [
        {
          title: "Inscription aux examens de rattrapage - Session Juin 2025",
          content: "Les étudiants concernés par les examens de rattrapage doivent se présenter au secrétariat de leur département pour finaliser leur inscription avant le 15 juin 2025.",
          date: "2025-06-08"
        },
        {
          title: "Nouvelle formation en Intelligence Artificielle",
          content: "La FSTS lance une nouvelle formation de Master spécialisé en Intelligence Artificielle et Big Data. Les candidatures sont ouvertes jusqu'au 30 juin 2025.",
          date: "2025-06-07"
        },
        {
          title: "Conférence internationale sur les énergies renouvelables",
          content: "La faculté organise une conférence internationale sur les énergies renouvelables et le développement durable du 20 au 22 juin 2025.",
          date: "2025-06-06"
        },
        {
          title: "Modification des horaires de la bibliothèque",
          content: "À partir du 10 juin 2025, la bibliothèque universitaire sera ouverte de 8h à 20h du lundi au vendredi et de 9h à 17h le samedi.",
          date: "2025-06-05"
        },
        {
          title: "Stage obligatoire - Promotion 2025",
          content: "Rappel important : tous les étudiants de 3ème année doivent valider leur convention de stage avant le 25 juin 2025 auprès du service des stages.",
          date: "2025-06-04"
        }
      ]
    };
  }
}

const announcementService = new FSTSAnnouncementService();

const useFSTSAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await announcementService.scrapeAnnouncements();
      if (result.success && result.data) {
        setAnnouncements(result.data);
      } else {
        setError(result.error || 'Erreur lors du chargement des annonces');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  return { announcements, loading, error, refetch: fetchAnnouncements };
};

const FSTSAnnouncementsDisplay = () => {
  const { announcements, loading, error, refetch } = useFSTSAnnouncements();

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
            <Bell className="h-5 w-5 text-blue-600" />
            <span>Dernières Annonces FSTS</span>
          </h3>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-gray-300 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-gray-200 text-center">
          <div className="text-sm text-gray-500">Chargement des annonces...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
            <Bell className="h-5 w-5 text-blue-600" />
            <span>Dernières Annonces FSTS</span>
          </h3>
        </div>
        <div className="text-center py-8">
          <div className="text-red-500 text-2xl mb-2">⚠️</div>
          <div className="text-red-600 text-sm mb-4">{error}</div>
          <button 
            onClick={refetch}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
          >
            🔄 Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
          <Bell className="h-5 w-5 text-blue-600" />
          <span>Dernières Annonces FSTS</span>
        </h3>
        <button 
          onClick={refetch}
          className="text-sm px-3 py-1 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
        >
          🔄 Actualiser
        </button>
      </div>
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {announcements.length > 0 ? (
          announcements.slice(0, 5).map((announcement, index) => (
            <div key={announcement.title + announcement.date} className="border-l-4 border-blue-500 pl-4 py-2 hover:bg-gray-50 rounded-r-lg transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-gray-800 mb-1 line-clamp-2">
                    {announcement.title}
                  </h4>
                  <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                    {announcement.content}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">
                      {new Date(announcement.date).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-blue-500 hover:text-blue-700 cursor-pointer ml-2" />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <div className="text-sm text-gray-500">Aucune annonce disponible</div>
          </div>
        )}
      </div>
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total</span>
          <span className="font-semibold text-gray-800">
            {announcements.length} annonce{announcements.length > 1 ? 's' : ''}
          </span>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Dernière mise à jour: {new Date().toLocaleString('fr-FR')}
        </div>
      </div>
    </div>
  );
};

export default FSTSAnnouncementsDisplay;