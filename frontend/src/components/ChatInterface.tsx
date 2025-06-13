import React, { useState, useEffect, useRef } from "react";
import { Send, PlusCircle, MessageSquare, Bell, User, Bot, Sparkles, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "./ThemeToggle";
import {
  ChatMessage as ChatMessageType,
  generateMessageId,
} from "../utils/chatUtils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { chatService } from "../utils/api";

const WelcomeMessage: ChatMessageType = {
  id: "welcome",
  text: "Bonjour! Je suis l'assistant virtuel de la FSTS. Comment puis-je vous aider aujourd'hui? Je peux répondre à vos questions sur les filières, les inscriptions, les examens et bien plus encore!",
  sender: "bot",
  timestamp: new Date()
};

const quickQuestions = [
  "Quelles sont les filières disponibles ?",
  "Comment s'inscrire en Master ?",
  "Calendrier des examens 2024-2025",
  "Informations sur les bourses"
];

interface ChatHistoryEntry {
  message: string;
  response: string;
  timestamp: string;
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessions, setSessions] = useState<{ id: string; lastMessage: string; lastTimestamp: string; messageCount: number }[]>([]);
  const [currentSession, setCurrentSession] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const sessionList = await chatService.getSessions();
        console.log('Sessions reçues:', sessionList); // Debug log
        if (Array.isArray(sessionList)) {
          setSessions(sessionList);
          if (sessionList.length > 0) {
            loadSession(sessionList[0].id);
          } else {
            startNewSession();
          }
        } else {
          console.warn('Liste de sessions invalide:', sessionList);
          startNewSession();
        }
      } catch (error) {
        console.error("Erreur chargement sessions:", error);
        startNewSession();
      }
    };
    fetchSessions();
  }, []);

  const loadSession = async (sessionId: string) => {
    try {
      console.log('Chargement session:', sessionId); // Debug log
      const history = await chatService.getSessionMessages(sessionId);
      console.log('Historique reçu:', history); // Debug log
      
      if (Array.isArray(history)) {
        const parsed = history.map((entry: ChatHistoryEntry) => [
          {
            id: generateMessageId(),
            text: entry.message,
            sender: "user" as const,
            timestamp: new Date(entry.timestamp)
          },
          {
            id: generateMessageId(),
            text: entry.response,
            sender: "bot" as const,
            timestamp: new Date(entry.timestamp)
          }
        ]).flat();
        
        setMessages([WelcomeMessage, ...parsed]);
        setCurrentSession(sessionId);
      } else {
        console.warn('Historique invalide:', history);
        setMessages([WelcomeMessage]);
        setCurrentSession(sessionId);
      }
    } catch (error) {
      console.error("Erreur chargement historique:", error);
      setMessages([WelcomeMessage]);
      setCurrentSession(sessionId);
    }
  };

  const startNewSession = () => {
    const newSessionId = crypto.randomUUID();
    setCurrentSession(newSessionId);
    setMessages([WelcomeMessage]);
    setSessions(prev => [{ 
      id: newSessionId, 
      lastMessage: "", 
      lastTimestamp: new Date().toISOString(), 
      messageCount: 0 
    }, ...prev]);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !currentSession) {
      console.warn('Message ou session invalide:', { text, currentSession });
      return;
    }

    const userMessage: ChatMessageType = {
      id: generateMessageId(),
      text: text,
      sender: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 1000; // 1 seconde

    const sendWithRetry = async () => {
    try {
        console.log(`Tentative d'envoi ${retryCount + 1}/${maxRetries}:`, { text, sessionId: currentSession });
      const response = await chatService.sendMessage(text.trim(), currentSession);
        console.log('Réponse reçue:', response);
      
      if (response && response.success && Array.isArray(response.data)) {
        // Traiter chaque message de la réponse
        response.data.forEach(msg => {
          const botResponse: ChatMessageType = {
            id: generateMessageId(),
            text: msg.message,
            sender: "bot",
            timestamp: new Date()
          };
          setMessages(prev => [...prev, botResponse]);
        });
        
        setSessions(prev => prev.map(session => 
          session.id === currentSession 
            ? { 
                ...session, 
                lastMessage: text,
                lastTimestamp: new Date().toISOString(),
                messageCount: session.messageCount + 1
              }
            : session
        ));
          return true;
      } else {
        console.error('Réponse invalide:', response);
        throw new Error("Réponse invalide du serveur");
      }
    } catch (error) {
        console.error(`Erreur tentative ${retryCount + 1}:`, error);
        if (retryCount < maxRetries - 1) {
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, retryDelay * retryCount));
          return sendWithRetry();
        }
        throw error;
      }
    };

    try {
      await sendWithRetry();
    } catch (error) {
      console.error("Erreur finale après retries:", error);
      toast({
        title: "Erreur",
        description: "Impossible de traiter votre message après plusieurs tentatives. Veuillez réessayer plus tard.",
        variant: "destructive"
      });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-orange-100 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-gradient-to-r from-blue-400 to-orange-400 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${5 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Main Chat Interface */}
      <div className="relative z-10 flex h-screen">
        {/* Sidebar */}
        <div className="w-80 bg-white/80 backdrop-blur-sm border-r border-white/20 flex flex-col shadow-lg">
          {/* New Chat Button */}
          <div className="p-4 border-b border-white/20">
            <Button 
              onClick={startNewSession}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-500 to-orange-500 text-white py-3 px-4 rounded-2xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
            >
              <PlusCircle className="h-5 w-5" />
              Nouvelle conversation
            </Button>
          </div>
          
          {/* Sessions List */}
          <ScrollArea className="flex-1 p-3 space-y-2">
            <div className="text-xs font-semibold text-gray-500 mb-3 px-2">CONVERSATIONS RÉCENTES</div>
            {sessions.map((session) => (
              <Button
                key={session.id}
                variant={session.id === currentSession ? "secondary" : "ghost"}
                className="w-full justify-start text-left h-auto py-3"
                onClick={() => loadSession(session.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800 truncate text-sm">
                      {session.lastMessage || "Nouvelle conversation"}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(session.lastTimestamp).toLocaleDateString('fr-FR')} • {session.messageCount} messages
                    </div>
                  </div>
                </div>
              </Button>
            ))}
          </ScrollArea>

          {/* Quick Stats */}
          <div className="p-4 border-t border-white/20 bg-gradient-to-r from-blue-50 to-orange-50">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-lg font-bold text-blue-600">{sessions.length}</div>
                <div className="text-xs text-gray-600">Conversations</div>
              </div>
              <div>
                <div className="text-lg font-bold text-orange-600">24/7</div>
                <div className="text-xs text-gray-600">Disponible</div>
              </div>
              <div>
                <div className="text-lg font-bold text-blue-600">IA</div>
                <div className="text-xs text-gray-600">Assistant</div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-white/80 backdrop-blur-sm border-b border-white/20 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-orange-500 rounded-full flex items-center justify-center">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <div className="font-semibold text-gray-800">Assistant FSTS</div>
                <div className="text-sm text-green-600">En ligne • Répond instantanément</div>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 1 && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-orange-100 rounded-full mb-4">
                  <GraduationCap className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Bienvenue sur l'Assistant FSTS</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Posez-moi vos questions sur les filières, inscriptions, examens et services de la faculté.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  {quickQuestions.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      onClick={() => handleSendMessage(question)}
                      className="p-3 text-left bg-white/60 hover:bg-white/80 rounded-xl border border-white/40 transition-all duration-300 hover:shadow-md text-sm"
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {isTyping && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-sm border border-white/40">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: "200ms" }}></div>
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "400ms" }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-white/80 backdrop-blur-sm border-t border-white/20 p-4 shadow-lg">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputText);
              }}
              className="flex items-center gap-3"
            >
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Posez votre question sur la FSTS..."
                  className="w-full bg-white/60 border border-white/40 rounded-2xl px-6 py-4 pr-12 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-300 transition-all duration-300 text-gray-800 placeholder-gray-500"
                  disabled={isTyping}
                />
              </div>
              <Button 
                type="submit"
                disabled={!inputText.trim() || isTyping}
                className="bg-gradient-to-r from-blue-500 to-orange-500 text-white p-4 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:transform-none"
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.4; }
          50% { transform: translateY(-30px) rotate(180deg); opacity: 0.8; }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animation-delay-2000 { animation-delay: 2s; }
      `}</style>
    </div>
  );
};

// Composant ChatMessage
const ChatMessage = ({ message }: { message: ChatMessageType }) => {
  const isBot = message.sender === "bot";
  
  return (
    <div className={`flex items-start gap-3 ${isBot ? '' : 'flex-row-reverse'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isBot 
          ? 'bg-gradient-to-br from-blue-500 to-orange-500' 
          : 'bg-gradient-to-br from-gray-600 to-gray-700'
      }`}>
        {isBot ? (
          <Bot className="h-5 w-5 text-white" />
        ) : (
          <User className="h-5 w-5 text-white" />
        )}
      </div>
      
      <div className={`max-w-[70%] ${isBot ? '' : 'text-right'}`}>
        <div className={`inline-block p-4 rounded-2xl shadow-sm border ${
          isBot 
            ? 'bg-white/80 backdrop-blur-sm border-white/40 text-gray-800' 
            : 'bg-gradient-to-r from-blue-500 to-orange-500 text-white border-transparent'
        }`}>
          <p className="text-sm leading-relaxed">{message.text}</p>
        </div>
        <div className={`text-xs text-gray-500 mt-1 ${isBot ? 'text-left' : 'text-right'}`}>
          {message.timestamp.toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>
    </div>
  );
};

if (!crypto.randomUUID) {
  crypto.randomUUID = (() => {
    return ('10000000-1000-4000-8000-100000000000').replace(/[018]/g, c =>
      (parseInt(c) ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> (parseInt(c) / 4)).toString(16)
    ) as `${string}-${string}-${string}-${string}-${string}`;
  }) as () => `${string}-${string}-${string}-${string}-${string}`;
}
         
export default ChatInterface;
