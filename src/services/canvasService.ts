import axios, { AxiosResponse } from 'axios';
import { CanvasAssignment, CanvasCourse, CanvasAnnouncement } from '../types';

class CanvasService {
  private baseURL: string;
  private token: string;

  constructor(canvasUrl: string, accessToken: string) {
    this.baseURL = `${canvasUrl}/api/v1`;
    this.token = accessToken;
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };
  }

  async getCourses(): Promise<CanvasCourse[]> {
    try {
      const response: AxiosResponse<CanvasCourse[]> = await axios.get(
        `${this.baseURL}/courses`,
        {
          headers: this.getHeaders(),
          params: {
            enrollment_state: 'active',
            include: ['term'],
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching Canvas courses:', error);
      throw error;
    }
  }

  async getAssignments(courseId?: number): Promise<CanvasAssignment[]> {
    try {
      let url = `${this.baseURL}/courses`;

      if (courseId) {
        url += `/${courseId}/assignments`;
      } else {
        // Get assignments from all courses
        const courses = await this.getCourses();
        const allAssignments: CanvasAssignment[] = [];

        for (const course of courses) {
          try {
            const response: AxiosResponse<CanvasAssignment[]> = await axios.get(
              `${this.baseURL}/courses/${course.id}/assignments`,
              {
                headers: this.getHeaders(),
                params: {
                  include: ['submission'],
                  per_page: 100,
                },
              }
            );
            allAssignments.push(...response.data);
          } catch (courseError) {
            console.warn(`Error fetching assignments for course ${course.id}:`, courseError);
          }
        }
        return allAssignments;
      }

      const response: AxiosResponse<CanvasAssignment[]> = await axios.get(url, {
        headers: this.getHeaders(),
        params: {
          include: ['submission'],
          per_page: 100,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching Canvas assignments:', error);
      throw error;
    }
  }

  async getUpcomingAssignments(daysAhead: number = 30): Promise<CanvasAssignment[]> {
    try {
      const assignments = await this.getAssignments();
      const now = new Date();
      const futureDate = new Date(now.getTime() + (daysAhead * 24 * 60 * 60 * 1000));

      return assignments.filter(assignment => {
        if (!assignment.due_at) return false;
        const dueDate = new Date(assignment.due_at);
        return dueDate >= now && dueDate <= futureDate;
      }).sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());
    } catch (error) {
      console.error('Error fetching upcoming assignments:', error);
      throw error;
    }
  }

  async getTodos(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.baseURL}/users/self/todo`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching Canvas todos:', error);
      throw error;
    }
  }

  async getAnnouncements(courseIds: number[]): Promise<CanvasAnnouncement[]> {
    try {
      if (courseIds.length === 0) return [];

      // Canvas API allows fetching announcements for multiple courses using context_codes
      const contextCodes = courseIds.map(id => `course_${id}`);

      const response: AxiosResponse<CanvasAnnouncement[]> = await axios.get(
        `${this.baseURL}/announcements`,
        {
          headers: this.getHeaders(),
          params: {
            context_codes: contextCodes,
            start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
            end_date: new Date().toISOString(),
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching Canvas announcements:', error);
      return []; // Return empty array on error to safely fail
    }
  }

  validateToken(): Promise<boolean> {
    return axios.get(`${this.baseURL}/users/self`, {
      headers: this.getHeaders(),
    }).then(() => true).catch(() => false);
  }
}

export default CanvasService;
