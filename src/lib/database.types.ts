export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      chapter_i_events: {
        Row: {
          event_id: string;
          created_at: string;
          session_id: string;
          event_type: string;
          event_data: Json;
        };
        Insert: {
          event_id: string;
          session_id: string;
          event_type: string;
          event_data: Json;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: {
      chapter_i_telemetry_funnel: {
        Row: {
          visits: number;
          sessions: number;
          question_1_started: number;
          question_1_completed: number;
          question_2_started: number;
          question_2_completed: number;
          question_3_started: number;
          question_3_completed: number;
          question_4_started: number;
          question_4_completed: number;
          reveal_sessions: number;
          yes_responses: number;
          no_responses: number;
          reschedule_actions: number;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
