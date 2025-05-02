import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import ChatInterface from '@/components/ChatInterface';
import UserProfile from '@/components/UserProfile';
import Announcements from '@/components/Announcements';
import { authService } from '@/utils/api';
import { Sparkles } from 'lucide-react';

const DashboardPage = () => {
  const isAdmin = authService.isAdmin();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white via-blue-50 to-purple-100">
      <Navbar />

      <div className="flex-1 container mx-auto py-10 px-4">
     
        <Tabs defaultValue="chat" className="space-y-6">
          <TabsList className="bg-muted rounded-xl p-1 shadow-md flex justify-center">
            <TabsTrigger
              value="chat"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md px-4 py-2 transition-all"
            >
              💬 Chat
            </TabsTrigger>
            <TabsTrigger
              value="announcements"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md px-4 py-2 transition-all"
            >
              📢 Annonces
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-md px-4 py-2 transition-all"
            >
              👤 Mon Profil
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl border p-6 h-[70vh]">
             
              <ChatInterface />
            </div>
          </TabsContent>

          <TabsContent value="announcements" className="animate-fade-in">
            <Announcements />
          </TabsContent>

          <TabsContent value="profile" className="animate-fade-in">
            <UserProfile />
          </TabsContent>
        </Tabs>
      </div>

      <footer className="py-6 border-t mt-auto">
        <div className="container text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Faculté des Sciences et Techniques de Settat. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
};

export default DashboardPage;
