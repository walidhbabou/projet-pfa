import React, { useState } from "react";
import { Sparkles } from "lucide-react";
import LoginForm from "@/components/LoginForm";
import RegisterForm from "@/components/RegisterForm";
import { Navigate, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Vérifier si l'utilisateur est déjà authentifié
  const token = localStorage.getItem('fsts_token');
  if (token) {
    return <Navigate to="/chat" replace />;
  }

  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  // Fonction de callback pour le succès de l'authentification
  const onAuthSuccess = () => {
    toast({
      title: "Connexion réussie",
      description: "Bienvenue sur l'assistant virtuel FSTS",
    });
    navigate("/chat");  
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left section (form) */}
      <div className="w-full lg:w-1/2 flex flex-col p-8 lg:p-16 justify-center">
        <div className="flex items-center mb-12">
          <div className="h-10 w-10 bg-primary rounded-md flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h2 className="ml-3 text-xl font-bold text-gray-800">FSTS Chatbot</h2>
        </div>

        <div className="max-w-md mx-auto w-full">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {isLogin ? "Bienvenue" : "Créer un compte"}
          </h1>
          <p className="text-gray-500 mb-8">
            {isLogin ? "Veuillez entrer vos identifiants" : "Veuillez remplir les informations suivantes"}
          </p>

          <div className="relative mb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? "login" : "register"}
                initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                {isLogin ? 
                  <LoginForm onSuccess={onAuthSuccess} /> : 
                  <RegisterForm onSuccess={() => setIsLogin(true)} />
                }
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="text-center">
            <p className="text-gray-500 mb-2">
              {isLogin ? "Vous n'avez pas de compte ?" : "Vous avez déjà un compte ?"}
            </p>
            <button 
              onClick={toggleForm}
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              {isLogin ? "S'inscrire" : "Se connecter"}
            </button>
          </div>

          {isLogin && (
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right section (illustration) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-tr from-purple-600 to-purple-400 items-center justify-center">
        <div className="max-w-md">
          <motion.div
            className="text-white mb-6 flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Logo FSTS */}
            <div className="bg-white rounded-full p-4 shadow-lg mb-4">
                <img
                    src="/logo-fsts.png"
                    alt="Logo FSTS"
                    className="w-16 h-16 rounded-full shadow-md"
                />
            </div>
          </motion.div>
          
          <motion.div
            className="text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <svg width="100%" height="100%" viewBox="0 0 500 300" xmlns="http://www.w3.org/2000/svg">
              <g fill="none" stroke="currentColor" strokeWidth="1.5">
                {/* Stylized chat bubbles and communication icons */}
                <circle cx="150" cy="100" r="40" strokeOpacity="0.2" />
                <circle cx="350" cy="100" r="30" strokeOpacity="0.2" />
                <circle cx="250" cy="200" r="50" strokeOpacity="0.2" />
                <path d="M120,150 Q200,70 280,150" strokeOpacity="0.3" />
                <path d="M200,200 Q250,130 300,200" strokeOpacity="0.3" />
                
                {/* Chat bubble with dots */}
                <rect x="150" y="80" width="200" height="100" rx="20" strokeOpacity="0.8" />
                <circle cx="200" cy="130" r="5" fill="white" />
                <circle cx="230" cy="130" r="5" fill="white" />
                <circle cx="260" cy="130" r="5" fill="white" />
                
                {/* Large chat bubble */}
                <path d="M100,200 Q100,250 150,280 L170,320 L190,280 Q240,280 240,230 L240,200 Q240,150 170,150 Q100,150 100,200Z" strokeOpacity="0.8" />
                
                {/* Robot/assistant icon */}
                <rect x="320" y="180" width="120" height="100" rx="10" strokeOpacity="0.8" />
                <circle cx="350" cy="210" r="10" fill="white" />
                <circle cx="410" cy="210" r="10" fill="white" />
                <path d="M350,240 Q380,260 410,240" stroke="white" strokeWidth="2" />
              </g>
            </svg>
          </motion.div>
          
          <div className="text-center text-white mt-6">
            <h2 className="text-2xl font-bold mb-2">Assistant Virtuel FSTS</h2>
            <p className="text-white/80">
              Accédez facilement aux ressources de la faculté et obtenez des réponses instantanées à vos questions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;