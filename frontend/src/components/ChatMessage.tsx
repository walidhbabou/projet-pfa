import React from 'react';
import { User, Bot } from 'lucide-react';

interface ChatMessageProps {
  message: {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
  };
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isBot = message.sender === 'bot';

  return (
<div className={`px-4 py-4 ${isBot ? 'bg-gray-100 dark:bg-zinc-800' : 'bg-gray-200 dark:bg-zinc-700'}`}>
  <div className="max-w-3xl mx-auto flex gap-4">
    <div className="flex-shrink-0">
      {isBot ? (
        <div className="w-8 h-8 rounded-lg bg-gray-300 dark:bg-zinc-600 flex items-center justify-center">
          <Bot className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </div>
      ) : (
        <div className="w-8 h-8 rounded-lg bg-gray-300 dark:bg-zinc-600 flex items-center justify-center">
          <User className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        </div>
      )}
    </div>
    <div className="flex-1">
      <div className="font-medium mb-1 text-sm text-gray-800 dark:text-gray-200">
        {isBot ? 'Assistant FSTS' : 'Vous'}
      </div>
      <div className={`text-sm ${isBot ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-gray-100'}`}>
        {message.text}
      </div>
    </div>
  </div>
</div>

  );
};

export default ChatMessage;