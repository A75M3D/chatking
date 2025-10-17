import React, { useState, useRef } from 'react';
import { supabase } from '../services/supabase';
import { MicIcon, SendIcon } from './icons';

interface AudioRecorderProps {
    senderId: string;
    receiverId: string;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ senderId, receiverId }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };
            mediaRecorderRef.current.onstop = handleStop;
            audioChunksRef.current = [];
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone. Please check permissions.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsSending(true);
        }
    };

    const handleStop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const fileName = `audio-recording-${Date.now()}.webm`;
        
        const { data, error } = await supabase.storage
            .from('media') // Assumes a 'media' bucket exists in Supabase Storage
            .upload(`${senderId}/${fileName}`, audioBlob);

        if (error) {
            console.error('Error uploading audio:', error);
            alert('Failed to upload recording.');
            setIsSending(false);
            return;
        }

        const { data: publicUrlData } = supabase.storage
            .from('media')
            .getPublicUrl(data.path);
        
        if (!publicUrlData) {
            console.error('Could not get public URL for audio');
            setIsSending(false);
            return;
        }

        const { error: messageError } = await supabase.from('messages').insert({
            sender_id: senderId,
            receiver_id: receiverId,
            media_url: publicUrlData.publicUrl,
        });

        if (messageError) {
            console.error('Error saving message:', messageError);
        }
        
        // Clean up stream
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
        setIsSending(false);
    };

    return (
        <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isSending}
            className={`p-2 rounded-full transition-colors ${
                isRecording ? 'bg-red-500 text-white animate-pulse' : 'hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
        >
            {isRecording ? <SendIcon className="w-6 h-6" /> : <MicIcon className="w-6 h-6" />}
        </button>
    );
};

export default AudioRecorder;
