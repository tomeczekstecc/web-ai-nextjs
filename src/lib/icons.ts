import type { LucideIcon } from "lucide-react";
import {
  // Navigation & Layout
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  GripVertical,
  MoreHorizontal,
  PanelLeft,
  
  // Actions
  Plus,
  Trash2,
  Share,
  X,
  Check,
  Loader2,
  
  // Status & Feedback
  CircleCheck,
  OctagonX,
  TriangleAlert,
  Info,
  BadgeCheck,
  ShieldCheck,
  
  // Content & Data
  Folder,
  FileText,
  FileSpreadsheet,
  BookOpen,
  
  // Features & Concepts
  Terminal,
  Bot,
  Sparkles,
  Cpu,
  Settings2,
  Zap,
  Component,
  GitBranch,
  Globe,
  
  // Charts & Analytics
  TrendingUp,
  TrendingDown,
  BarChart3,
  
  // User & Account
  CircleUser,
  CreditCard,
  Bell,
  LogOut,
  
  // Layout & Views
  Layout,
  LayoutDashboard,
  Map,
  Calendar,
  Trophy,
  
  // Theme
  Moon,
  Sun,
  
  // Fallback
  Circle,
  CircleHelp,
} from "lucide-react";

// -----------------------------------------------------------------------------
// Icon Registry
// -----------------------------------------------------------------------------

/**
 * Central icon registry mapping PascalCase names to Lucide components.
 * 
 * This registry enables dynamic icon resolution from string names (e.g., from
 * JSON configs, database records, or API responses) while maintaining
 * tree-shaking for unused icons.
 * 
 * Add icons here as needed — only icons in this registry can be resolved
 * dynamically. Direct imports from lucide-react remain available for
 * static usage in components.
 */
const iconRegistry = {
  // Navigation & Layout
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  GripVertical,
  MoreHorizontal,
  PanelLeft,
  
  // Actions
  Plus,
  Trash2,
  Share,
  X,
  Check,
  Loader2,
  
  // Status & Feedback
  CircleCheck,
  OctagonX,
  TriangleAlert,
  Info,
  BadgeCheck,
  ShieldCheck,
  
  // Content & Data
  Folder,
  FileText,
  FileSpreadsheet,
  BookOpen,
  
  // Features & Concepts
  Terminal,
  Bot,
  Sparkles,
  Cpu,
  Settings2,
  Zap,
  Component,
  GitBranch,
  Globe,
  
  // Charts & Analytics
  TrendingUp,
  TrendingDown,
  BarChart3,
  
  // User & Account
  CircleUser,
  CreditCard,
  Bell,
  LogOut,
  
  // Layout & Views
  Layout,
  LayoutDashboard,
  Map,
  Calendar,
  Trophy,
  
  // Theme
  Moon,
  Sun,
  
  // Fallback / Generic
  Circle,
  CircleHelp,
} as const satisfies Record<string, LucideIcon>;

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

/** Union of all registered icon names (PascalCase). */
export type IconName = keyof typeof iconRegistry;

/** Type guard for checking if a string is a valid registered icon name. */
export function isIconName(name: string): name is IconName {
  return name in iconRegistry;
}

// -----------------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------------

/**
 * Convert kebab-case or snake_case to PascalCase.
 * 
 * @example
 * toPascalCase("arrow-right")  // "ArrowRight"
 * toPascalCase("trending_up")  // "TrendingUp"
 * toPascalCase("Settings2")    // "Settings2"
 */
function toPascalCase(str: string): string {
  return str
    .split(/[-_]/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join("");
}

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/** Default fallback icon when resolution fails. */
export const FallbackIcon: LucideIcon = Circle;

/**
 * Resolve an icon component from a string name.
 * 
 * Accepts kebab-case, snake_case, or PascalCase names and returns the
 * corresponding Lucide icon component. Falls back to Circle if the icon
 * is not found in the registry.
 * 
 * @param name - Icon name in any supported casing (autocomplete shows PascalCase options)
 * @returns The resolved LucideIcon component
 * 
 * @example
 * const Icon = resolveIcon("arrow-right");  // ArrowRight component
 * const Icon = resolveIcon("TrendingUp");   // TrendingUp component
 * const Icon = resolveIcon("unknown");      // Circle (fallback)
 */
export function resolveIcon(name: IconName | (string & {})): LucideIcon {
  const pascalName = toPascalCase(name);
  
  if (isIconName(pascalName)) {
    return iconRegistry[pascalName];
  }
  
  return FallbackIcon;
}

/**
 * Get all registered icon names.
 * 
 * Useful for building icon pickers or documentation.
 */
export function getIconNames(): IconName[] {
  return Object.keys(iconRegistry) as IconName[];
}
