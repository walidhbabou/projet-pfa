// Mise à jour du fichier App.tsx pour inclure les nouvelles routes

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import ChatPage from "./pages/chat";
import AnnouncementsPage from "./pages/announcements";
import ProfilePage from "./pages/profile";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import ErrorBoundary from "./components/ErrorBoundary";
import { useEffect, useState } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

interface ProtectedRouteProps {
  element: React.ReactNode;
  admin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element, admin = false }) => {
  const token = localStorage.getItem('fsts_token');
  const userStr = localStorage.getItem('fsts_user');
  let isAdmin = false;

  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      isAdmin = user.role === 'admin';
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }

  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  if (admin && !isAdmin) {
    return <Navigate to="/chat" replace />;
  }

  return <ErrorBoundary>{element}</ErrorBoundary>;
};

const App = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('fsts_token');
        if (!token) {
          setIsLoading(false);
          return;
        }

        // Vérifier si le token est valide
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          localStorage.removeItem('fsts_token');
          localStorage.removeItem('fsts_user');
        }
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('fsts_token');
        localStorage.removeItem('fsts_user');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route
                path="/auth"
                element={
                  localStorage.getItem('fsts_token') ?
                    <Navigate to="/chat" replace /> :
                    <AuthPage />
                }
              />
              <Route
                path="/admin"
                element={<ProtectedRoute element={<Admin />} admin={true} />}
              />
              <Route
                path="/chat"
                element={<ProtectedRoute element={<ChatPage />} />}
              />
              <Route
                path="/announcements"
                element={<ProtectedRoute element={<AnnouncementsPage />} />}
              />
              <Route
                path="/profile"
                element={<ProtectedRoute element={<ProfilePage />} />}
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;