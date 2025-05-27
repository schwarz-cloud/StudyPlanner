
"use client";
import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, BookOpen, Edit2, Trash2, MoreHorizontal, CalendarPlus, Loader2, AlertTriangle } from 'lucide-react';
import type { Exam, Course } from '@/lib/types';
import { fetchExams, fetchCourses } from '@/services/apiService';
import { format, parseISO, differenceInDays, isValid } from 'date-fns';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
};

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const [examsData, coursesData] = await Promise.all([
          fetchExams(),
          fetchCourses(),
        ]);
        setExams(examsData);
        setCourses(coursesData);
      } catch (err) {
        console.error("Failed to load exams data", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const upcomingExams = exams
    .filter(exam => exam.startsAt && isValid(parseISO(exam.startsAt)) && parseISO(exam.startsAt) >= new Date())
    .sort((a, b) => {
      if (!a.startsAt || !b.startsAt || !isValid(parseISO(a.startsAt)) || !isValid(parseISO(b.startsAt))) return 0;
      return parseISO(a.startsAt).getTime() - parseISO(b.startsAt).getTime();
    });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading exams...</p>
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants}>
      <PageHeader
        title="Exams & Revision"
        description="Manage your exam schedule and plan your revision sessions."
        actions={
          <Button> {/* This button's functionality is not connected to API POST yet */}
            <PlusCircle className="w-4 h-4 mr-2" /> Add New Exam
          </Button>
        }
      />
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="w-4 h-4" />
          <AlertTitle>Error Loading Exams Data</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <motion.div variants={itemVariants}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Upcoming Exams</CardTitle>
            <CardDescription>
              Here is a list of your scheduled exams. Make sure to plan your revision!
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingExams.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Duration (mins)</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead>Total Marks</TableHead>
                    <TableHead>Days Left</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingExams.map((exam) => {
                    const courseName = courses.find(c => c.courseId === exam.courseId)?.title || 'N/A';
                    if (!exam.startsAt || !isValid(parseISO(exam.startsAt))) return null;
                    const daysLeft = differenceInDays(parseISO(exam.startsAt), new Date());
                    return (
                      <TableRow key={String(exam.examId)}>
                        <TableCell className="font-medium">{exam.examTitle}</TableCell>
                        <TableCell>{courseName}</TableCell>
                        <TableCell>{format(parseISO(exam.startsAt), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{format(parseISO(exam.startsAt), 'p')}</TableCell>
                        <TableCell>{exam.duration}</TableCell>
                        <TableCell>{exam.language}</TableCell>
                        <TableCell>{exam.totalMark}</TableCell>
                        <TableCell>
                          <Badge variant={daysLeft < 7 ? 'destructive' : 'outline'}>
                            {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                           <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <CalendarPlus className="w-4 h-4 mr-2" /> Schedule Revision
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit2 className="w-4 h-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
               <div className="py-10 text-center">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">No upcoming exams scheduled.</p>
                <p className="text-sm text-muted-foreground">Add new exams to start planning your revisions.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Revision Planner</CardTitle>
            <CardDescription>Auto-schedule pre-exam revision sessions based on your availability and exam dates. (Feature coming soon)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-6 text-center border-2 border-dashed rounded-md border-muted">
              <CalendarPlus className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">The smart revision scheduler is under development.</p>
              <Button variant="secondary" className="mt-4" disabled>Generate Revision Plan</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
