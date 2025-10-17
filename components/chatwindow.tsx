import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { Profile, Message, Call, CallType } from '../types';
import { supabase } from '../services/supabase';
import { geminiService } from '../services/geminiService';
import MessageBubble from './MessageBubble';
import AudioRecorder from './AudioRecorder';
import { PhoneIcon, VideoIcon, SparklesIcon } from './icons';

interface ChatWindowProps {
  contact: Profile;
  session: Session;
  onStartCall: (call: Call) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ contact, session, onStartCall }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:sender_id(username)')
      .or(`(sender_id.eq.${session.user.id},receiver_id.eq.${contact.id}),(sender_id.eq.${contact.id},receiver_id.eq.${session.user.id})`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      const formattedMessages = data.map(m => ({...m, sender_username: (m.sender as { username: string }).username }));
      setMessages(formattedMessages);
    }
    setLoading(false);
  }, [session.user.id, contact.id]);

  useEffect(() => {
    fetchMessages();
  }, [contact, fetchMessages]);
  
  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${session.user.id}:${contact.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
           const newMessage = payload.new as Message;
           if (
             (newMessage.sender_id === session.user.id && newMessage.receiver_id === contact.id) ||
             (newMessage.sender_id === contact.id && newMessage.receiver_id === session.user.id)
           ) {
                const { data: senderData, error } = await supabase.from('profiles').select('username').eq('id', newMessage.sender_id).single();
                if(!error) {
                    setMessages((prev) => [...prev, {...newMessage, sender_username: senderData.username }]);
                }
           }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session.user.id, contact.id]);
  
  return (
    <div className="flex-1 flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center">
          <img
            src={contact.avatar_url || `https://picsum.photos/seed/${contact.id}/40/40`}
            alt={contact.username}
            className="w-10 h-10 rounded-full mr-3"
          />
          <h2 className="text-lg font-semibold">{contact.username}</h2>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => onStartCall({ type: CallType.AUDIO, contact })} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <PhoneIcon className="w-6 h-6" />
          </button>
          <button onClick={() => onStartCall({ type: CallType.VIDEO, contact })} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
            <VideoIcon className="w-6 h-6" />
          </button>
        </div>
      </header>
      <div className="flex-1 p-4 overflow-y-auto bg-gray-100 dark:bg-gray-900">
        {loading ? (
          <div className="text-center">Loading messages...</div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} isOwnMessage={msg.sender_id === session.user.id} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      <MessageInput contact={contact} session={session} messages={messages} />
    </div>
  );
};


interface MessageInputProps {
  contact: Profile;
  session: Session;
  messages: Message[];
}

const MessageInput: React.FC<MessageInputProps> = ({ contact, session, messages }) => {
  const [content, setContent] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim() === '') return;

    await supabase.from('messages').insert({
      sender_id: session.user.id,
      receiver_id: contact.id,
      content: content,
    });
    setContent('');
  };

  const handleSuggestReply = async () => {
      setIsSuggesting(true);
      const suggestion = await geminiService.suggestReply(messages.slice(-5)); // Get suggestion based on last 5 messages
      setContent(suggestion);
      setIsSuggesting(false);
  }

  return (
    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
        <AudioRecorder receiverId={contact.id} senderId={session.user.id} />
        <button type="button" onClick={handleSuggestReply} disabled={isSuggesting} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50">
            <SparklesIcon className={`w-6 h-6 text-yellow-500 ${isSuggesting ? 'animate-pulse' : ''}`} />
        </button>
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 w-full px-4 py-2 bg-gray-100 border-transparent rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700"
        />
      </form>
    </div>
  );
}

export default ChatWindow;
