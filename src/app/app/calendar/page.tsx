
"use client";
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { PlusCircle, CalendarDays, Loader2, AlertTriangle } from 'lucide-react';
import { mockStudySessions, mockTasks } from '@/lib/mock-data';
import type { Course, Exam, Lecture, Task, StudySession } from '@/lib/types';
import { fetchCourses, fetchExams, fetchLectures } from '@/services/apiService';
import { format, parseISO, isValid, startOfDay, isSameDay, isSameMonth, isSameWeek, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { motion } from 'framer-motion';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CalendarEvent {
  id: string | number;
  title: string;
  date: Date;
  type: 'session' | 'exam' | 'task' | 'lecture' | 'course' | 'personal' | 'other';
  color: string;
  details?: string;
  startTime?: string; // For sorting and display if available
  endTime?: string;   // For sorting and display if available
}

const addEventFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.date({ required_error: "Date is required" }),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Use HH:MM format (e.g., 09:00 or 14:30)"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Use HH:MM format (e.g., 10:00 or 15:30)"),
  type: z.enum(['session', 'task', 'exam', 'lecture', 'personal', 'other'], { required_error: "Event type is required" }),
  details: z.string().optional(),
}).refine(data => {
    if (data.startTime && data.endTime) {
        const [startH, startM] = data.startTime.split(':').map(Number);
        const [endH, endM] = data.endTime.split(':').map(Number);
        return endH > startH || (endH === startH && endM > startM);
    }
    return true;
}, {
    message: "End time must be after start time",
    path: ["endTime"],
});
type AddEventFormValues = z.infer<typeof addEventFormSchema>;


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

function safeParseISO(dateStr?: string | null): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parsed = parseISO(dateStr);
  return isValid(parsed) ? parsed : null;
}

