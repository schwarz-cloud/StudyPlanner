"use client";
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface DataCardProps {
  title: string;
  value?: string;
  description?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  index?: number; // For staggered animation
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
    },
  }),
};


export function DataCard({ title, value, description, icon, children, className, onClick, index }: DataCardProps) {
  return (
    <motion.div
      custom={index}
      variants={cardVariants}
    >
      <Card 
        className={`shadow-md hover:shadow-lg transition-shadow ${onClick ? 'cursor-pointer' : ''} ${className}`}
        onClick={onClick}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </CardHeader>
        <CardContent>
          {value && <div className="text-2xl font-bold">{value}</div>}
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}
