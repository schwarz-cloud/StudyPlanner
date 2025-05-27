
"use client";
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Lightbulb, 
  AlertTriangle, 
  Loader2, 
  CalendarDays, 
  CheckCircle2, 
  Activity, 
  Coffee, 
  BookOpen, 
  NotebookPen, 
  Brain, 
  UserCircle, 
  Clapperboard,
  Printer,
  CalendarPlus,
  Save,
  Trash2,
} from 'lucide-react';
import { mockUserPreferences, mockTasks } from '@/lib/mock-data'; 
import { generateStudyPlan, GenerateStudyPlanInput, StudyPlan } from '@/ai/flows/generate-study-plan-flow';
import type { StudyActivity } from '@/lib/schemas';
import type { Course, Exam, Lecture, Quiz, Task } from '@/lib/types';
import { fetchCourses, fetchExams, fetchLectures, fetchQuizzes } from '@/services/apiService';
import { format, parse, isValid, formatISO } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

const getActivityIcon = (type: StudyActivity['type']) => {
  switch (type) {
    case 'study': return <Brain className="w-4 h-4 text-blue-500" />;
    case 'break': return <Coffee className="w-4 h-4 text-green-500" />;
    case 'task_work': return <NotebookPen className="w-4 h-4 text-purple-500" />;
    case 'exam_prep': return <BookOpen className="w-4 h-4 text-red-500" />;
    case 'lecture_review': return <Activity className="w-4 h-4 text-yellow-500" />;
    case 'quiz_prep': return <CheckCircle2 className="w-4 h-4 text-indigo-500" />;
    case 'lecture': return <Clapperboard className="w-4 h-4 text-orange-500" />;
    case 'personal': return <UserCircle className="w-4 h-4 text-gray-500" />;
    default: return <Lightbulb className="w-4 h-4 text-gray-400" />;
  }
};

const getCurrentDateYYYYMMDD = () => {
  return formatISO(new Date(), { representation: 'date' });
};

const STUDY_PLAN_STORAGE_KEY = 'studyPlannerStudyPlan';

