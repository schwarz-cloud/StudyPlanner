
import type { Course, Exam, Lecture, Quiz, Task, StudySession, UserPreferences } from './types';

// Mock data for API-fetched items, to be used as fallback
export const mockApiCourses: Course[] = [
  { courseId: 'C101-API', code: 'CS101', title: 'Intro to Programming (Mock API)', language: 'Python', semester: 'Fall 2024', schedule: 'MWF 10:00 AM - 10:50 AM' },
  { courseId: 'M202-API', code: 'MA202', title: 'Calculus II (Mock API)', language: 'English', semester: 'Fall 2024', schedule: 'TTh 1:00 PM - 2:15 PM' },
  { courseId: 'P303-API', code: 'PHY303', title: 'Physics for Engineers (Mock API)', language: 'English', semester: 'Fall 2024', schedule: 'MWF 2:00 PM - 2:50 PM' },
];

export const mockApiExams: Exam[] = [
  { examId: 'E001-API', title: 'Midterm 1 (Mock API)', courseId: 'C101-API', duration: '1 hour', startTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), endTime: new Date(Date.now() + (14 * 24 * 60 * 60 * 1000) + (60 * 60 * 1000)).toISOString(), language: 'Python', totalMarks: 100 },
  { examId: 'E002-API', title: 'Final Exam (Mock API)', courseId: 'M202-API', duration: '2 hours', startTime: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(), endTime: new Date(Date.now() + (45 * 24 * 60 * 60 * 1000) + (2 * 60 * 60 * 1000)).toISOString(), language: 'English', totalMarks: 150 },
];

export const mockApiLectures: Lecture[] = [
  { lectureId: 'L001-API', title: 'Variables & Data Types (Mock API)', courseId: 'C101-API', startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], endDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], completionStatus: true },
  { lectureId: 'L002-API', title: 'Control Flow (Mock API)', courseId: 'C101-API', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], completionStatus: false },
  { lectureId: 'L003-API', title: 'Derivatives (Mock API)', courseId: 'M202-API', startDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], completionStatus: true },
];

export const mockApiQuizzes: Quiz[] = [
  { quizId: 'Q001-API', title: 'Quiz on Variables (Mock API)', courseId: 'C101-API', lectureId: 'L001-API', totalMarks: 20, creationDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
  { quizId: 'Q002-API', title: 'Calculus Basics Quiz (Mock API)', courseId: 'M202-API', lectureId: 'L003-API', totalMarks: 25, creationDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
];


// Tasks are not yet fetched from an API, so mock data is kept.
export const mockTasks: Task[] = [
  { id: 'T001', title: 'Programming Assignment 1', courseId: 'C101-API', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], priority: 'high', effort: '5 hours', status: 'inprogress', description: 'Implement a simple calculator.' },
  { id: 'T002', title: 'Read Chapter 3', courseId: 'M202-API', dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], priority: 'medium', status: 'todo' },
  { id: 'T003', title: 'Lab Report 2', courseId: 'P303-API', dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], priority: 'high', effort: '8 hours', status: 'todo' },
  { id: 'T004', title: 'Prepare for C101 Midterm', courseId: 'C101-API', dueDate: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], priority: 'high', status: 'todo' },
];

// Study sessions are not yet fetched from an API.
export const mockStudySessions: StudySession[] = [
    { id: 'SS001', title: 'Review C101 Lecture 2', date: new Date().toISOString().split('T')[0], startTime: '07:00 PM', endTime: '08:00 PM', lectureId: 'L002-API', type: 'lecture_review' },
    { id: 'SS002', title: 'Work on Prog. Assignment 1', date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], startTime: '06:00 PM', endTime: '08:00 PM', taskId: 'T001', type: 'task_work' },
    { id: 'SS003', title: 'Calculus Problem Set', date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], startTime: '03:00 PM', endTime: '05:00 PM', courseId: 'M202-API', type: 'general_study' },
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
