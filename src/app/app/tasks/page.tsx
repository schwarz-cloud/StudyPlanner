"use client";
import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PlusCircle, MoreHorizontal, Edit2, Trash2, Filter, ArrowUpDown } from 'lucide-react';
import { mockTasks } from '@/lib/mock-data';
import type { Task } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { motion } from 'framer-motion';

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

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [filter, setFilter] = useState<'all' | 'todo' | 'inprogress' | 'done'>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'title'>('dueDate');

  const filteredTasks = tasks
    .filter(task => filter === 'all' || task.status === filter)
    .sort((a, b) => {
      if (sortBy === 'dueDate') return parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime();
      if (sortBy === 'priority') {
        const priorityOrder = { high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.title.localeCompare(b.title);
    });

  const toggleTaskStatus = (taskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { ...task, status: task.status === 'done' ? 'todo' : 'done' }
          : task
      )
    );
  };

  const getPriorityBadgeVariant = (priority: Task['priority']) => {
    if (priority === 'high') return 'destructive';
    if (priority === 'medium') return 'default'; // or 'secondary' if it looks better
    return 'outline';
  };
  
  const getStatusBadgeVariant = (status: Task['status']) => {
    if (status === 'done') return 'default'; // Using 'default' (primary) for done
    if (status === 'inprogress') return 'secondary';
    return 'outline';
  };


  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants}>
      <PageHeader
        title="Task Management"
        description="Organize your assignments, homework, and study tasks."
        actions={
          <Button>
            <PlusCircle className="w-4 h-4 mr-2" /> Add New Task
          </Button>
        }
      />

      <motion.div variants={itemVariants}>
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Your Tasks</CardTitle>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Filter className="w-4 h-4 mr-2" /> Filter: {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setFilter('all')}>All</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilter('todo')}>To Do</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilter('inprogress')}>In Progress</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilter('done')}>Done</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <ArrowUpDown className="w-4 h-4 mr-2" /> Sort By: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSortBy('dueDate')}>Due Date</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('priority')}>Priority</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('title')}>Title</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredTasks.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTasks.map((task) => (
                    <TableRow key={task.id} className={task.status === 'done' ? 'opacity-60' : ''}>
                      <TableCell>
                        <Checkbox
                          checked={task.status === 'done'}
                          onCheckedChange={() => toggleTaskStatus(task.id)}
                          aria-label={`Mark ${task.title} as ${task.status === 'done' ? 'not done' : 'done'}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell>{format(parseISO(task.dueDate), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant={getPriorityBadgeVariant(task.priority)}>{task.priority}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(task.status)}>{task.status}</Badge>
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
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-10 text-center">
                <p className="text-lg text-muted-foreground">No tasks match your current filters.</p>
                {filter !== 'all' && (
                   <Button variant="link" onClick={() => setFilter('all')}>Show all tasks</Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