const getColorForEventType = (type: CalendarEvent['type']): string => {
  switch (type) {
    case 'session': return 'bg-blue-500';
    case 'exam': return 'bg-red-500';
    case 'task': return 'bg-yellow-600'; 
    case 'lecture': return 'bg-green-500';
    case 'course': return 'bg-purple-500';
    case 'personal': return 'bg-indigo-500';
    case 'other': return 'bg-gray-500';
    default: return 'bg-gray-500';
  }
};

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day'>('month');
  
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
  const [eventsToDisplay, setEventsToDisplay] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<AddEventFormValues>({
    resolver: zodResolver(addEventFormSchema),
    defaultValues: {
      title: "",
      date: new Date(),
      startTime: "09:00",
      endTime: "10:00",
      type: 'personal',
      details: "",
    },
  });

  useEffect(() => {
    form.setValue("date", selectedDate || new Date());
  }, [selectedDate, form]);

  useEffect(() => {
    async function loadCalendarData() {
      setIsLoading(true);
      setError(null);
      try {
        const [examsData, lecturesData] = await Promise.all([
          fetchExams(),
          fetchLectures(),
        ]);

        const fetchedEvents: CalendarEvent[] = [];
        
        examsData.forEach(e => {
          const parsedDate = safeParseISO(e.startsAt);
          if (!parsedDate) return; 
          fetchedEvents.push({ 
            id: String(e.examId), 
            title: `Exam: ${e.examTitle}`,
            date: startOfDay(parsedDate),
            type: 'exam', 
            color: getColorForEventType('exam'), 
            details: `Duration: ${e.duration} mins, Time: ${format(parsedDate, 'p')}`,
            startTime: format(parsedDate, 'HH:mm')
          });
        });

        lecturesData.forEach(l => {
          const start = safeParseISO(l.startsAt);
          const end = safeParseISO(l.endsAt);
          if (!start || !end) return; 
          fetchedEvents.push({ 
            id: String(l.lectureId), 
            title: `Lecture: ${l.title}`, 
            date: startOfDay(start), 
            type: 'lecture', 
            color: getColorForEventType('lecture'), 
            details: `Status: ${l.isDone ? 'Completed' : 'Pending'}. Spans ${format(start, 'MMM dd, HH:mm')} to ${format(end, 'MMM dd, HH:mm')}`,
            startTime: format(start, 'HH:mm'),
            endTime: format(end, 'HH:mm')
          });
        });
        
        const initialEvents: CalendarEvent[] = [
          ...fetchedEvents,
          ...mockStudySessions.map(s => ({
            id: s.id,
            title: s.title,
            date: startOfDay(safeParseISO(s.date) ?? new Date()),
            type: 'session' as const,
            color: getColorForEventType('session'),
            details: `${s.startTime} - ${s.endTime}`,
            startTime: s.startTime?.replace(/( AM| PM)/, '') || undefined, 
            endTime: s.endTime?.replace(/( AM| PM)/, '') || undefined,
          })),
          ...mockTasks.map(t => ({
            id: t.id,
            title: `Task Due: ${t.title}`,
            date: startOfDay(safeParseISO(t.dueDate) ?? new Date()),
            type: 'task' as const,
            color: getColorForEventType('task'),
          })),
        ];
        setAllEvents(initialEvents);

      } catch (err) {
        console.error("Failed to load calendar data", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
      } finally {
        setIsLoading(false);
      }
    }
    loadCalendarData();
  }, []);

  useEffect(() => {
    if (!selectedDate) {
      setEventsToDisplay([]);
      return;
    }
    let filtered: CalendarEvent[] = [];
    if (currentView === 'day' || currentView === 'month') {
      filtered = allEvents.filter(event => isSameDay(event.date, selectedDate));
    } else if (currentView === 'week') {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      filtered = allEvents.filter(event => isWithinInterval(event.date, { start: weekStart, end: weekEnd }));
    }
    
    setEventsToDisplay(
      filtered.sort((a, b) => {
        const dateComparison = a.date.getTime() - b.date.getTime();
        if (dateComparison !== 0) return dateComparison;
        if (a.startTime && b.startTime) {
          return a.startTime.localeCompare(b.startTime);
        }
        return 0;
      })
    );
  }, [selectedDate, currentView, allEvents]);

  function onAddEventSubmit(data: AddEventFormValues) {
    const newEventDate = startOfDay(data.date);
    const newEvent: CalendarEvent = {
      id: `custom-${Date.now()}`,
      title: data.title,
      date: newEventDate,
      type: data.type,
      color: getColorForEventType(data.type),
      details: `${data.startTime} - ${data.endTime}${data.details ? `. ${data.details}` : ''}`,
      startTime: data.startTime,
      endTime: data.endTime,
    };
    setAllEvents(prevEvents => [...prevEvents, newEvent]);
    setIsAddEventDialogOpen(false);
    form.reset({
        title: "",
        date: selectedDate || new Date(),
        startTime: "09:00",
        endTime: "10:00",
        type: 'personal',
        details: "",
      });
    toast({ title: "Event Added", description: `"${newEvent.title}" has been added to your calendar.` });
  }

  const getEventListTitle = () => {
    if (!selectedDate) return "No date selected";
    if (currentView === 'day' || currentView === 'month') return `Events for ${format(selectedDate, 'MMMM dd, yyyy')}`;
    if (currentView === 'week') {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
      return `Events for Week: ${format(weekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd, yyyy')}`;
    }
    return "Events";
  };

  const getCalendarDayEventsForDot = (date: Date) => {
     return allEvents.filter(event => isSameDay(event.date, date));
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading calendar...</p>
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants}>
      <PageHeader
        title="My Calendar"
        description="View and manage your classes, study sessions, and deadlines."
        actions={
          <Dialog open={isAddEventDialogOpen} onOpenChange={setIsAddEventDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="w-4 h-4 mr-2" /> Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Add New Event</DialogTitle>
                <DialogDescription>
                  Fill in the details for your new calendar event.
                </DialogDescription>
              </DialogHeader>
              <div className="flex-grow overflow-y-auto pr-6 -mr-6"> {/* Adjusted padding for scrollbar */}
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onAddEventSubmit)} className="space-y-4 py-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Event title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                             <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={(date) => field.onChange(date || new Date())}
                                initialFocus
                                className="p-0 [&_button]:h-8 [&_button]:w-8 [&_td]:w-8 [&_th]:w-8"
                              />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Time (HH:MM)</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="endTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Time (HH:MM)</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                     <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Event Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select event type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="personal">Personal</SelectItem>
                              <SelectItem value="session">Study Session</SelectItem>
                              <SelectItem value="task">Task Deadline</SelectItem>
                              <SelectItem value="exam">Exam</SelectItem>
                              <SelectItem value="lecture">Lecture</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="details"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Details (Optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Any additional details..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              </div>
              <DialogFooter className="mt-4"> {/* Added margin-top to ensure footer is visible */}
                <DialogClose asChild>
                   <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                {/* Important: The submit button for the form needs to be of type="button" and trigger form.handleSubmit manually, 
                    or be inside the form tag and be type="submit". 
                    Since DialogFooter is outside the form tag in this structure, let's ensure the actual submit happens correctly.
                    For simplicity and directness, we will make DialogFooter part of the scrollable content to keep button inside form.
                    Alternatively, trigger submit programmatically.
                    For now, let's assume the Button type="submit" on the form inside scrollable area is the primary submit.
                    The DialogFooter is outside the scrollable div, so we need to ensure the button here correctly submits the form.
                    The `onSubmit` is on the `<form>` tag. A button of type="submit" *inside* that form will trigger it.
                    If the submit button is in DialogFooter (outside the form), it needs to programmatically submit:
                    e.g. <Button onClick={form.handleSubmit(onAddEventSubmit)}>Add Event</Button>
                */}
                 <Button onClick={form.handleSubmit(onAddEventSubmit)}>Add Event</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="w-4 h-4" />
          <AlertTitle>Error Loading Calendar Data</AlertTitle>
          <AlertDescription>{error} Some events might be missing or based on fallback data.</AlertDescription>
        </Alert>
      )}

      <motion.div variants={itemVariants}>
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-xl">Schedule Overview</CardTitle>
              <Tabs defaultValue="month" onValueChange={(value) => setCurrentView(value as 'month' | 'week' | 'day')}>
                <TabsList>
                  <TabsTrigger value="month">Month</TabsTrigger>
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="day">Day</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="p-0 border rounded-md"
                modifiers={{
                  eventDay: allEvents.map(e => e.date)
                }}
                modifiersStyles={{
                  eventDay: { fontWeight: 'bold', border: '2px solid hsl(var(--primary))', borderRadius: 'var(--radius)' }
                }}
                components={{
                  DayContent: ({ date, displayMonth }) => {
                    const dayEvents = getCalendarDayEventsForDot(date);
                    const isCurrentDisplayMonth = date.getMonth() === displayMonth.getMonth();
                    return (
                      <div className="relative flex flex-col items-center justify-center w-full h-full">
                        <span>{date.getDate()}</span>
                        {isCurrentDisplayMonth && dayEvents.length > 0 && (
                          <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-0.5">
                            {dayEvents.slice(0,3).map(event => (
                              <span key={String(event.id)} className={`h-1 w-1 rounded-full ${event.color}`}></span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }
                }}
              />
            </div>
            <div className="md:col-span-1">
              <h3 className="mb-4 text-lg font-semibold">
                {getEventListTitle()}
              </h3>
              {eventsToDisplay.length > 0 ? (
                <ScrollArea className="h-96">
                  <ul className="pr-4 space-y-3">
                    {eventsToDisplay.map(event => (
                      <li key={String(event.id)} className={`p-3 rounded-md text-sm ${event.color} text-white shadow`}>
                        <p className="font-semibold">{event.title}</p>
                        {currentView === 'week' && <p className="text-xs opacity-90">{format(event.date, 'EEE, MMM dd')}</p>}
                        {event.details && <p className="text-xs opacity-90">{event.details}</p>}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground">No events for this period.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Important Dates</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {allEvents
                .filter(e => e.date >= startOfDay(new Date()))
                .sort((a,b) => {
                    const dateComparison = a.date.getTime() - b.date.getTime();
                    if (dateComparison !== 0) return dateComparison;
                    if (a.startTime && b.startTime) {
                      return a.startTime.localeCompare(b.startTime);
                    }
                    return 0;
                  })
                .slice(0,5)
                .map(event => (
                  <li key={`${event.type}-${String(event.id)}`} className="flex items-center gap-3 p-2 rounded-md bg-secondary">
                    <CalendarDays className={`w-5 h-5 ${ event.type === 'exam' ? 'text-destructive' : 'text-primary'}`} />
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground">{format(event.date, 'EEEE, MMM dd, yyyy')} {event.details}</p>
                    </div>
                  </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

