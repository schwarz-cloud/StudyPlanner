import type { Course, Exam, Lecture, Quiz, Task, StudySession, UserPreferences } from './types';

// Mock Courses
export const mockApiCourses: Course[] = [
  { courseId: 'C101-API', code: 'CS101', title: 'Intro to Programming ', language: 'English', semester: 'Fall 2024', schedule: 'MWF 10:00 AM - 10:50 AM' },
  { courseId: 'M202-API', code: 'MA202', title: 'Calculus II ', language: 'English', semester: 'Fall 2024', schedule: 'TTh 1:00 PM - 2:15 PM' },
  { courseId: 'P303-API', code: 'PHY303', title: 'Physics for Engineers ', language: 'English', semester: 'Fall 2024', schedule: 'MWF 2:00 PM - 2:50 PM' },
];

// Mock Exams
export const mockApiExams: Exam[] = [
  {
    examId: 'E001-API',
    examTitle: 'Midterm 1 ',
    courseId: 'C101-API',
    duration: 60,
    startsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    endsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    language: 'Python',
    totalMark: 100,
  },
  {
    examId: 'E002-API',
    examTitle: 'Final Exam ',
    courseId: 'M202-API',
    duration: 120,
    startsAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    endsAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    language: 'English',
    totalMark: 150,
  },
];

// Mock Lectures
export const mockApiLectures: Lecture[] = [
  {
    lectureId: 'L001-API',
    title: 'Variables & Data Types ',
    courseId: 'C101-API',
    startsAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    endsAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    isDone: true,
  },
  {
    lectureId: 'L002-API',
    title: 'Control Flow ',
    courseId: 'C101-API',
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    isDone: false,
  },
  {
    lectureId: 'L003-API',
    title: 'Derivatives',
    courseId: 'M202-API',
    startsAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    endsAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
    isDone: true,
  },
];

// Mock Quizzes
export const mockApiQuizzes: Quiz[] = [
  {
    quizId: 'Q001-API',
    title: 'Quiz on Variables ',
    courseId: 'C101-API',
    lectureId: 'L001-API',
    totalMarks: 20,
    creationDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  },
  {
    quizId: 'Q002-API',
    title: 'Calculus Basics Quiz ',
    courseId: 'M202-API',
    lectureId: 'L003-API',
    totalMarks: 25,
    creationDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  },
];

// Mock Tasks
export const mockTasks: Task[] = [
  {
    id: 'T001',
    title: 'Programming Assignment 1',
    courseId: 'C101-API',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'high',
    effort: '5 hours',
    status: 'inprogress',
    description: 'Implement a simple calculator.',
  },
  {
    id: 'T002',
    title: 'Read Chapter 3',
    courseId: 'M202-API',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'medium',
    status: 'todo',
  },
  {
    id: 'T003',
    title: 'Lab Report 2',
    courseId: 'P303-API',
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    priority: 'high',
    effort: '8 hours',
    status: 'todo',
  },
  {
    id: 'T004',
    title: 'Prepare for C101 Midterm',
    courseId: 'C101-API',
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
    lectureId: 'L002-API',
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
    lectureId: 'M202-API',
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
