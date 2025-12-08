import { GoogleSignin } from '../utils/googleSignInConfig';
import axios from 'axios';
import { GoogleCalendarEvent } from '../types';

class GoogleCalendarService {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  async getEvents(
    calendarId: string = 'primary',
    timeMin?: string,
    timeMax?: string,
    maxResults: number = 100
  ): Promise<GoogleCalendarEvent[]> {
    try {
      const params: any = {
        maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      };

      if (timeMin) params.timeMin = timeMin;
      if (timeMax) params.timeMax = timeMax;

      const response = await axios.get(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
        {
          headers: this.getHeaders(),
          params,
        }
      );

      return response.data.items || [];
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error);
      throw error;
    }
  }

  async createEvent(
    calendarId: string = 'primary',
    event: Partial<GoogleCalendarEvent>
  ): Promise<GoogleCalendarEvent> {
    try {
      const response = await axios.post(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
        event,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating Google Calendar event:', error);
      throw error;
    }
  }

  async updateEvent(
    calendarId: string = 'primary',
    eventId: string,
    event: Partial<GoogleCalendarEvent>
  ): Promise<GoogleCalendarEvent> {
    try {
      const response = await axios.put(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
        event,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating Google Calendar event:', error);
      throw error;
    }
  }

  async deleteEvent(calendarId: string = 'primary', eventId: string): Promise<void> {
    try {
      await axios.delete(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
        { headers: this.getHeaders() }
      );
    } catch (error) {
      console.error('Error deleting Google Calendar event:', error);
      throw error;
    }
  }
}

export default GoogleCalendarService;
