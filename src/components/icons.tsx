import {
  type LucideIcon,
  Home,
  UtensilsCrossed,
  ShoppingCart,
  Car,
  HeartPulse,
  Ticket,
  GraduationCap,
  Briefcase,
  Gift,
  MoreHorizontal,
  Lightbulb,
  Building,
} from 'lucide-react';
import { type ExpenseCategory } from '@/lib/types';

export const categoryIcons: Record<ExpenseCategory, LucideIcon> = {
  Groceries: ShoppingCart,
  'Dining Out': UtensilsCrossed,
  Transport: Car,
  Housing: Home,
  Utilities: Lightbulb,
  Health: HeartPulse,
  Entertainment: Ticket,
  Shopping: ShoppingCart,
  Other: MoreHorizontal,
};

type CategoryIconProps = {
  category: ExpenseCategory;
  className?: string;
};

export function CategoryIcon({ category, className }: CategoryIconProps) {
  const Icon = categoryIcons[category] || MoreHorizontal;
  return <Icon className={className} />;
}
