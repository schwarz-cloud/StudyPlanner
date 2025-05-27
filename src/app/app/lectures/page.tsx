
"use client";
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Clapperboard, Loader2, AlertTriangle } from 'lucide-react';
import type { Lecture, Course } from '@/lib/types';
import { fetchLectures, fetchCourses } from '@/services/apiService';
import { format, parseISO, isPast, isValid } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

export default function LecturesPage() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const [lecturesData, coursesData] = await Promise.all([
          fetchLectures(),
          fetchCourses(),
        ]);
        setLectures(lecturesData);
        setCourses(coursesData);
      } catch (err) {
        console.error("Failed to load lectures data", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const toggleLectureCompletion = (lectureId: string | number) => {
    // This would ideally be an API call to update completion status
    setLectures(prevLectures =>
      prevLectures.map(lecture =>
        lecture.lectureId === lectureId ? { ...lecture, isDone: !lecture.isDone } : lecture // Use isDone
      )
    );
    // Example: updateLectureStatus(lectureId, newStatus).catch(err => console.error("Failed to update lecture", err));
  };

  const lecturesByCourse: Record<string, Lecture[]> = lectures.reduce((acc, lecture) => {
    const courseId = String(lecture.courseId || 'uncategorized');
    if (!acc[courseId]) {
      acc[courseId] = [];
    }
    acc[courseId].push(lecture);
    return acc;
  }, {} as Record<string, Lecture[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading lectures...</p>
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants}>
      <PageHeader
        title="Lectures Schedule"
        description="Keep track of your lectures and mark them as completed."
        actions={
          <Button> {/* This button's functionality is not connected to API POST yet */}
            <PlusCircle className="w-4 h-4 mr-2" /> Add New Lecture
          </Button>
        }
      />
      {error && (
         <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="w-4 h-4" />
          <AlertTitle>Error Loading Lectures Data</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <motion.div variants={itemVariants}>
        {Object.entries(lecturesByCourse).length > 0 ? (
           <Accordion type="multiple" defaultValue={Object.keys(lecturesByCourse)} className="w-full space-y-4">
            {Object.entries(lecturesByCourse).map(([courseId, courseLectures]) => {
              const course = courses.find(c => String(c.courseId) === courseId);
              return (
                <AccordionItem value={courseId} key={courseId} className="border rounded-lg shadow-md bg-card">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <Clapperboard className="w-6 h-6 text-primary" />
                      <span className="text-lg font-semibold">{course?.title || "Uncategorized Lectures"}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pt-0 pb-4">
                    <ul className="space-y-3">
                      <AnimatePresence>
                        {courseLectures
                          .sort((a,b) => {
                            if(!a.startsAt || !b.startsAt || !isValid(parseISO(a.startsAt)) || !isValid(parseISO(b.startsAt))) return 0;
                            return parseISO(a.startsAt).getTime() - parseISO(b.startsAt).getTime()
                          })
                          .map((lecture) => {
                            if(!lecture.startsAt || !isValid(parseISO(lecture.startsAt)) || !lecture.endsAt || !isValid(parseISO(lecture.endsAt))) return null;
                            return (
                          <motion.li
                            key={String(lecture.lectureId)}
                            variants={itemVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className={`p-4 rounded-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${lecture.isDone ? 'bg-secondary/50 opacity-70' : 'bg-secondary'}`}
                          >
                            <div className="flex-grow">
                              <h3 className={`font-medium ${lecture.isDone ? 'line-through' : ''}`}>{lecture.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {format(parseISO(lecture.startsAt), 'MMM dd, yyyy, p')} 
                                {lecture.endsAt !== lecture.startsAt ? ` to ${format(parseISO(lecture.endsAt), 'MMM dd, yyyy, p')}` : ''}
                              </p>
                              {isPast(parseISO(lecture.endsAt)) && !lecture.isDone && ( 
                                <Badge variant="destructive" className="mt-1 text-xs">Past Due</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 shrink-0">
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id={`completed-${String(lecture.lectureId)}`}
                                  checked={lecture.isDone}
                                  onCheckedChange={() => toggleLectureCompletion(lecture.lectureId)}
                                  aria-label={`Mark ${lecture.title} as ${lecture.isDone ? 'incomplete' : 'complete'}`}
                                />
                                <label htmlFor={`completed-${String(lecture.lectureId)}`} className="text-sm">
                                  {lecture.isDone ? 'Completed' : 'Mark Done'}
                                </label>
                              </div>
                            </div>
                          </motion.li>
                        )})}
                      </AnimatePresence>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        ) : (
          <Card className="shadow-lg">
            <CardContent className="py-10 text-center">
              <Clapperboard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">No lectures scheduled yet.</p>
              <p className="text-sm text-muted-foreground">Add lectures to see them here, or check if the API is returning data.</p>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </motion.div>
  );
}
