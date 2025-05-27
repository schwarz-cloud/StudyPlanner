import Link from 'next/link';
import { BookOpenCheck } from 'lucide-react';

interface LogoProps {
  className?: string;
  iconSize?: number;
  textSize?: string;
}

export function Logo({ className, iconSize = 24, textSize = "text-2xl" }: LogoProps) {
  return (
    <Link href="/" className={`flex items-center gap-2 font-bold text-primary ${className}`}>
      <BookOpenCheck size={iconSize} />
      <span className={textSize}>StudyPlanner</span>
    </Link>
  );
}
