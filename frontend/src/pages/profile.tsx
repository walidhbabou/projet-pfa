import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import ProfileSettings from "@/components/ProfileSettings";
import { authService } from "@/utils/api";

const ProfilePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    if (!authService.isAuthenticated()) {
      navigate('/login');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4">
        <div className="py-8">
          <h1 className="text-3xl font-bold mb-8">Paramètres du compte</h1>
          <ProfileSettings />
        </div>
      </main>
    </div>
  );
};

export default ProfilePage; 