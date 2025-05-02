import React, { useState, useEffect, useRef } from "react";
import { Send, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ChatMessage from "./ChatMessage";
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
  text: "Bonjour! Je suis le chatbot de la FSTS. Comment puis-je vous aider aujourd'hui?",
  sender: "bot",
  timestamp: new Date()
};

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
        setSessions(sessionList);
        if (sessionList.length > 0) {
          loadSession(sessionList[0].id);
        } else {
          startNewSession();
        }
      } catch (error) {
        console.error("Erreur chargement sessions", error);
        startNewSession();
      }
    };
    fetchSessions();
  }, []);

  const loadSession = async (sessionId: string) => {
    try {
      const history = await chatService.getSessionMessages(sessionId);
      if (Array.isArray(history)) {
        const parsed = history.flatMap((entry: any) => [
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
        ]);
        setMessages([WelcomeMessage, ...parsed]);
        setCurrentSession(sessionId);
      } else {
        setMessages([WelcomeMessage]);
        setCurrentSession(sessionId);
      }
    } catch (e) {
      console.error("Erreur chargement historique", e);
      setMessages([WelcomeMessage]);
      setCurrentSession(sessionId);
    }
  };

  const startNewSession = () => {
    const newSessionId = `session-${Date.now()}`;
    setCurrentSession(newSessionId);
    setMessages([WelcomeMessage]);
    setSessions(prev => [{ id: newSessionId, lastMessage: "", lastTimestamp: new Date().toISOString(), messageCount: 0 }, ...prev]);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !currentSession) return;

    const userMessage: ChatMessageType = {
      id: generateMessageId(),
      text: inputText,
      sender: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    try {
      const response = await chatService.sendMessage(inputText, currentSession);
      const botResponse: ChatMessageType = {
        id: generateMessageId(),
        text: response.response,
        sender: "bot",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error("Erreur message", error);
      toast({
        title: "Erreur",
        description: "Impossible de traiter votre message.",
        variant: "destructive"
      });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <div className="w-[280px] border-r bg-card flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <Button 
            variant="secondary" 
            className="flex-1 mr-2 justify-start gap-2" 
            onClick={startNewSession}
          >
            <PlusCircle className="h-4 w-4" />
            Nouvelle conversation
          </Button>
          <ThemeToggle />
        </div>
        
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-2">
            {sessions.map((session) => (
              <Button
                key={session.id}
                variant={session.id === currentSession ? "secondary" : "ghost"}
                className="w-full justify-start text-left h-auto py-3"
                onClick={() => loadSession(session.id)}
              >
                <div className="flex flex-col items-start gap-1">
                  <span className="font-medium truncate">
                    {session.lastMessage || "Nouvelle conversation"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(session.lastTimestamp).toLocaleDateString()}
                  </span>
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-background">
  {/* Zone des messages */}
  <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
    {messages.map((message) => (
      <ChatMessage 
        key={message.id + message.timestamp.toISOString()} 
        message={message} 
      />
    ))}

    {isTyping && (
      <div className="flex items-center gap-2 px-4 text-muted-foreground">
        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }}></div>
        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "200ms" }}></div>
        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "400ms" }}></div>
      </div>
    )}
    <div ref={messagesEndRef} />
  </div>

  {/* Zone de saisie */}
  <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 py-3">
    <form 
      onSubmit={handleSendMessage} 
      className="flex items-center gap-2 bg-muted dark:bg-zinc-800 border border-border rounded-xl px-4 py-2 w-full"
    >
      <Input
        ref={inputRef}
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Posez votre question ici..."
        className="flex-1 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
        disabled={isTyping || !currentSession}
      />
      <Button 
        type="submit" 
        size="icon"
        className="bg-primary text-white hover:bg-primary/90"
        disabled={!inputText.trim() || isTyping || !currentSession}
      >
        <Send className="h-4 w-4" />
      </Button>
    </form>
  </div>
</div>


        </div>
  
  );
};

export default ChatInterface;
