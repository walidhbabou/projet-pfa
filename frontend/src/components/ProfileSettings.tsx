import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Shield, Settings, Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/utils/api";

interface UserData {
  name: string;
  email: string;
  role: string;
}

const ProfileSettings = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Récupérer les données utilisateur du localStorage
  const [user, setUser] = useState<UserData>(() => {
    const userData = localStorage.getItem('fsts_user');
    return userData ? JSON.parse(userData) : { name: '', email: '', role: '' };
  });

  // États pour les formulaires
  const [profileData, setProfileData] = useState({
    name: user.name,
    email: user.email
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Validation du mot de passe
  const isPasswordValid = (password: string) => {
    return password.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password);
  };

  const passwordsMatch = passwordData.newPassword === passwordData.confirmPassword && passwordData.confirmPassword !== '';

  // Mettre à jour le profil
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.put('/update-profile', profileData);
      
      // Mettre à jour les données utilisateur dans le localStorage
      const updatedUser = { ...user, ...profileData };
      localStorage.setItem('fsts_user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      toast({
        title: "Succès",
        description: "Votre profil a été mis à jour avec succès",
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour votre profil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Changer le mot de passe
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive",
      });
      return;
    }

    if (!isPasswordValid(passwordData.newPassword)) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await api.put('/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      toast({
        title: "Succès",
        description: "Votre mot de passe a été modifié avec succès",
      });
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier votre mot de passe",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-orange-400 rounded-full animate-float opacity-40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          ></div>
        ))}
      </div>

      <div className="relative z-10 min-h-screen">
        {/* Admin Alert */}
        {user.role === 'admin' && (
          <div className="bg-gradient-to-r from-blue-500 to-orange-500 text-white p-4 shadow-lg">
            <div className="container mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <span className="font-semibold">Mode Administrateur</span>
              </div>
              <div className="text-sm opacity-90">
                Vous avez accès à toutes les fonctionnalités d'administration
              </div>
            </div>
          </div>
        )}

        <main className="container mx-auto py-8 px-4">
          <div className="max-w-2xl mx-auto">
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl p-1 border border-gray-200/50">
                <TabsTrigger 
                  value="profile" 
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-xl font-semibold transition-all duration-300 flex items-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Profil
                </TabsTrigger>
                <TabsTrigger 
                  value="security"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-orange-500 data-[state=active]:text-white rounded-xl font-semibold transition-all duration-300 flex items-center gap-2"
                >
                  <Shield className="h-4 w-4" />
                  Sécurité
                </TabsTrigger>
        </TabsList>

              <TabsContent value="profile" className="mt-8 animate-fade-in-up">
                <Card className="bg-gradient-to-br from-blue-50 via-white to-orange-50 backdrop-blur-sm shadow-2xl border-2 border-blue-200/50 rounded-2xl overflow-hidden">
                  <CardHeader className="bg-white/60 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-r from-blue-500 to-orange-500 p-2 rounded-xl shadow-lg">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-gray-800 text-xl">Informations du profil</CardTitle>
                        <CardDescription className="text-gray-600">
                Modifiez vos informations personnelles ici.
              </CardDescription>
                      </div>
                    </div>
            </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                      <div className="space-y-3">
                        <Label htmlFor="name" className="text-gray-700 font-semibold flex items-center gap-2">
                          <User className="h-4 w-4 text-blue-600" />
                          Nom complet
                        </Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      name: e.target.value
                    }))}
                          placeholder="Votre nom complet"
                          className="border-gray-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl bg-white/80 backdrop-blur-sm shadow-sm"
                  />
                </div>
                      
                      <div className="space-y-3">
                        <Label htmlFor="email" className="text-gray-700 font-semibold flex items-center gap-2">
                          <Mail className="h-4 w-4 text-blue-600" />
                          Adresse email
                        </Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      email: e.target.value
                    }))}
                    placeholder="votre@email.com"
                          className="border-gray-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl bg-white/80 backdrop-blur-sm shadow-sm"
                  />
                </div>
                      
                      <Button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Mise à jour...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Mettre à jour le profil
                          </div>
                        )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

              <TabsContent value="security" className="mt-8 animate-fade-in-up">
                <Card className="bg-gradient-to-br from-blue-50 via-white to-orange-50 backdrop-blur-sm shadow-2xl border-2 border-blue-200/50 rounded-2xl overflow-hidden">
                  <CardHeader className="bg-white/60 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-r from-blue-500 to-orange-500 p-2 rounded-xl shadow-lg">
                        <Shield className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-gray-800 text-xl">Sécurité</CardTitle>
                        <CardDescription className="text-gray-600">
                          Changez votre mot de passe pour sécuriser votre compte.
              </CardDescription>
                      </div>
                    </div>
            </CardHeader>
                  <CardContent className="p-6">
                    <form onSubmit={handlePasswordChange} className="space-y-6">
                      <div className="space-y-3">
                        <Label htmlFor="currentPassword" className="text-gray-700 font-semibold flex items-center gap-2">
                          <Lock className="h-4 w-4 text-blue-600" />
                          Mot de passe actuel
                        </Label>
                        <div className="relative">
                  <Input
                    id="currentPassword"
                            type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({
                      ...prev,
                      currentPassword: e.target.value
                    }))}
                            className="border-gray-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl bg-white/80 backdrop-blur-sm shadow-sm pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                </div>
                      
                      <div className="space-y-3">
                        <Label htmlFor="newPassword" className="text-gray-700 font-semibold flex items-center gap-2">
                          <Lock className="h-4 w-4 text-blue-600" />
                          Nouveau mot de passe
                        </Label>
                        <div className="relative">
                  <Input
                    id="newPassword"
                            type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({
                      ...prev,
                      newPassword: e.target.value
                    }))}
                            className={`border-gray-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl bg-white/80 backdrop-blur-sm shadow-sm pr-10 ${
                              passwordData.newPassword && !isPasswordValid(passwordData.newPassword) ? 'border-red-300' : ''
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {passwordData.newPassword && (
                          <div className="text-sm space-y-1">
                            <div className={`flex items-center gap-2 ${passwordData.newPassword.length >= 8 ? 'text-green-600' : 'text-red-500'}`}>
                              {passwordData.newPassword.length >= 8 ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                              Au moins 8 caractères
                            </div>
                            <div className={`flex items-center gap-2 ${/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword) ? 'text-green-600' : 'text-red-500'}`}>
                              {/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword) ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                              Majuscule, minuscule et chiffre
                            </div>
                          </div>
                        )}
                </div>
                      
                      <div className="space-y-3">
                        <Label htmlFor="confirmPassword" className="text-gray-700 font-semibold flex items-center gap-2">
                          <Lock className="h-4 w-4 text-blue-600" />
                          Confirmer le mot de passe
                        </Label>
                        <div className="relative">
                  <Input
                    id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({
                      ...prev,
                      confirmPassword: e.target.value
                    }))}
                            className={`border-gray-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl bg-white/80 backdrop-blur-sm shadow-sm pr-10 ${
                              passwordData.confirmPassword && !passwordsMatch ? 'border-red-300' : passwordsMatch ? 'border-green-300' : ''
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {passwordData.confirmPassword && (
                          <div className={`text-sm flex items-center gap-2 ${passwordsMatch ? 'text-green-600' : 'text-red-500'}`}>
                            {passwordsMatch ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                            {passwordsMatch ? 'Les mots de passe correspondent' : 'Les mots de passe ne correspondent pas'}
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        type="submit" 
                        disabled={loading || !passwordsMatch || !isPasswordValid(passwordData.newPassword)}
                        className="w-full bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Modification...
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Changer le mot de passe
                </div>
                        )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
          </div>
        </main>
      </div>

      <style>
        {`
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
          
          .animate-fade-in-up {
            animation: fade-in-up 0.6s ease-out forwards;
          }
          
          .animation-delay-2000 {
            animation-delay: 2s;
          }
          
          .animation-delay-4000 {
            animation-delay: 4s;
          }
        `}
      </style>
    </div>
  );
};

export default ProfileSettings; 