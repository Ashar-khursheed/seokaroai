import {
  Activity, ArrowRight, ArrowUpRight, BarChart3, Bell, Bot, BrainCircuit, Building2, ChartColumn, Check, CircleAlert, CircleCheck, Clock,
  Code2, CreditCard, Download, ExternalLink, FileChartColumn, FileText, Flame, Folder, FolderGit2, Gauge, GitBranch, GitPullRequest, Globe,
  Inbox, KeyRound, Layers, LayoutDashboard, Lightbulb, Link2, ListChecks, Lock, LogOut, Mail, Map, Menu, Network, Newspaper, Plug, Plus, Printer,
  RefreshCw, Rocket, ScanSearch, SearchCheck, Server, Settings, Shield, ShieldCheck, ShoppingBag, SlidersHorizontal, Sparkles, Swords, Target,
  Terminal, Trash2, TrendingUp, TriangleAlert, Undo2, Users, WandSparkles, Workflow, X, Zap, type LucideIcon,
} from "lucide-react";

export const ICONS: Record<string, LucideIcon> = {
  Activity, ArrowRight, ArrowUpRight, BarChart3, Bell, Bot, BrainCircuit, Building2, ChartColumn, Check, CircleAlert, CircleCheck, Clock,
  Code2, CreditCard, Download, ExternalLink, FileChartColumn, FileText, Flame, Folder, FolderGit2, Gauge, GitBranch, GitPullRequest, Globe,
  Inbox, KeyRound, Layers, LayoutDashboard, Lightbulb, Link2, ListChecks, Lock, LogOut, Mail, Map, Menu, Network, Newspaper, Plug, Plus, Printer,
  RefreshCw, Rocket, ScanSearch, SearchCheck, Server, Settings, Shield, ShieldCheck, ShoppingBag, SlidersHorizontal, Sparkles, Swords, Target,
  Terminal, Trash2, TrendingUp, TriangleAlert, Undo2, Users, WandSparkles, Workflow, X, Zap,
};

export function Icon({ name, size = 18, className = "", strokeWidth = 1.75 }: { name: string; size?: number; className?: string; strokeWidth?: number }) {
  const C = ICONS[name] ?? Sparkles;
  return <C size={size} className={className} strokeWidth={strokeWidth} aria-hidden />;
}

/** Icon inside a soft square, used for feature and section headers. */
export function IconTile({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border line bg-[var(--panel2)] text-brand-500 ${className}`}>
      <Icon name={name} size={19} />
    </span>
  );
}

export {
  ArrowRight, ArrowUpRight, Check, X, Plus, Menu, LogOut, ExternalLink, Download, Printer, RefreshCw, Trash2, Undo2,
  GitPullRequest, CircleCheck, CircleAlert, TriangleAlert, Sparkles,
};
