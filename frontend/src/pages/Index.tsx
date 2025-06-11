import React from 'react';
import { Sparkles, BookOpen, Users, Award, ArrowRight } from "lucide-react";
import { Link } from 'react-router-dom';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-orange-400 rounded-full animate-float`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + Math.random() * 2}s`
            }}
          ></div>
        ))}
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header with logo */}
        <header className="pt-8 pb-4">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-block p-2 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg transform hover:scale-105 transition-all duration-500">
              <img
                src="/logo-fsts.png"
            alt="Logo FSTS"
                className="w-24 h-24 rounded-xl shadow-inner"
          />
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 container mx-auto flex flex-col justify-center items-center px-4 text-center">
          <div className="flex flex-col items-center space-y-8 max-w-4xl">
            
            {/* Animated icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-orange-400 rounded-full blur-md opacity-60 animate-pulse"></div>
              <div className="relative bg-white p-4 rounded-full shadow-xl animate-bounce">
                <Sparkles className="w-12 h-12 text-blue-600" />
              </div>
            </div>

            {/* Main title with gradient and animation */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight">
                <span className="block bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 bg-clip-text text-transparent animate-fade-in-up">
                  Bienvenue à l'assistant virtuel
                </span>
                <span className="block bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 bg-clip-text text-transparent animate-fade-in-up animation-delay-500">
                  de la FSTS
                </span>
          </h1>

              <div className="h-1 w-32 bg-gradient-to-r from-blue-500 to-orange-500 mx-auto rounded-full animate-fade-in animation-delay-1000"></div>
            </div>

            {/* Subtitle */}
            <p className="text-xl sm:text-2xl text-gray-700 max-w-3xl leading-relaxed animate-fade-in-up animation-delay-1500">
              Votre guide intelligent pour naviguer dans l'univers académique de la 
              <span className="font-semibold text-blue-600"> Faculté des Sciences et Techniques de Settat</span>
            </p>

            {/* Features cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 w-full max-w-4xl">
              {[
                { icon: BookOpen, title: "Filières", desc: "Découvrez nos programmes" },
                { icon: Users, title: "Inscriptions", desc: "Procédures simplifiées" },
                { icon: Award, title: "Services", desc: "Support étudiant" }
              ].map((feature, index) => (
                <div
                  key={index}
                  className={`bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-500 animate-fade-in-up`}
                  style={{ animationDelay: `${2000 + index * 200}ms` }}
                >
                  <feature.icon className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                  <h3 className="font-bold text-lg text-gray-800 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <div className="mt-12 animate-fade-in-up animation-delay-3000">
          <Link to="/auth">
                <button className="group relative bg-gradient-to-r from-blue-600 to-orange-500 text-white font-bold py-4 px-8 rounded-2xl text-lg shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 overflow-hidden">
                  <span className="relative z-10 flex items-center space-x-2">
                    <span>Commencer l'exploration</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                </button>
              </Link>
            </div>

            {/* Stats section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 w-full max-w-3xl">
              {[
                { number: "15+", label: "Filières" },
                { number: "3000+", label: "Étudiants" },
                { number: "100+", label: "Enseignants" },
                { number: "20+", label: "Années d'excellence" }
              ].map((stat, index) => (
                <div
                  key={index}
                  className={`text-center animate-fade-in-up`}
                  style={{ animationDelay: `${3500 + index * 100}ms` }}
                >
                  <div className="text-3xl font-black bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent mb-2">
                    {stat.number}
                  </div>
                  <div className="text-gray-600 text-sm font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-8 border-t border-gray-200/50 bg-white/30 backdrop-blur-sm">
          <div className="container mx-auto px-4 text-center">
            <p className="text-gray-600 text-sm">
              &copy; {new Date().getFullYear()} Faculté des Sciences et Techniques de Settat. Tous droits réservés.
            </p>
          </div>
        </footer>
      </div>

      <style>{`
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
        
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        
        .hover:shadow-3xl:hover {
          box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </div>
  );
};

export default Index;
