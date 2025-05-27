
'use server';
/**
 * @fileOverview A Genkit flow to generate a personalized study plan.
 *
 * - generateStudyPlan - A function that calls the study plan generation flow.
 * - GenerateStudyPlanInput - The input type for the generateStudyPlan function.
 * - StudyPlan - The return type (the generated study plan).
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import { 
  UserPreferencesSchema, 
  CourseSchema, 
  ExamSchema, 
  TaskSchema, 
  LectureSchema, 
  QuizSchema, 
  StudyPlanSchema 
} from '@/lib/schemas'; // Schemas now reflect API data structures

// StudyPlan type will be inferred from the imported StudyPlanSchema

const GenerateStudyPlanInputSchema = z.object({
  userPreferences: UserPreferencesSchema.describe("User's study preferences."),
  courses: z.array(CourseSchema).describe("List of user's courses from API."),
  exams: z.array(ExamSchema).describe("List of upcoming exams from API."),
  tasks: z.array(TaskSchema).describe("List of tasks and assignments (currently from mock data)."),
  lectures: z.array(LectureSchema).describe("List of scheduled lectures from API."),
  quizzes: z.array(QuizSchema).describe("List of upcoming quizzes from API."),
  currentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be in YYYY-MM-DD format").describe("Current date, plan should start from this date."),
  planDurationDays: z.number().int().positive().default(7).describe("Number of days the study plan should cover (e.g., 7 for a weekly plan).")
});
export type GenerateStudyPlanInput = z.infer<typeof GenerateStudyPlanInputSchema>;

// Export the StudyPlan type for use in the page component
export type StudyPlan = z.infer<typeof StudyPlanSchema>;

const studyPlanPrompt = ai.definePrompt({
  name: 'generateStudyPlanPrompt',
  input: { schema: GenerateStudyPlanInputSchema },
  output: { schema: StudyPlanSchema },
  prompt: `You are an AI Study Planner.

Your ABSOLUTE PRIMARY TASK is to generate a single JSON object representing a study plan.
This JSON object MUST start with the following top-level keys: "startDate", "endDate", and "dailyPlans".
An "overallSummary" key is also allowed at the root, but "startDate", "endDate", and "dailyPlans" are MANDATORY.

Example of the REQUIRED root structure:
{
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "dailyPlans": [ /* array of 'StudyPlanDay' objects goes here */ ],
  "overallSummary": "Optional summary of the entire plan..."
}

The plan MUST cover {{{planDurationDays}}} days, starting from {{{currentDate}}}.
The "dailyPlans" array MUST contain exactly {{{planDurationDays}}} 'StudyPlanDay' objects. Each object in this array MUST be a complete 'StudyPlanDay' as defined below. Do NOT include empty {} objects or incomplete day objects in the 'dailyPlans' array. Every day must be fully populated.

Use the following inputs to generate the plan details:
- User Preferences: {{{json userPreferences}}}
- Courses: {{{json courses}}}
- Exams: {{{json exams}}}
- Tasks: {{{json tasks}}}
- Lectures: {{{json lectures}}}
- Quizzes: {{{json quizzes}}}

Now, follow these detailed instructions for the content and structure of the plan:

