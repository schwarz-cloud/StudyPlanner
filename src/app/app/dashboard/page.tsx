
"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { DataCard } from '@/components/shared/data-card';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  CheckSquare,
  ListChecks,
  PlusCircle,
  Settings,
  Timer,
  Lightbulb,
  Loader2
} from 'lucide-react';
import { mockTasks, mockStudySessions, mockUserPreferences } from '@/lib/mock-data'; // Tasks & StudySessions still from mock
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { format, differenceInDays, parseISO, isToday, isValid } from 'date-fns';
import { motion } from 'framer-motion';
import type { Course, Exam, Task } from '@/lib/types';
import { fetchCourses, fetchExams } from '@/services/apiService';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export default function DashboardPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [tasks] = useState<Task[]>(mockTasks); // Tasks still from mock

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const [coursesData, examsData] = await Promise.all([
          fetchCourses(),
          fetchExams(),
        ]);
        setCourses(coursesData);
        setExams(examsData);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const upcomingTasks = tasks.filter(task => task.status !== 'done').slice(0, 3);
  
  const upcomingExams = exams
    .filter(exam => exam.startsAt && typeof exam.startsAt === 'string' && isValid(parseISO(exam.startsAt)) && differenceInDays(parseISO(exam.startsAt), new Date()) >= 0)
    .sort((a, b) => {
      if (!a.startsAt || !b.startsAt || !isValid(parseISO(a.startsAt)) || !isValid(parseISO(b.startsAt))) return 0;
      return parseISO(a.startsAt).getTime() - parseISO(b.startsAt).getTime();
    })
    .slice(0, 2);

  const nextStudySession = mockStudySessions // Still from mock
    .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .find(session => new Date(session.date) >= new Date());
  
  const coursesToday = courses.filter(course => {
    // This logic might need adjustment based on how 'course.schedule' is structured
    // For now, assuming a simple check or if API provides today's classes directly
    const scheduleDays = course.schedule.match(/[MWFThSuSa]+/g); // Basic attempt to parse days
    const currentDayShort = format(new Date(), 'EEEEE'); // M, T, W, Th, F, S, Su - needs mapping
    // This is a placeholder for more robust schedule parsing
    return scheduleDays ? scheduleDays.some(day => day.includes(currentDayShort)) : false; // Simplified
  }).slice(0,1);


  const quickLinks = [
    { href: '/app/calendar', label: 'View Calendar', icon: CalendarDays },
    { href: '/app/tasks', label: 'Manage Tasks', icon: CheckSquare },
    { href: '/app/study-plan', label: 'Generate Study Plan', icon: Lightbulb },
    { href: '/app/exams', label: 'Plan Exams', icon: BookOpen },
    { href: '/app/settings', label: 'Adjust Settings', icon: Settings },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mt-4">
        <AlertTriangle className="w-4 h-4" />
        <AlertTitle>Error Loading Dashboard</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants}>
      <PageHeader
        title="Welcome Back, Student!"
        description="Here's what's happening with your studies."
        actions={
          <Button asChild>
            <Link href="/app/tasks/new">
              <PlusCircle className="w-4 h-4 mr-2" /> Add New Task
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <DataCard title="Upcoming Classes Today" icon={<CalendarCheck />} index={0}>
          {coursesToday.length > 0 ? coursesToday.map(course => (
             <div key={String(course.courseId)} className="mt-2">
                <p className="font-semibold">{course.title}</p>
                <p className="text-sm text-muted-foreground">{course.schedule}</p>
             </div>
          )) : <p className="text-sm text-muted-foreground">No classes scheduled for today.</p>}
        </DataCard>

        <DataCard title="Next Study Session" icon={<Timer />} index={1}>
          {nextStudySession ? (
            <div className="mt-2">
              <p className="font-semibold">{nextStudySession.title}</p>
              <p className="text-sm text-muted-foreground">
                {format(parseISO(nextStudySession.date), 'MMM dd, yyyy')} at {nextStudySession.startTime}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No upcoming study sessions.</p>
          )}
        </DataCard>
        
        <DataCard title="Pending Tasks" value={tasks.filter(t=>t.status !== 'done').length.toString()} description="Across all courses" icon={<CheckSquare />} index={2} />
        
        <DataCard title="Upcoming Exams" value={upcomingExams.length.toString()} description="In the next few weeks" icon={<BookOpen />} index={3} />
      </div>

      <div className="grid gap-6 mt-6 lg:grid-cols-2">
        <motion.div variants={{hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: {delay: 0.4}}}}>
          <h2 className="mb-4 text-xl font-semibold">Key Deadlines</h2>
          <DataCard title="Assignments & Quizzes" className="h-full">
            <ScrollArea className="h-64">
              {upcomingTasks.length > 0 ? (
                <ul className="space-y-3">
                  {upcomingTasks.map((task) => (
                    <li key={task.id} className="flex items-center justify-between p-3 rounded-md bg-secondary">
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Due: {format(parseISO(task.dueDate), 'MMM dd, yyyy')}
                           <Badge variant={task.priority === 'high' ? 'destructive' : 'outline'} className="ml-2">{task.priority}</Badge>
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/app/tasks/${task.id}`}><ArrowRight className="w-4 h-4" /></Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-center text-muted-foreground">No pressing deadlines. Great job!</p>
              )}
            </ScrollArea>
          </DataCard>
        </motion.div>

        <motion.div variants={{hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: {delay: 0.5}}}}>
          <h2 className="mb-4 text-xl font-semibold">Major Exams Approaching</h2>
          <DataCard title="Exam Schedule" className="h-full">
             <ScrollArea className="h-64">
              {upcomingExams.length > 0 ? (
                <ul className="space-y-3">
                  {upcomingExams.map((exam) => {
                    const courseName = courses.find(c => c.courseId === exam.courseId)?.title || 'N/A';
                    if (!exam.startsAt || !isValid(parseISO(exam.startsAt))) return null;
                    const daysLeft = differenceInDays(parseISO(exam.startsAt), new Date());
                    return (
                    <li key={String(exam.examId)} className="flex items-center justify-between p-3 rounded-md bg-secondary">
                      <div>
                        <p className="font-medium">{exam.examTitle} ({courseName})</p>
                        <p className="text-sm text-muted-foreground">
                          Date: {format(parseISO(exam.startsAt), 'MMM dd, yyyy')} at {format(parseISO(exam.startsAt), 'p')}
                        </p>
                         <p className="text-xs text-destructive-foreground bg-destructive/80 px-1.5 py-0.5 rounded-sm inline-block mt-1">
                          <AlertTriangle className="inline w-3 h-3 mr-1" />
                          {daysLeft} days left
                        </p>
                      </div>
                       <Button variant="ghost" size="sm" asChild>
                        <Link href={`/app/exams/${String(exam.examId)}`}><ArrowRight className="w-4 h-4" /></Link>
                      </Button>
                    </li>
                  )})}
                </ul>
              ) : (
                <p className="text-sm text-center text-muted-foreground">No major exams on the horizon. Keep up the consistent work!</p>
              )}
            </ScrollArea>
          </DataCard>
        </motion.div>
      </div>

      <motion.div className="mt-8" variants={{hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: {delay: 0.6}}}}>
        <h2 className="mb-4 text-xl font-semibold">Quick Links</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {quickLinks.map((link, index) => (
            <Link href={link.href} key={link.label} passHref legacyBehavior>
              <DataCard 
                title={link.label} 
                icon={<link.icon className="w-6 h-6" />} 
                className="text-center group"
                onClick={() => {}} 
                index={index}
              >
                <ArrowRight className="w-5 h-5 mx-auto mt-2 text-muted-foreground group-hover:text-primary" />
              </DataCard>
            </Link>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
