
import type { Task, StudySession, UserPreferences } from './lib/types';

// Mock Tasks
export const mockTasks: Task[] = [
  {
    id: 'T001',
    title: 'Programming Assignment 1',
    courseId: 'C101',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'high',
    effort: '5 hours',
    status: 'inprogress',
    description: 'Implement a simple calculator.',
  },
  {
    id: 'T002',
    title: 'Read Chapter 3',
    courseId: 'M202',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'medium',
    status: 'todo',
  },
  {
    id: 'T003',
    title: 'Lab Report 2',
    courseId: 'P303',
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'high',
    effort: '8 hours',
    status: 'todo',
  },
  {
    id: 'T004',
    title: 'Prepare for C101 Midterm',
    courseId: 'C101',
    dueDate: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'high',
    status: 'todo',
  },
];

// Mock Study Sessions
export const mockStudySessions: StudySession[] = [
  {
    id: 'SS001',
    title: 'Review C101 Lecture 2',
    date: new Date().toISOString().split('T')[0],
    startTime: '07:00 PM',
    endTime: '08:00 PM',
    lectureId: 'L002',
    type: 'lecture_review',
  },
  {
    id: 'SS002',
    title: 'Work on Prog. Assignment 1',
    date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    startTime: '06:00 PM',
    endTime: '08:00 PM',
    taskId: 'T001',
    type: 'task_work',
  },
  {
    id: 'SS003',
    title: 'Calculus Problem Set',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    startTime: '03:00 PM',
    endTime: '05:00 PM',
    lectureId: 'M202',
    type: 'general_study',
  },
];


// User preferences are not yet fetched from an API.
export const mockUserPreferences: UserPreferences = {
  preferredStudyTimes: ['afternoon', 'evening'],
  studyTechniques: ['pomodoro', 'spaced_repetition'],
  defaultSessionLength: 50, // 50 minutes
  defaultBreakCadence: 10, // 10 minutes
  notificationLeadTimes: {
    task: 24, // 24 hours before
    session: 2,  // 2 hours before
    exam: 7,   // 7 days before
  },
};
