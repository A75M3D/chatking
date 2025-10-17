export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
}

export interface Message {
  id: number;
  created_at: string;
  content: string | null;
  media_url: string | null;
  sender_id: string;
  receiver_id: string;
  sender_username?: string;
}

export enum CallType {
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
}

export interface Call {
    type: CallType;
    contact: Profile;
}
