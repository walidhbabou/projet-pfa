import React from 'react';
import Navbar from "@/components/Navbar";
import ChatInterface from '@/components/ChatInterface';

const ChatPage = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/* Navbar en haut */}
      <Navbar />

      {/* Zone principale */}
      <div className="flex-1">
        <ChatInterface />
      </div>
    </div>
  );
};

export default ChatPage;