Detailed schema for 'StudyPlanDay' objects (these go inside the "dailyPlans" array):
- Each 'StudyPlanDay' object MUST contain:
    - \`date\`: Date (YYYY-MM-DD).
    - \`dayOfWeek\`: (e.g., "Monday").
    - \`activities\`: Array of 'StudyActivity' objects.
        - Each 'StudyActivity' object MUST contain ALL of the following fields with valid values:
            - \`id\`: A unique UUID string for the activity (you MUST generate this).
            - \`startTime\`: Start time (HH:MM AM/PM format, e.g., "09:00 AM").
            - \`endTime\`: End time (HH:MM AM/PM format, e.g., "10:00 AM").
            - \`description\`: Clear, concise description (e.g., "Review Chapter 3 of Calculus", "Work on Programming Assignment 1", "Pomodoro Session: Physics revision", "Short break").
            - \`type\`: Enum ('study', 'break', 'task_work', 'exam_prep', 'lecture_review', 'quiz_prep', 'personal', 'lecture'). Add scheduled lectures from the input as 'lecture' type.
            - \`relatedItemId\` (optional): ID of the task, exam, quiz, or lecture this activity relates to (use IDs from input data like courseId, examId, lectureId, quizId, taskId).
            - \`courseId\` (optional): ID of the course this activity relates to (use courseId from input course data).
            - \`completed\`: false (boolean, default to false).
    - \`summary\` (optional): A brief summary of the day's focus.
All fields listed as required for 'StudyPlanDay' and 'StudyActivity' must be present and correctly formatted.

Key Instructions for plan generation:
1.  Calculate \`endDate\` correctly based on \`currentDate\` and \`planDurationDays\`. Populate the root \`startDate\` and \`endDate\` fields with these YYYY-MM-DD string values.
2.  The "dailyPlans" array MUST contain exactly {{{planDurationDays}}} 'StudyPlanDay' objects. Each object in this array MUST be a complete 'StudyPlanDay'. Do NOT include empty {} objects or incomplete day objects.
3.  Generate unique UUIDs for each \`StudyActivity.id\`.
4.  Distribute study sessions and task work logically, prioritizing items with earlier deadlines (from tasks, exams, quizzes) and higher priority tasks. Use the dates provided in the input objects.
5.  Incorporate user's \`preferredStudyTimes\`. Schedule more intensive work during these times.
6.  If 'pomodoro' is a preferred \`studyTechnique\`, break down longer study blocks into sessions (e.g., \`defaultSessionLength\` minutes from preferences) followed by short breaks (e.g., \`defaultBreakCadence\` minutes). Label these clearly (e.g., "Pomodoro Session: [Topic]", "Short break").
7.  Explicitly include scheduled lectures from the input \`lectures\` array (using their \`startsAt\` field for date and \`title\`) as activities of type 'lecture'. Do not schedule conflicting activities. Lectures might span multiple days if \`endsAt\` differs from \`startsAt\`. Note: lecture dates are full datetime strings, extract YYYY-MM-DD for planning.
8.  Allocate time for exam preparation (using \`startsAt\` from Exam objects), task work (using \`dueDate\` from Task objects), quiz preparation (using \`creationDate\`, or by inferring due date for Quizzes), and lecture reviews. Be specific in descriptions. Note: exam dates are full datetime strings, extract YYYY-MM-DD for planning.
9.  Ensure adequate breaks are included. Include at least one longer break if study sessions span multiple hours.
10. If a day is very packed, note this in the daily summary. If lighter, suggest it for catch-up or rest.
11. Ensure all times (startTime, endTime for activities) are in HH:MM AM/PM format (e.g., "09:00 AM", "01:30 PM"). Ensure start and end times are logical and well-formed.
12. Provide practical and actionable descriptions for activities.
13. FINAL CRITICAL REMINDER: The entire output MUST be a single JSON object. This object ABSOLUTELY MUST have "startDate", "endDate", and "dailyPlans" as its top-level keys. The "dailyPlans" array MUST contain exactly {{{planDurationDays}}} complete and valid 'StudyPlanDay' objects. Double-check your output to ensure this structure. All fields specified as required in the schemas MUST be present with valid, non-empty values.
`,
});

const generateStudyPlanFlow = ai.defineFlow(
  {
    name: 'generateStudyPlanFlow',
    inputSchema: GenerateStudyPlanInputSchema,
    outputSchema: StudyPlanSchema,
  },
  async (input) => {
    console.log("Generating study plan with input:", JSON.stringify(input, null, 2));
    const { output } = await studyPlanPrompt(input);
    if (!output) {
      console.error('Failed to generate study plan. The AI model did not return an output.');
      throw new Error('Failed to generate study plan. The AI model did not return an output.');
    }
    
    if (!output.startDate || !output.endDate || !Array.isArray(output.dailyPlans)) {
        console.error("Generated plan is missing required root fields. Output:", JSON.stringify(output, null, 2));
        // Attempt to reconstruct if possible, or throw a more specific error
        if (Array.isArray(output) && output.length > 0 && output[0] && typeof output[0] === 'object' && 'date' in output[0]) { // Heuristic: if output is just the dailyPlans array
             throw new Error(`Generated plan is missing root structure (startDate, endDate). Model returned dailyPlans directly. Input currentDate: ${input.currentDate}, duration: ${input.planDurationDays}`);
        }
        throw new Error(`Generated plan is malformed: missing startDate, endDate, or dailyPlans at the root level. Input currentDate: ${input.currentDate}, duration: ${input.planDurationDays}. Received: ${JSON.stringify(output)}`);
    }

    if (output.dailyPlans.length !== input.planDurationDays) {
        console.warn(`Generated plan has ${output.dailyPlans.length} days, but ${input.planDurationDays} were requested. This can cause issues. Input: ${input.currentDate}, ${input.planDurationDays} days. Output:`, JSON.stringify(output, null, 2));
    }
    
    output.dailyPlans.forEach((day, index) => {
      if (!day || typeof day !== 'object' || !day.date || !day.dayOfWeek || !Array.isArray(day.activities)) {
        console.error(`Daily plan at index ${index} is malformed or incomplete: `, JSON.stringify(day, null, 2));
      } else {
        day.activities.forEach((activity, activityIndex) => {
          if (!activity || typeof activity !== 'object' || !activity.id || !activity.startTime || !activity.endTime || !activity.description || !activity.type) {
            console.error(`Activity at day index ${index}, activity index ${activityIndex} is malformed: `, JSON.stringify(activity, null, 2));
          }
        });
      }
    });
    console.log("Successfully generated study plan:", JSON.stringify(output, null, 2));
    return output;
  }
);

export async function generateStudyPlan(input: GenerateStudyPlanInput): Promise<StudyPlan> {
  return generateStudyPlanFlow(input);
}

