import React from 'react';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

const AudioPlayer: React.FC<{ src: string }> = ({ src }) => {
  return (
    <audio controls src={src} className="w-full max-w-xs h-10">
      Your browser does not support the audio element.
    </audio>
  );
};


const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwnMessage }) => {
  const bubbleClasses = isOwnMessage
    ? 'bg-primary-600 text-white self-end rounded-br-none'
    : 'bg-white dark:bg-gray-700 self-start rounded-bl-none';

  return (
    <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        <div
        className={`flex max-w-sm md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl shadow ${bubbleClasses}`}
        >
        {message.content && <p>{message.content}</p>}
        {message.media_url && <AudioPlayer src={message.media_url} />}
        </div>
        <p className="mt-1 text-xs text-gray-400">
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
    </div>
  );
};

export default MessageBubble;
