import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from "@/utils/api";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, MessageCircle, Clock, User, Bot, AlertCircle, ChevronDown, ChevronRight, Users } from "lucide-react";
import Navbar from '@/components/Navbar';

interface ChatMessage {
  _id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  session_id: string;
  message: string;
  response: string;
  timestamp: string;
}

// Utility function to format dates
const formatDate = (timestamp: string) => {
  const date = new Date(timestamp);
  return {
    full: date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' }),
    time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  };
};

// Floating particles component
const FloatingParticles = React.memo(() => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 6 }, (_, i) => (
      <div
        key={i}
        className="absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-orange-400 rounded-full animate-float"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${i * 0.5}s`,
          animationDuration: `${3 + Math.random() * 2}s`
        }}
        aria-hidden="true"
      />
    ))}
  </div>
));

// Loading spinner component
const LoadingSpinner = React.memo(() => (
  <div className="flex justify-center items-center py-12">
    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
));

// Empty state component
const EmptyState = React.memo(({ hasSearch }: { hasSearch: boolean }) => (
  <div className="text-center py-12 text-gray-500">
    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
    <p>{hasSearch ? "Aucun résultat trouvé" : "Aucune conversation"}</p>
  </div>
));

// Message bubble component
const MessageBubble = React.memo(({ 
  message, 
  isUser, 
  timestamp 
}: { 
  message: string; 
  isUser: boolean; 
  timestamp: string;
}) => {
  const formattedTime = formatDate(timestamp).time;
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[80%] group">
        <div className={`flex items-center space-x-2 mb-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
          {!isUser && (
            <div className="p-1 bg-orange-100 rounded-full">
              <Bot className="w-4 h-4 text-orange-600" aria-hidden="true" />
            </div>
          )}
          <span className="text-xs text-gray-500">
            {isUser ? formattedTime : 'Assistant FSTS'}
          </span>
          {isUser && (
            <div className="p-1 bg-blue-100 rounded-full">
              <User className="w-4 h-4 text-blue-600" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className={`rounded-2xl p-4 shadow-lg group-hover:shadow-xl transition-all duration-300 ${
          isUser 
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-tr-sm' 
            : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 rounded-tl-sm border border-gray-200'
        }`}>
          <p className="text-sm leading-relaxed">{message}</p>
        </div>
      </div>
    </div>
  );
});

