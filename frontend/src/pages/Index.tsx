import Navbar from "@/components/Navbar";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
 

      <div className="flex-1 container mx-auto flex flex-col justify-center items-center px-4 text-center">
        <div className="flex flex-col items-center space-y-6 max-w-2xl">

          <img
            src="/public/logo-fsts.png"
            alt="Logo FSTS"
            className="w-32 sm:w-40 md:w-48 rounded-xl shadow-md hover:scale-105 transition-transform duration-300"
          />

      
          <div className="text-primary animate-bounce">
            <Sparkles className="w-10 h-10" />
          </div>


          <h1 className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Bienvenue à l’assistant virtuel de la FSTS
          </h1>

   
          <p className="text-lg text-muted-foreground">
            Connectez-vous pour poser vos questions sur les filières, les inscriptions, les examens et les services offerts par la Faculté des Sciences et Techniques de Settat.
          </p>

      
          <a href="http://localhost:8081/auth">
          <Button
  className="text-lg px-6 py-3 relative overflow-hidden group transition-all duration-300 hover:scale-105"
>
  <span className="relative z-10">Se connecter</span>
  <span className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/30 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
</Button>

          </a>
        </div>
      </div>

    
      <footer className="py-6 border-t mt-10">
        <div className="container text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Faculté des Sciences et Techniques de Settat. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
};

export default Index;
