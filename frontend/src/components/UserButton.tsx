
import { Button } from "@/components/ui/button";
import { authService } from "@/utils/api";
import { useNavigate } from "react-router-dom";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Settings } from "lucide-react";
import { useEffect, useState } from "react";

interface UserData {
  email: string;
  name: string;
  role: string;
}

const UserButton = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const navigate = useNavigate();
  const isAuthenticated = authService.isAuthenticated();
  
  useEffect(() => {
    const loadUser = () => {
      const userStr = localStorage.getItem('fsts_user');
      if (userStr) {
        try {
          setUser(JSON.parse(userStr));
        } catch (e) {
          console.error("Error parsing user data", e);
        }
      }
    };
    
    if (isAuthenticated) {
      loadUser();
    }
  }, [isAuthenticated]);
  
  const handleLogin = () => {
    navigate('/auth');
  };
  
  const handleLogout = () => {
    authService.logout();
    navigate('/');
    window.location.reload(); // Recharger pour mettre à jour l'état
  };
  
  if (!isAuthenticated) {
    return (
      <Button onClick={handleLogin} variant="outline">
        Connexion
      </Button>
    );
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="relative">
          <User className="h-4 w-4 mr-2" />
          {user?.name || 'Utilisateur'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user?.email && (
          <DropdownMenuItem className="text-sm text-muted-foreground cursor-default">
            {user.email}
          </DropdownMenuItem>
        )}
        {user?.role === 'admin' && (
          <DropdownMenuItem onClick={() => navigate('/admin')}>
            <Settings className="h-4 w-4 mr-2" />
            Administration
          </DropdownMenuItem>
        )}
        {}
    
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserButton;
