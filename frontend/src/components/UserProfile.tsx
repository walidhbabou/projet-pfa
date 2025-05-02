import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserProfileData {
  name: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const UserProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<UserProfileData>({
    name: 'Nom de l\'utilisateur',
    email: 'user@example.com',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const { toast } = useToast();

  const handleInputChange = (field: keyof UserProfileData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setProfileData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleSave = async () => {
    try {
      // Validation
      if (profileData.newPassword !== profileData.confirmPassword) {
        toast({
          title: "Erreur",
          description: "Les mots de passe ne correspondent pas",
          variant: "destructive"
        });
        return;
      }

      // TODO: Appel API pour sauvegarder les modifications
      
      toast({
        title: "Succès",
        description: "Profil mis à jour avec succès"
      });
      setIsEditing(false);
      
      // Réinitialiser les champs de mot de passe
      setProfileData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Mon Profil</CardTitle>
          <Button
            variant={isEditing ? "outline" : "default"}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? (
              <>
                <X className="mr-2 h-4 w-4" />
                Annuler
              </>
            ) : (
              "Modifier"
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nom</label>
            <Input
              value={profileData.name}
              onChange={handleInputChange('name')}
              disabled={!isEditing}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              value={profileData.email}
              onChange={handleInputChange('email')}
              disabled={!isEditing}
            />
          </div>

          {isEditing && (
            <>
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-4">Changer le mot de passe</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Mot de passe actuel</label>
                    <Input
                      type="password"
                      value={profileData.currentPassword}
                      onChange={handleInputChange('currentPassword')}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Nouveau mot de passe</label>
                    <Input
                      type="password"
                      value={profileData.newPassword}
                      onChange={handleInputChange('newPassword')}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Confirmer le nouveau mot de passe</label>
                    <Input
                      type="password"
                      value={profileData.confirmPassword}
                      onChange={handleInputChange('confirmPassword')}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer les modifications
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserProfile; 