import React, { useState, useEffect } from "react";
import { Sparkles, BookOpen, Users, MessageCircle, Bot, ArrowRight, GraduationCap } from "lucide-react";
import LoginForm from "@/components/LoginForm";
import RegisterForm from "@/components/RegisterForm";
import { Navigate, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const onAuthSuccess = () => {
    // Récupérer les données utilisateur du localStorage
    const userData = localStorage.getItem('fsts_user');
    const user = userData ? JSON.parse(userData) : null;

    toast({
      title: "Connexion réussie",
      description: user?.role === 'admin' 
        ? "Bienvenue dans l'interface d'administration FSTS"
        : "Bienvenue sur l'assistant virtuel FSTS",
    });

    // Rediriger en fonction du rôle
    if (user?.role === 'admin') {
      navigate("/admin");
    } else {
      navigate("/chat");
    }
  };

  // Fonction pour vérifier la connexion au backend
  const checkBackendConnection = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/health');
      if (!response.ok) {
        throw new Error('Backend non accessible');
      }
      console.log('Backend accessible');
    } catch (error) {
      console.error('Backend non accessible:', error);
      toast({
        title: "Erreur de connexion",
        description: "Le serveur backend n'est pas accessible. Veuillez vérifier que le serveur est en cours d'exécution.",
        variant: "destructive",
      });
    }
  };

  // Vérifier la connexion au backend au chargement de la page
  useEffect(() => {
    checkBackendConnection();
  }, []);

  // Vérifier si l'utilisateur est déjà authentifié
  const token = localStorage.getItem('fsts_token');
  if (token) {
    return <Navigate to="/chat" replace />;
  }

  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 via-white to-orange-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-orange-400 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${4 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Left section (form) */}
      <div className="w-full lg:w-1/2 flex flex-col p-8 lg:p-16 justify-center relative z-10">
        {/* Header with logo */}
        <div className="flex items-center mb-12 animate-fade-in-up">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-orange-400 rounded-xl blur-sm opacity-60"></div>
            <div className="relative bg-gradient-to-br from-blue-600 to-orange-500 rounded-xl p-3 shadow-xl">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="ml-4">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent">
              FSTS Assistant
            </h2>
            <p className="text-gray-500 text-sm">Intelligence Artificielle</p>
          </div>
        </div>

        <div className="max-w-md mx-auto w-full">
          {/* Title section */}
          <div className="text-center mb-8 animate-fade-in-up animation-delay-500">
            <h1 className="text-4xl font-black mb-4">
              <span className="block bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                {isLogin ? "Bon retour" : "Rejoignez-nous"}
              </span>
              <span className="block bg-gradient-to-r from-orange-500 to-orange-700 bg-clip-text text-transparent text-2xl">
                sur FSTS
              </span>
            </h1>
            <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-orange-500 mx-auto rounded-full mb-4"></div>
            <p className="text-gray-600 text-lg">
              {isLogin ? "Connectez-vous à votre espace personnel" : "Créez votre compte étudiant"}
            </p>
          </div>

          {/* Form container */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 mb-8 animate-fade-in-up animation-delay-1000 border border-white/20">
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

          {/* Toggle section */}
          <div className="text-center animate-fade-in-up animation-delay-1500">
            <p className="text-gray-600 mb-4">
              {isLogin ? "Première visite ?" : "Déjà inscrit ?"}
            </p>
            <button 
              onClick={toggleForm}
              className="group relative bg-gradient-to-r from-blue-500 to-orange-500 text-white font-bold py-3 px-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
            >
              <span className="relative z-10 flex items-center space-x-2">
                <span>{isLogin ? "Créer un compte" : "Se connecter"}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>
      </div>

      {/* Right section (illustration) */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-orange-600"></div>
        
        {/* Animated patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-32 h-32 border-2 border-white rounded-full animate-spin-slow"></div>
          <div className="absolute bottom-10 right-10 w-24 h-24 border-2 border-white rounded-full animate-spin-slow animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 border-2 border-white rounded-full animate-spin-slow animation-delay-4000"></div>
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center p-16 text-white">
          {/* Logo section */}
          <div className="mb-8 animate-fade-in-up">
            <div className="relative">
              <div className="absolute inset-0 bg-white rounded-full blur-lg opacity-30 animate-pulse"></div>
              <div className="relative bg-white rounded-full p-6 shadow-2xl">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                  FST
                </div>
              </div>
            </div>
          </div>

          {/* Illustration */}
          <div className="mb-8 animate-fade-in-up animation-delay-500">
            <div className="relative w-80 h-60">
              {/* Chat bubbles */}
              <div className="absolute top-0 left-0 bg-white/20 backdrop-blur-sm rounded-2xl p-4 shadow-lg animate-float">
                <MessageCircle className="w-8 h-8 mb-2" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse animation-delay-200"></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse animation-delay-400"></div>
                </div>
              </div>

              <div className="absolute top-12 right-0 bg-white/20 backdrop-blur-sm rounded-2xl p-4 shadow-lg animate-float animation-delay-1000">
                <Bot className="w-8 h-8 mb-2" />
                <div className="text-sm">Assistant IA</div>
              </div>

              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-white/20 backdrop-blur-sm rounded-2xl p-6 shadow-lg animate-float animation-delay-2000">
                <GraduationCap className="w-10 h-10 mx-auto mb-2" />
                <div className="text-center text-sm">Votre succès académique</div>
              </div>

              {/* Connecting lines */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 320 240">
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
                  </linearGradient>
                </defs>
                <path
                  d="M80,60 Q160,20 240,80"
                  stroke="url(#lineGradient)"
                  strokeWidth="2"
                  fill="none"
                  className="animate-draw"
                />
                <path
                  d="M160,120 Q200,160 240,200"
                  stroke="url(#lineGradient)"
                  strokeWidth="2"
                  fill="none"
                  className="animate-draw animation-delay-1000"
                />
              </svg>
            </div>
          </div>

          {/* Text content */}
          <div className="text-center animate-fade-in-up animation-delay-1000">
            <h2 className="text-3xl font-black mb-4 leading-tight">
              Votre Assistant Intelligent
              <br />
              <span className="text-orange-300">FSTS</span>
            </h2>
            <p className="text-white/90 text-lg leading-relaxed max-w-md">
              Découvrez une nouvelle façon d'interagir avec votre faculté. 
              Posez vos questions, explorez les filières et accédez instantanément 
              aux informations dont vous avez besoin.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 mt-8 animate-fade-in-up animation-delay-1500">
            {[
              { icon: BookOpen, label: "Cours" },
              { icon: Users, label: "Communauté" },
              { icon: MessageCircle, label: "Support 24/7" }
            ].map((feature, index) => (
              <div key={index} className="text-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 mb-2 inline-block">
                  <feature.icon className="w-6 h-6" />
                </div>
                <div className="text-xs text-white/80">{feature.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
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
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes draw {
          from { stroke-dasharray: 200; stroke-dashoffset: 200; }
          to { stroke-dasharray: 200; stroke-dashoffset: 0; }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
        
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        
        .animate-draw {
          animation: draw 2s ease-out forwards;
        }
        
        
      `}</style>
    </div>
  );
};

export default AuthPage;