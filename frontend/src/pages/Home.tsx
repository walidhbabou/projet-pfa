import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 container mx-auto py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Bienvenue sur l'Assistant Virtuel FSTS
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Votre guide intelligent pour toutes vos questions sur la Faculté des Sciences et Techniques de Settat
          </p>
          
          <div className="space-x-4">
            <Button asChild size="lg">
              <Link to="/auth?mode=login">
                Connexion
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/auth?mode=register">
                Inscription
              </Link>
            </Button>
          </div>
          
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-lg border bg-card">
              <h3 className="text-lg font-semibold mb-2">Chatbot Intelligent</h3>
              <p className="text-muted-foreground">
                Obtenez des réponses instantanées à toutes vos questions sur la FSTS
              </p>
            </div>
            
            <div className="p-6 rounded-lg border bg-card">
              <h3 className="text-lg font-semibold mb-2">Informations Personnalisées</h3>
              <p className="text-muted-foreground">
                Accédez à votre tableau de bord pour suivre vos interactions
              </p>
            </div>
            
            <div className="p-6 rounded-lg border bg-card">
              <h3 className="text-lg font-semibold mb-2">Support 24/7</h3>
              <p className="text-muted-foreground">
                Une assistance disponible à tout moment pour vous aider
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="py-4 border-t">
        <div className="container text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Faculté des Sciences et Techniques de Settat. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
};

export default Home; 