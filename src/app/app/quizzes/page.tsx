
"use client";
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, ListChecks, Edit2, Trash2, MoreHorizontal, Loader2, AlertTriangle } from 'lucide-react';
import type { Quiz, Course, Lecture } from '@/lib/types';
import { fetchQuizzes, fetchCourses, fetchLectures } from '@/services/apiService';
import { format, parseISO, isPast, isValid } from 'date-fns';
import { motion } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Local state for completion, as API doesn't provide it.
  const [quizCompletion, setQuizCompletion] = useState<Record<string, boolean>>({});


  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const [quizzesData, coursesData, lecturesData] = await Promise.all([
          fetchQuizzes(),
          fetchCourses(),
          fetchLectures(),
        ]);
        setQuizzes(quizzesData);
        setCourses(coursesData);
        setLectures(lecturesData);
        // Initialize local completion state (all false by default)
        const initialCompletion: Record<string, boolean> = {};
        quizzesData.forEach(q => initialCompletion[String(q.quizId)] = false); // Assuming not completed by default
        setQuizCompletion(initialCompletion);

      } catch (err) {
        console.error("Failed to load quizzes data", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const toggleQuizCompletion = (quizId: string | number) => {
    // This updates local state only, as API doesn't support 'completed' or 'dueDate' for quizzes.
    setQuizCompletion(prev => ({ ...prev, [String(quizId)]: !prev[String(quizId)] }));
    // If API supported updates:
    // updateQuizStatus(quizId, newStatus).catch(err => console.error("Failed to update quiz", err));
  };
  
  // API does not provide dueDate or completion status for sorting.
  // Sorting by creationDate as a proxy.
  const sortedQuizzes = [...quizzes].sort((a, b) => {
    const aCompleted = quizCompletion[String(a.quizId)];
    const bCompleted = quizCompletion[String(b.quizId)];
    if (aCompleted === bCompleted) {
      if (!a.creationDate || !b.creationDate || !isValid(parseISO(a.creationDate)) || !isValid(parseISO(b.creationDate))) return 0;
      return parseISO(b.creationDate).getTime() - parseISO(a.creationDate).getTime(); // Newest first
    }
    return aCompleted ? 1 : -1; // Incomplete first
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading quizzes...</p>
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants}>
      <PageHeader
        title="Quizzes"
        description="Track your quiz assignments and their completion status."
        actions={
          <Button> {/* This button's functionality is not connected to API POST yet */}
            <PlusCircle className="w-4 h-4 mr-2" /> Add New Quiz
          </Button>
        }
      />
       {error && (
         <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="w-4 h-4" />
          <AlertTitle>Error Loading Quizzes Data</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <motion.div variants={itemVariants}>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Quiz Overview</CardTitle>
            <CardDescription>
              Manage all your quizzes. Due dates and completion are managed locally as API doesn't provide them.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sortedQuizzes.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Quiz Title</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Related Lecture</TableHead>
                    <TableHead>Creation Date</TableHead>
                    <TableHead>Total Marks</TableHead>
                    <TableHead>Status (Local)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedQuizzes.map((quiz) => {
                    const course = courses.find(c => c.courseId === quiz.courseId);
                    const lecture = lectures.find(l => l.lectureId === quiz.lectureId);
                    const isCompleted = quizCompletion[String(quiz.quizId)];
                    
                    if(!quiz.creationDate || !isValid(parseISO(quiz.creationDate))) return null;

                    return (
                      <TableRow key={String(quiz.quizId)} className={isCompleted ? 'opacity-60' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={isCompleted}
                            onCheckedChange={() => toggleQuizCompletion(quiz.quizId)}
                            aria-label={`Mark ${quiz.title} as ${isCompleted ? 'incomplete' : 'complete'}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{quiz.title}</TableCell>
                        <TableCell>{course?.title || 'N/A'}</TableCell>
                        <TableCell>{lecture?.title || 'N/A'}</TableCell>
                        <TableCell>
                          {format(parseISO(quiz.creationDate), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>{quiz.totalMarks}</TableCell>
                        <TableCell>
                          <Badge variant={isCompleted ? 'default' : 'outline'}>
                            {isCompleted ? 'Completed' : 'Pending'}
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
                <ListChecks className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">No quizzes found.</p>
                <p className="text-sm text-muted-foreground">Add quizzes to start tracking them, or check if the API is returning data.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
