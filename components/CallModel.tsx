import React from 'react';
import { Call, CallType } from '../types';
import { PhoneIcon } from './icons';

interface CallModalProps {
  call: Call;
  onEndCall: () => void;
}

const CallModal: React.FC<CallModalProps> = ({ call, onEndCall }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="flex flex-col items-center justify-between w-full max-w-sm p-8 bg-white rounded-lg shadow-xl dark:bg-gray-800 h-96">
        <div className="text-center">
          <img
            src={call.contact.avatar_url || `https://picsum.photos/seed/${call.contact.id}/128/128`}
            alt={call.contact.username}
            className="w-32 h-32 mx-auto rounded-full ring-4 ring-primary-300 dark:ring-primary-700"
          />
          <h2 className="mt-4 text-2xl font-bold">{call.contact.username}</h2>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            {call.type === CallType.AUDIO ? 'Audio' : 'Video'} Call - Connecting...
          </p>
        </div>
        
        {/* Placeholder for video stream */}
        {call.type === CallType.VIDEO && (
             <div className="w-full h-32 bg-black flex items-center justify-center text-white text-sm rounded-md">
                Video stream would appear here
            </div>
        )}

        {/* Note about functionality */}
        <p className="text-xs text-center text-gray-400 dark:text-gray-500">
          Note: This is a UI demonstration. Full call functionality requires a WebRTC integration.
        </p>

        <button
          onClick={onEndCall}
          className="flex items-center justify-center w-16 h-16 bg-red-500 rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          <PhoneIcon className="w-8 h-8 text-white transform rotate-[135deg]" />
        </button>
      </div>
    </div>
  );
};

export default CallModal;
