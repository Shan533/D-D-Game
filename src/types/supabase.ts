export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          username: string;
          created_at: string;
          updated_at: string;
          email_verified: boolean;
          auth_provider: string;
          last_login: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          username: string;
          created_at?: string;
          updated_at?: string;
          email_verified?: boolean;
          auth_provider?: string;
          last_login?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string;
          created_at?: string;
          updated_at?: string;
          email_verified?: boolean;
          auth_provider?: string;
          last_login?: string | null;
        };
      };
      game_sessions: {
        Row: {
          id: string;
          user_id: string;
          template_id: string;
          game_state: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          template_id: string;
          game_state: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          template_id?: string;
          game_state?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      game_history: {
        Row: {
          id: string;
          session_id: string;
          turn_number: number;
          action: string;
          result: string;
          state_changes: Json | null;
          is_key_event: boolean;
          event_type: string | null;
          event_description: string | null;
          related_npcs: string[] | null;
          impact: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          turn_number: number;
          action: string;
          result: string;
          state_changes?: Json | null;
          is_key_event?: boolean;
          event_type?: string | null;
          event_description?: string | null;
          related_npcs?: string[] | null;
          impact?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          turn_number?: number;
          action?: string;
          result?: string;
          state_changes?: Json | null;
          is_key_event?: boolean;
          event_type?: string | null;
          event_description?: string | null;
          related_npcs?: string[] | null;
          impact?: Json | null;
          created_at?: string;
        };
      };
      achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          template_id: string;
          unlocked_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_id: string;
          template_id: string;
          unlocked_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          achievement_id?: string;
          template_id?: string;
          unlocked_at?: string;
        };
      };
    };
  };
} 