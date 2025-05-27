
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, CalendarDays, CheckSquare, ListChecks, Settings2, TrendingUp, Zap } from 'lucide-react';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';

const featureVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function LandingPage() {
  const features = [
    {
      icon: <Zap className="h-8 w-8 text-primary" />,
      title: "Smart Scheduling",
      description: "AI-powered algorithms create the optimal study plan for you.",
    },
    {
      icon: <ListChecks className="h-8 w-8 text-primary" />,
      title: "Task Management",
      description: "Keep track of all your assignments, deadlines, and study sessions.",
    },
    {
      icon: <CalendarDays className="h-8 w-8 text-primary" />,
      title: "Interactive Calendar",
      description: "Visualize your schedule and integrate with Google/Outlook.",
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-primary" />,
      title: "Progress Tracking",
      description: "Monitor your learning and adapt your plan for best results.",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex items-center justify-between h-16 max-w-screen-2xl">
          <Logo />
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <motion.section
          className="py-16 md:py-24 text-center bg-gradient-to-b from-background to-secondary"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="container max-w-4xl">
            <motion.h1
              className="text-5xl font-extrabold tracking-tight md:text-6xl lg:text-7xl text-primary"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Optimize Your Study Time
            </motion.h1>
            <motion.p
              className="mt-6 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              StudyPlanner helps you create personalized study plans, manage tasks, and track your progress, all in one place. Focus on learning, we'll handle the planning.
            </motion.p>
            <motion.div
              className="mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Button asChild size="lg" variant="default" className="group">
                <Link href="/app/dashboard">
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </motion.section>

        {/* Features Section */}
        <section className="py-16 md:py-24 bg-background">
          <div className="container">
            <h2 className="mb-12 text-3xl font-bold text-center md:text-4xl">
              Everything You Need to Succeed
            </h2>
            <motion.div
              className="grid gap-8 md:grid-cols-2 lg:grid-cols-4"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              {features.map((feature, index) => (
                <motion.div key={index} variants={featureVariants}>
                  <Card className="h-full text-center transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1">
                    <CardHeader>
                      <div className="flex justify-center mb-4">
                        {feature.icon}
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 md:py-24 bg-secondary">
          <div className="container">
            <h2 className="mb-12 text-3xl font-bold text-center md:text-4xl">How StudyPlanner Works</h2>
            <div className="grid items-center gap-12 md:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6 }}
              >
                <Image
                  src="https://placehold.co/600x400.png"
                  alt="StudyPlanner in action"
                  width={600}
                  height={400}
                  className="rounded-lg shadow-xl"
                  data-ai-hint="study desk"
                />
              </motion.div>
              <motion.div
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
              >
                {[
                  { title: "1. Input Your Courses & Goals", description: "Add your subjects, exam dates, and desired study outcomes." },
                  { title: "2. Get Your Smart Plan", description: "Our AI generates a personalized study schedule tailored to your needs." },
                  { title: "3. Stay Organized & Focused", description: "Manage tasks, track progress, and adjust your plan as needed." },
                  { title: "4. Ace Your Exams!", description: "Achieve academic success with optimized study habits." },
                ].map((step, index) => (
                  <motion.div key={index} className="flex items-start gap-4 mb-6" variants={featureVariants}>
                    <div className="flex items-center justify-center w-8 h-8 mt-1 text-sm font-bold rounded-full bg-primary text-primary-foreground">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{step.title}</h3>
                      <p className="text-muted-foreground">{step.description}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-20 text-center md:py-32 bg-primary text-primary-foreground">
          <div className="container max-w-3xl">
            <motion.h2
              className="text-3xl font-bold md:text-4xl"
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Ready to Transform Your Study Habits?
            </motion.h2>
            <motion.p
              className="mt-4 text-lg text-primary-foreground/80"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Join thousands of students who are studying smarter, not harder, with StudyPlanner.
            </motion.p>
            <motion.div
              className="mt-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Button asChild size="lg" variant="secondary" className="group">
                <Link href="/app/dashboard">
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="py-8 text-center border-t bg-background">
        <div className="container">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} StudyPlanner. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
