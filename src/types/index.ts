export interface User {
  id: string;
  email: string;
  name: string;
  canvas_token?: string;
  canvas_url?: string;
  google_calendar_token?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  source: 'manual' | 'canvas' | 'google_calendar';
  canvas_assignment_id?: string;
  google_event_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CanvasAssignment {
  id: number;
  name: string;
  description: string;
  due_at: string;
  points_possible: number;
  course_id: number;
  html_url: string;
  submission_types: string[];
}

export interface CanvasAnnouncement {
  id: number;
  title: string;
  message: string;
  posted_at: string;
  author: {
    display_name: string;
    avatar_image_url: string;
  };
  html_url: string;
  context_code: string;
}

export interface CanvasCourse {
  id: number;
  name: string;
  course_code: string;
  workflow_state: string;
  account_id: number;
  start_at: string;
  end_at: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
}