const UserRow = React.memo(({ 
  userId, 
  userName, 
  userEmail, 
  sessions, 
  isExpanded, 
  onToggle,
  totalMessages 
}: {
  userId: string;
  userName: string;
  userEmail: string;
  sessions: Record<string, ChatMessage[]>;
  isExpanded: boolean;
  onToggle: () => void;
  totalMessages: number;
}) => {
  const sessionCount = Object.keys(sessions).length;
  const lastActivity = Math.max(...Object.values(sessions).flat().map(m => new Date(m.timestamp).getTime()));
  const lastActivityFormatted = formatDate(new Date(lastActivity).toISOString()).full;

  return (
    <div className="border-b border-gray-100">
      {/* User Header Row */}
      <div 
        className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <button className="text-gray-400 hover:text-gray-600">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <div className="w-8 h-8 bg-blue-600 text-white text-sm font-semibold rounded-full flex items-center justify-center flex-shrink-0">
            {userName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 truncate">{userName}</div>
            <div className="text-sm text-gray-500 truncate">{userEmail}</div>
          </div>
        </div>
        <div className="flex items-center space-x-6 text-sm text-gray-500">
          <div className="text-center">
            <div className="font-semibold text-gray-900">{sessionCount}</div>
            <div>sessions</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-900">{totalMessages}</div>
            <div>messages</div>
          </div>
          <div className="text-center min-w-0">
            <div className="font-semibold text-gray-900 truncate">{lastActivityFormatted}</div>
            <div>dernière activité</div>
          </div>
        </div>
      </div>
      {/* Expanded Sessions */}
      {isExpanded && (
        <div className="bg-gray-50 border-t border-gray-100">
          {Object.entries(sessions).map(([sessionId, messages]) => {
            const sortedMessages = [...messages].sort((a, b) => 
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
            const sessionDate = formatDate(sortedMessages[0].timestamp);

            return (
              <div key={sessionId} className="border-b border-gray-200 last:border-b-0">
                <div className="px-4 py-3 bg-white border-l-4 border-blue-500">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-gray-900">
                        Session {sessionId.split('_')[1]}
                      </span>
                      <span className="text-sm text-gray-500">
                        {sessionDate.full}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 font-medium">
                      {messages.length} échanges
                    </span>
                  </div>
                </div>
                <div className="px-8 py-4 space-y-3 max-h-96 overflow-y-auto">
                  {sortedMessages.slice(0, 3).map((message) => (
                    <div key={message._id} className="space-y-2">
                      <div className="flex justify-end">
                        <div className="bg-blue-600 text-white px-3 py-2 rounded-lg max-w-md text-sm">
                          {message.message.length > 100 ? 
                            `${message.message.substring(0, 100)}...` : 
                            message.message
                          }
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <div className="bg-gray-200 text-gray-800 px-3 py-2 rounded-lg max-w-md text-sm">
                          {message.response.length > 100 ? 
                            `${message.response.substring(0, 100)}...` : 
                            message.response
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                  {sortedMessages.length > 3 && (
                    <div className="text-center">
                      <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                        Voir {sortedMessages.length - 3} messages de plus...
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

const ChatHistory = () => {
  const { toast } = useToast();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const loadChatHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/chat/history');
      
      if (response.data.success) {
        setChatMessages(response.data.data);
      } else {
        const errorMsg = "Impossible de charger l'historique des chats";
        setError(errorMsg);
        toast({
          title: "Erreur",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error);
      const errorMsg = "Une erreur est survenue lors du chargement de l'historique";
      setError(errorMsg);
      toast({
        title: "Erreur",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadChatHistory();
  }, [loadChatHistory]);

  // Memoized filtered and grouped messages
  const groupedMessages = useMemo(() => {
    const filteredMessages = chatMessages.filter(msg => {
      const query = searchQuery.toLowerCase();
      return msg.message.toLowerCase().includes(query) ||
             msg.response.toLowerCase().includes(query) ||
             msg.user_name.toLowerCase().includes(query) ||
             msg.user_email.toLowerCase().includes(query);
    });

    return filteredMessages.reduce((acc, msg) => {
      const userId = msg.user_id;
      if (!acc[userId]) {
        acc[userId] = {
          user_name: msg.user_name,
          user_email: msg.user_email,
          sessions: {}
        };
      }
      
      if (!acc[userId].sessions[msg.session_id]) {
        acc[userId].sessions[msg.session_id] = [];
      }
      
      acc[userId].sessions[msg.session_id].push(msg);
      return acc;
    }, {} as Record<string, { 
      user_name: string; 
      user_email: string; 
      sessions: Record<string, ChatMessage[]> 
    }>);
  }, [chatMessages, searchQuery]);

  const paginatedUsers = useMemo(() => {
    const userEntries = Object.entries(groupedMessages);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return userEntries.slice(startIndex, endIndex);
  }, [groupedMessages, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(Object.keys(groupedMessages).length / itemsPerPage);

  const toggleUserExpansion = useCallback((userId: string) => {
    setExpandedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleRetry = useCallback(() => {
    loadChatHistory();
  }, [loadChatHistory]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse" aria-hidden="true"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse animation-delay-2000" aria-hidden="true"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000" aria-hidden="true"></div>
      </div>

      <FloatingParticles />

      <div className="relative z-10 min-h-screen">
       
        
        <main className="container mx-auto px-4 py-8">
          {/* Header */}
          <header className="text-center mb-8">
          </header>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" aria-hidden="true" />
            <Input
              type="text"
                placeholder="Rechercher par nom, email ou contenu..."
                className="pl-12 pr-4 py-4 bg-transparent border-0 text-lg placeholder-gray-500 focus:ring-2 focus:ring-blue-500/20 rounded-2xl"
              value={searchQuery}
                onChange={handleSearchChange}
                aria-label="Rechercher dans l'historique des conversations"
            />
          </div>
        </div>

          {/* Error State */}
          {error && (
            <div className="max-w-2xl mx-auto mb-8">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <div className="flex-1">
                  <p className="text-red-700">{error}</p>
                </div>
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors duration-200"
                >
                  Réessayer
                </button>
              </div>
            </div>
          )}

          {/* Content */}
        {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="max-w-4xl mx-auto space-y-8">
              {Object.keys(groupedMessages).length === 0 ? (
                <EmptyState hasSearch={!!searchQuery} />
              ) : (
                <>
                  {/* Users List */}
                  <div className="bg-white rounded-lg shadow">
                    {paginatedUsers.map(([userId, { user_name, user_email, sessions }]) => {
                      const totalUserMessages = Object.values(sessions).flat().length;
                      return (
                        <UserRow
                          key={userId}
                          userId={userId}
                          userName={user_name}
                          userEmail={user_email}
                          sessions={sessions}
                          isExpanded={expandedUsers.has(userId)}
                          onToggle={() => toggleUserExpansion(userId)}
                          totalMessages={totalUserMessages}
                        />
                      );
                    })}
                  </div>
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        Page {currentPage} sur {totalPages} ({Object.keys(groupedMessages).length} utilisateurs)
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Précédent
                        </button>
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Suivant
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </main>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default ChatHistory; 