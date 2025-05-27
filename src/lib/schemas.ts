
import { z } from 'zod';

// Updated CourseSchema based on new API type
export const CourseSchema = z.object({
  courseId: z.union([z.string(), z.number()]),
  code: z.string(),
  title: z.string(),
  language: z.string(),
  semester: z.string(),
  schedule: z.string().describe("e.g., MWF 9:00 AM - 9:50 AM"),
});
export type Course = z.infer<typeof CourseSchema>;

// Updated ExamSchema based on new API type
export const ExamSchema = z.object({
  examId: z.union([z.string(), z.number()]),
  examTitle: z.string(), // Changed from title
  courseId: z.union([z.string(), z.number()]),
  duration: z.number().describe("Duration in minutes, e.g. 100"), // Changed from string
  startsAt: z.string().describe("ISO datetime string"), // Changed from startTime
  endsAt: z.string().describe("ISO datetime string"),   // Changed from endTime
  language: z.string(),
  totalMark: z.number(), // Changed from totalMarks
  // Optional fields from API response if they need to be in the schema
  generatedAt: z.string().optional(),
  totalQuestions: z.number().optional(),
  creatorId: z.number().optional(),
  fileName: z.string().optional(),
});
export type Exam = z.infer<typeof ExamSchema>;

// Updated LectureSchema based on new API type
export const LectureSchema = z.object({
  lectureId: z.union([z.string(), z.number()]),
  title: z.string(),
  courseId: z.union([z.string(), z.number()]),
  startsAt: z.string().describe("ISO datetime string, e.g. YYYY-MM-DDTHH:mm:ss.sssZ"), // Changed from startDate
  endsAt: z.string().describe("ISO datetime string, e.g. YYYY-MM-DDTHH:mm:ss.sssZ"),   // Changed from endDate
  isDone: z.boolean(), // Changed from completionStatus
  // Optional fields from API response
  hierarchy: z.number().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Lecture = z.infer<typeof LectureSchema>;

// Updated QuizSchema based on new API type
export const QuizSchema = z.object({
  quizId: z.union([z.string(), z.number()]),
  title: z.string(),
  courseId: z.union([z.string(), z.number()]),
  lectureId: z.union([z.string(), z.number()]),
  totalMarks: z.number(),
  creationDate: z.string().describe("YYYY-MM-DD or ISO string"),
});
export type Quiz = z.infer<typeof QuizSchema>;

// TaskSchema remains as is
export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  courseId: z.union([z.string(), z.number()]).optional(),
  dueDate: z.string().describe("YYYY-MM-DD"),
  priority: z.enum(['low', 'medium', 'high']),
  effort: z.string().optional().describe("e.g., 5 hours"),
  status: z.enum(['todo', 'inprogress', 'done']),
  description: z.string().optional(),
});
export type Task = z.infer<typeof TaskSchema>;

export const StudyTimeOptionSchema = z.enum(['morning', 'afternoon', 'evening']);
export const StudyTechniqueOptionSchema = z.enum(['pomodoro', 'spaced_repetition', 'feynman']);

export const UserPreferencesSchema = z.object({
  preferredStudyTimes: z.array(StudyTimeOptionSchema),
  studyTechniques: z.array(StudyTechniqueOptionSchema),
  defaultSessionLength: z.number().int().positive().describe("in minutes"),
  defaultBreakCadence: z.number().int().positive().describe("in minutes"),
  notificationLeadTimes: z.object({
    task: z.number().int().nonnegative().describe("in hours"),
    session: z.number().int().nonnegative().describe("in hours"),
    exam: z.number().int().nonnegative().describe("in days"),
  }),
});
export type UserPreferences = z.infer<typeof UserPreferencesSchema>;

// Study Plan Schemas (internal structure remains the same)
export const StudyActivitySchema = z.object({
  id: z.string().describe("A unique ID for the activity (the model should generate this)."),
  startTime: z.string().describe("Start time in HH:MM AM/PM format, e.g., \"09:00 AM\""),
  endTime: z.string().describe("End time in HH:MM AM/PM format, e.g., \"10:00 AM\""),
  description: z.string().describe("Clear, concise description of the activity."),
  type: z.enum(['study', 'break', 'task_work', 'exam_prep', 'lecture_review', 'quiz_prep', 'personal', 'lecture'])
    .describe("Type of the activity."),
  relatedItemId: z.union([z.string(), z.number()]).optional().describe("ID of the task, exam, quiz, or lecture this activity relates to."),
  courseId: z.union([z.string(), z.number()]).optional().describe("ID of the course this activity relates to."),
  completed: z.boolean().default(false).describe("Whether the activity is completed, defaults to false."),
});
export type StudyActivity = z.infer<typeof StudyActivitySchema>;

export const StudyPlanDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format."),
  dayOfWeek: z.string().describe("Day of the week, e.g., \"Monday\"."),
  activities: z.array(StudyActivitySchema),
  summary: z.string().optional().describe("A brief summary of the day's focus."),
});
export type StudyPlanDay = z.infer<typeof StudyPlanDaySchema>;

export const StudyPlanSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format."),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format."),
  dailyPlans: z.array(StudyPlanDaySchema),
  overallSummary: z.string().optional().describe("A brief summary of the entire plan."),
});
export type StudyPlan = z.infer<typeof StudyPlanSchema>;
