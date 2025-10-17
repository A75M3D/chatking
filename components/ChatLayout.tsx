import React, { useState, useEffect, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { Profile, Call } from '../types';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import CallModal from './CallModal';

interface ChatLayoutProps {
  session: Session;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ChatLayout: React.FC<ChatLayoutProps> = ({ session, theme, toggleTheme }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeContact, setActiveContact] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [call, setCall] = useState<Call | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchProfiles = async () => {
      setLoading(true);
      const { data: userProfileData, error: userProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (userProfileError) {
        console.error("Error fetching user profile:", userProfileError);
      } else {
        setCurrentUserProfile(userProfileData);
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', session.user.id);

      if (error) {
        console.error('Error fetching profiles:', error);
      } else {
        setProfiles(data);
        if (data && data.length > 0) {
          setActiveContact(data[0]);
        }
      }
      setLoading(false);
    };
    fetchProfiles();
  }, [session.user.id]);

  const handleStartCall = useCallback((callDetails: Call) => {
    setCall(callDetails);
  }, []);

  const handleEndCall = useCallback(() => {
    setCall(null);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  }

  return (
    <div className="flex h-screen overflow-hidden text-gray-800 bg-white dark:bg-gray-800 dark:text-gray-200">
      <Sidebar
        profiles={profiles}
        activeContact={activeContact}
        setActiveContact={setActiveContact}
        loading={loading}
        theme={theme}
        toggleTheme={toggleTheme}
        onLogout={handleLogout}
        currentUserProfile={currentUserProfile}
      />
      <main className="flex-1 flex flex-col">
        {activeContact && session ? (
          <ChatWindow
            contact={activeContact}
            session={session}
            onStartCall={handleStartCall}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            Select a contact to start chatting.
          </div>
        )}
      </main>
      {call && <CallModal call={call} onEndCall={handleEndCall} />}
    </div>
  );
};

export default ChatLayout;
