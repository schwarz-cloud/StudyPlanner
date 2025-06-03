"use client";
import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Bell, Clock, Zap } from 'lucide-react';
import { mockUserPreferences } from '@/lib/mock-data';
import type { UserPreferences } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

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

type StudyTimeOption = 'morning' | 'afternoon' | 'evening';
const studyTimeOptions: StudyTimeOption[] = ['morning', 'afternoon', 'evening'];

type StudyTechniqueOption = 'pomodoro' | 'spaced_repetition' ;
const studyTechniqueOptions: StudyTechniqueOption[] = ['pomodoro', 'spaced_repetition'];


export default function SettingsPage() {
  const [preferences, setPreferences] = useState<UserPreferences>(mockUserPreferences);
  const { toast } = useToast();

  const handlePreferredTimeChange = (time: StudyTimeOption) => {
    setPreferences(prev => {
      const newTimes = prev.preferredStudyTimes.includes(time)
        ? prev.preferredStudyTimes.filter(t => t !== time)
        : [...prev.preferredStudyTimes, time];
      return { ...prev, preferredStudyTimes: newTimes };
    });
  };

  const handleStudyTechniqueChange = (technique: StudyTechniqueOption) => {
     setPreferences(prev => {
      const newTechniques = prev.studyTechniques.includes(technique)
        ? prev.studyTechniques.filter(t => t !== technique)
        : [...prev.studyTechniques, technique];
      return { ...prev, studyTechniques: newTechniques };
    });
  };
  
  const handleInputChange = (field: keyof UserPreferences['notificationLeadTimes'], value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      setPreferences(prev => ({
        ...prev,
        notificationLeadTimes: {
          ...prev.notificationLeadTimes,
          [field]: numValue,
        },
      }));
    }
  };

  const handleSessionLengthChange = (value: string) => {
     const numValue = parseInt(value, 10);
     if(!isNaN(numValue)) {
        setPreferences(prev => ({ ...prev, defaultSessionLength: numValue }));
     }
  }

  const handleBreakCadenceChange = (value: string) => {
     const numValue = parseInt(value, 10);
     if(!isNaN(numValue)) {
        setPreferences(prev => ({ ...prev, defaultBreakCadence: numValue }));
     }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send data to a backend
    console.log("Preferences saved:", preferences);
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated successfully.",
    });
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants}>
      <PageHeader
        title="Settings & Preferences"
        description="Customize your StudyPlanner experience to match your study style."
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        <Accordion type="multiple" defaultValue={['studyPrefs', 'notifications']} className="w-full space-y-6">
          <AccordionItem value="studyPrefs" className="border-none">
             <motion.div variants={itemVariants}>
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Zap className="w-5 h-5 text-primary"/> Study Preferences</CardTitle>
                  <CardDescription>Tailor how StudyPlanner helps you study.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label className="text-base">Preferred Study Times</Label>
                    <div className="grid grid-cols-1 gap-4 mt-2 sm:grid-cols-3">
                      {studyTimeOptions.map((time) => (
                        <div key={time} className="flex items-center p-3 space-x-2 border rounded-md">
                          <Checkbox
                            id={`time-${time}`}
                            checked={preferences.preferredStudyTimes.includes(time)}
                            onCheckedChange={() => handlePreferredTimeChange(time)}
                          />
                          <label htmlFor={`time-${time}`} className="text-sm font-medium capitalize">
                            {time}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-base">Study Techniques</Label>
                     <div className="grid grid-cols-1 gap-4 mt-2 sm:grid-cols-3">
                       {studyTechniqueOptions.map((technique) => (
                        <div key={technique} className="flex items-center p-3 space-x-2 border rounded-md">
                          <Checkbox
                            id={`technique-${technique}`}
                            checked={preferences.studyTechniques.includes(technique)}
                            onCheckedChange={() => handleStudyTechniqueChange(technique)}
                          />
                          <label htmlFor={`technique-${technique}`} className="text-sm font-medium capitalize">
                            {technique.replace('_', ' ')}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="sessionLength" className="text-base">Default Session Length (minutes)</Label>
                      <Input
                        id="sessionLength"
                        type="number"
                        value={preferences.defaultSessionLength}
                        onChange={(e) => handleSessionLengthChange(e.target.value)}
                        className="mt-1"
                        min="15"
                        max="120"
                        step="5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="breakCadence" className="text-base">Default Break Cadence (minutes)</Label>
                      <Input
                        id="breakCadence"
                        type="number"
                        value={preferences.defaultBreakCadence}
                        onChange={(e) => handleBreakCadenceChange(e.target.value)}
                        className="mt-1"
                        min="5"
                        max="30"
                        step="1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AccordionItem>
          
          <AccordionItem value="notifications" className="border-none">
            <motion.div variants={itemVariants}>
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5 text-primary"/> Notification Preferences</CardTitle>
                  <CardDescription>Set how and when you receive reminders.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label htmlFor="taskReminder" className="text-base">Task Reminder Lead Time (hours before)</Label>
                    <Input
                      id="taskReminder"
                      type="number"
                      value={preferences.notificationLeadTimes.task}
                      onChange={(e) => handleInputChange('task', e.target.value)}
                      className="mt-1"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sessionReminder" className="text-base">Study Session Reminder Lead Time (hours before)</Label>
                    <Input
                      id="sessionReminder"
                      type="number"
                      value={preferences.notificationLeadTimes.session}
                      onChange={(e) => handleInputChange('session', e.target.value)}
                      className="mt-1"
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="examReminder" className="text-base">Exam Reminder Lead Time (days before)</Label>
                    <Input
                      id="examReminder"
                      type="number"
                      value={preferences.notificationLeadTimes.exam}
                      onChange={(e) => handleInputChange('exam', e.target.value)}
                      className="mt-1"
                      min="0"
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AccordionItem>
        </Accordion>

        <motion.div variants={itemVariants} className="flex justify-end">
          <Button type="submit" size="lg">
            <Save className="w-4 h-4 mr-2" /> Save Preferences
          </Button>
        </motion.div>
      </form>
    </motion.div>
  );
}
