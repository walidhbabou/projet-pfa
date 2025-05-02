
import { chatService } from './api';

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

// Generate unique ID for messages
export const generateMessageId = (): string => {
  return `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

// Process incoming user message and generate a response
export const processMessage = async (message: string, sessionId: string)   : Promise<string> => {
  try {
    // Utiliser l'API backend au lieu du traitement local
    const response = await chatService.sendMessage(message, sessionId);
    return response.response;
  } catch (error) {
    console.error("Erreur lors de l'envoi du message:", error);
    return "Désolé, je ne peux pas vous répondre pour le moment. Veuillez réessayer plus tard.";
  }
};

// Format timestamp for display
export const formatMessageTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Save messages to local storage
export const saveMessagesToStorage = (messages: ChatMessage[]): void => {
  localStorage.setItem('fsts_chat_history', JSON.stringify(messages));
};

// Load messages from local storage
export const loadMessagesFromStorage = (): ChatMessage[] => {
  const saved = localStorage.getItem('fsts_chat_history');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return parsed.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
    } catch (e) {
      console.error('Failed to parse stored messages', e);
      return [];
    }
  }
  return [];
};

// Clear chat history from storage
export const clearChatHistory = (): void => {
  localStorage.removeItem('fsts_chat_history');
};
