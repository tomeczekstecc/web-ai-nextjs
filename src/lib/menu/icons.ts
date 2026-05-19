import type { LucideIcon } from "lucide-react";
import {
  Terminal,
  Bot,
  BookOpen,
  Settings2,
  Folder,
  Sparkles,
  CircleUser,
  CreditCard,
  Bell,
  LogOut,
  Layout,
  TrendingUp,
  Map,
  MoreHorizontal,
  Cpu,
  Circle,
  LayoutDashboard,
  Trophy,
  FileText,
  Calendar,
  BarChart3,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Terminal,
  Bot,
  BookOpen,
  Settings2,
  Folder,
  Sparkles,
  CircleUser,
  CreditCard,
  Bell,
  LogOut,
  Layout,
  TrendingUp,
  Map,
  MoreHorizontal,
  Cpu,
  Circle,
  LayoutDashboard,
  Trophy,
  FileText,
  Calendar,
  BarChart3,
};

function kebabToPascal(str: string): string {
  return str
    .split("-")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join("");
}

export function resolveIcon(name: string): LucideIcon {
  const pascalName = kebabToPascal(name);
  return iconMap[pascalName] ?? Circle;
}