export default function StudyPlanPage() {
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false); // For plan generation
  const [isDataLoading, setIsDataLoading] = useState(true); // For initial API data
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [activityCompletion, setActivityCompletion] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  // State for API data
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [tasks] = useState<Task[]>(mockTasks); // Tasks still from mock

  useEffect(() => {
    const storedPlanJson = localStorage.getItem(STUDY_PLAN_STORAGE_KEY);
    if (storedPlanJson) {
      try {
        const parsedPlan: StudyPlan = JSON.parse(storedPlanJson);
        if (parsedPlan && parsedPlan.startDate && Array.isArray(parsedPlan.dailyPlans)) {
          setStudyPlan(parsedPlan);
          const initialCompletion: Record<string, boolean> = {};
          parsedPlan.dailyPlans.forEach(day => {
            day.activities.forEach(activity => {
              initialCompletion[activity.id] = activity.completed;
            });
          });
          setActivityCompletion(initialCompletion);
          toast({ title: "Loaded Saved Plan", description: "Your previously saved study plan has been loaded." });
        } else {
          localStorage.removeItem(STUDY_PLAN_STORAGE_KEY);
        }
      } catch (e) {
        console.error("Failed to parse study plan from localStorage", e);
        localStorage.removeItem(STUDY_PLAN_STORAGE_KEY);
      }
    }

    // Fetch API data for plan generation
    async function loadApiData() {
      setIsDataLoading(true);
      setApiError(null);
      try {
        const [coursesData, examsData, lecturesData, quizzesData] = await Promise.all([
          fetchCourses(),
          fetchExams(),
          fetchLectures(),
          fetchQuizzes(),
        ]);
        setCourses(coursesData);
        setExams(examsData);
        setLectures(lecturesData);
        setQuizzes(quizzesData);
      } catch (err) {
        console.error("Failed to load API data for study plan", err);
        setApiError(err instanceof Error ? err.message : "An unknown error occurred fetching initial data.");
        toast({ variant: "destructive", title: "Data Fetch Failed", description: "Could not load necessary data for plan generation." });
      } finally {
        setIsDataLoading(false);
      }
    }
    loadApiData();
  }, [toast]);

  const savePlanToLocalStorage = (plan: StudyPlan) => {
    localStorage.setItem(STUDY_PLAN_STORAGE_KEY, JSON.stringify(plan));
  };

  const handleGeneratePlan = async () => {
    if (isDataLoading) {
      toast({ variant: "destructive", title: "Data Still Loading", description: "Please wait for initial data to load before generating a plan." });
      return;
    }
    if (apiError) {
      toast({ variant: "destructive", title: "Cannot Generate Plan", description: "There was an error loading essential data. Please try refreshing." });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const input: GenerateStudyPlanInput = {
        userPreferences: mockUserPreferences,
        courses: courses,
        exams: exams,
        tasks: tasks,
        lectures: lectures,
        quizzes: quizzes,
        currentDate: getCurrentDateYYYYMMDD(),
        planDurationDays: 7,
      };
      const plan = await generateStudyPlan(input);
      setStudyPlan(plan);
      savePlanToLocalStorage(plan);

      const initialCompletion: Record<string, boolean> = {};
      plan.dailyPlans.forEach(day => {
        day.activities.forEach(activity => {
          initialCompletion[activity.id] = activity.completed;
        });
      });
      setActivityCompletion(initialCompletion);
      toast({ title: "Study Plan Generated & Saved!", description: "Your personalized study plan is ready and saved." });
    } catch (e: any) {
      console.error("Error generating study plan:", e);
      setError(e.message || "Failed to generate study plan. Please try again.");
      toast({ variant: "destructive", title: "Generation Failed", description: e.message || "Could not generate the plan." });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleActivityCompletion = (activityId: string) => {
    setActivityCompletion(prev => {
      const newCompletionStatus = !prev[activityId];
      const updatedLocalCompletion = { ...prev, [activityId]: newCompletionStatus };

      if (studyPlan) {
        const updatedPlan = {
          ...studyPlan,
          dailyPlans: studyPlan.dailyPlans.map(day => ({
            ...day,
            activities: day.activities.map(activity =>
              activity.id === activityId
                ? { ...activity, completed: newCompletionStatus }
                : activity
            ),
          })),
        };
        setStudyPlan(updatedPlan);
        savePlanToLocalStorage(updatedPlan); // Save updated plan
      }
      return updatedLocalCompletion;
    });
  };
  
  const handleClearSavedPlan = () => {
    localStorage.removeItem(STUDY_PLAN_STORAGE_KEY);
    setStudyPlan(null);
    setActivityCompletion({});
    setError(null);
    toast({ title: "Saved Plan Cleared", description: "Your study plan has been removed from local storage." });
  };

  const handlePrintPlan = () => {
    if (studyPlan) {
      window.print();
    } else {
      toast({ variant: "destructive", title: "No Plan to Print", description: "Please generate a study plan first." });
    }
  };

  const parseAndFormatDate = (dateString: string, formatString: string = 'EEEE, MMMM dd, yyyy'): string => {
    try {
      const parsedDate = parse(dateString, 'yyyy-MM-dd', new Date());
      if (isValid(parsedDate)) {
        return format(parsedDate, formatString);
      }
      return dateString; 
    } catch {
      return dateString; 
    }
  };

  const getCourseTitleById = (courseId?: string | number) => {
    if (!courseId) return '';
    const foundCourse = courses.find(c => String(c.courseId) === String(courseId));
    return foundCourse?.title || String(courseId);
  };


  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-6">
      <PageHeader
        title="Your Personalized Study Plan"
        description="Generate and manage your dynamic study plan. Saved plans persist in your browser."
      />

      <motion.div variants={itemVariants}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Plan Controls</CardTitle>
            <CardDescription>Generate a new 7-day plan or manage your existing one. Data for courses, exams, etc., is fetched from the API.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-4">
            <Button onClick={handleGeneratePlan} disabled={isLoading || isDataLoading} size="lg">
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating Plan...
                </>
              ) : isDataLoading ? (
                 <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading Data...
                </>
              ) : (
                <>
                  <Lightbulb className="w-5 h-5 mr-2" /> {studyPlan ? "Regenerate Plan" : "Generate My Study Plan"}
                </>
              )}
            </Button>
            {studyPlan && (
              <>
                <Button onClick={handlePrintPlan} variant="outline">
                  <Printer className="w-4 h-4 mr-2" /> Print to PDF
                </Button>
                <Button variant="outline" disabled>
                  <CalendarPlus className="w-4 h-4 mr-2" /> Add to Google Calendar
                </Button>
                 <Button onClick={handleClearSavedPlan} variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" /> Clear Saved Plan
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {apiError && (
        <motion.div variants={itemVariants}>
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertTitle>API Data Error</AlertTitle>
            <AlertDescription>{apiError} Cannot generate plan without essential data.</AlertDescription>
          </Alert>
        </motion.div>
      )}
      {error && (
        <motion.div variants={itemVariants}>
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertTitle>Study Plan Generation Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      <AnimatePresence>
        {studyPlan && (
          <motion.div variants={itemVariants} initial="hidden" animate="visible" exit="exit">
            <Card className="mt-6 shadow-xl print:shadow-none">
              <CardHeader className="print:hidden">
                <CardTitle className="text-2xl text-primary">Generated Study Plan</CardTitle>
                <CardDescription>
                  {`Plan for ${parseAndFormatDate(studyPlan.startDate, 'MMM dd')} - ${parseAndFormatDate(studyPlan.endDate, 'MMM dd, yyyy')}`}
                  {studyPlan.overallSummary && <p className="mt-2 italic">{studyPlan.overallSummary}</p>}
                </CardDescription>
              </CardHeader>
              <div className="print:block hidden p-4 border-b">
                 <h2 className="text-xl font-bold">Study Plan: {parseAndFormatDate(studyPlan.startDate, 'MMM dd')} - {parseAndFormatDate(studyPlan.endDate, 'MMM dd, yyyy')}</h2>
                 {studyPlan.overallSummary && <p className="mt-1 text-sm italic">{studyPlan.overallSummary}</p>}
              </div>
              <CardContent>
                <Accordion type="multiple" defaultValue={studyPlan.dailyPlans.map(dp => dp.date)} className="w-full space-y-4 print:space-y-2">
                  {studyPlan.dailyPlans.map((dayPlan) => (
                    <AccordionItem value={dayPlan.date} key={dayPlan.date} className="border rounded-lg shadow-md bg-card print:shadow-none print:border-b print:rounded-none print:mb-2">
                      <AccordionTrigger className="px-6 py-4 hover:no-underline print:px-0 print:py-2">
                        <div className="flex items-center gap-3">
                          <CalendarDays className="w-6 h-6 text-primary print:w-5 print:h-5" />
                          <span className="text-lg font-semibold print:text-base">
                            {parseAndFormatDate(dayPlan.date)} ({dayPlan.dayOfWeek})
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pt-0 pb-4 print:px-0 print:pb-2">
                        {dayPlan.summary && <p className="mb-3 text-sm italic text-muted-foreground print:text-xs">{dayPlan.summary}</p>}
                        {dayPlan.activities.length > 0 ? (
                          <ul className="space-y-3 print:space-y-1">
                            {dayPlan.activities.map((activity) => (
                              <motion.li
                                key={activity.id}
                                variants={itemVariants}
                                layout
                                className={`p-3 rounded-md flex items-start gap-3 transition-colors print:p-1.5 print:rounded-sm print:border-b print:border-dashed last:border-b-0 ${activityCompletion[activity.id] ? 'bg-green-100 dark:bg-green-900/50 opacity-70 print:bg-green-50 print:opacity-100' : 'bg-secondary print:bg-gray-50'}`}
                              >
                                <Checkbox
                                  id={`activity-${activity.id}`}
                                  checked={activityCompletion[activity.id]}
                                  onCheckedChange={() => toggleActivityCompletion(activity.id)}
                                  className="mt-1 shrink-0 print:hidden"
                                  aria-label={`Mark ${activity.description} as ${activityCompletion[activity.id] ? 'incomplete' : 'complete'}`}
                                />
                                 <div className="print:block hidden mr-2 mt-1">
                                  {activityCompletion[activity.id] ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <div className="w-4 h-4 border border-gray-400 rounded-sm"></div>}
                                </div>
                                <div className="flex-grow">
                                  <label htmlFor={`activity-${activity.id}`} className={`block font-medium text-sm cursor-pointer print:cursor-default print:text-xs ${activityCompletion[activity.id] ? 'line-through' : ''}`}>
                                    {activity.startTime} - {activity.endTime}: {activity.description}
                                  </label>
                                  <div className="flex items-center gap-2 mt-1 print:hidden">
                                    {getActivityIcon(activity.type)}
                                    <Badge variant="outline" className="text-xs capitalize">{activity.type.replace('_', ' ')}</Badge>
                                    {activity.courseId && (
                                      <Badge variant="secondary" className="text-xs">
                                        {getCourseTitleById(activity.courseId)}
                                      </Badge>
                                    )}
                                  </div>
                                   <div className="print:flex hidden items-center gap-1 mt-0.5">
                                    {getActivityIcon(activity.type)}
                                    <span className="text-xs capitalize text-muted-foreground">{activity.type.replace('_', ' ')}</span>
                                    {activity.courseId && (
                                      <span className="text-xs text-muted-foreground">({getCourseTitleById(activity.courseId)})</span>
                                    )}
                                  </div>
                                </div>
                              </motion.li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-muted-foreground print:text-xs">No activities scheduled for this day. Enjoy your break!</p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
       {!isLoading && !isDataLoading && !studyPlan && !error && !apiError &&(
        <motion.div variants={itemVariants} className="mt-6 text-center text-muted-foreground print:hidden">
          <CalendarDays className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Your study plan will appear here once generated or loaded.</p>
          <p>Click the "Generate My StudyPlan" button to start, or it will load automatically if previously saved.</p>
        </motion.div>
      )}
    </motion.div>
  );
}
