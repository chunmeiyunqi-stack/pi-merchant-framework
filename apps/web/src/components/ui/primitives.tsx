import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';

// ── Card ──
export function Card({
  children,
  className,
  hover = false,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-card border border-brand-border bg-brand-dark-surface p-6 shadow-card',
        hover && 'hover:border-white/15 hover:shadow-glow-gold transition-all duration-300',
        className
      )}
    >
      {children}
    </div>
  );
}

// ── StatCard ──
export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  action,
  variant = 'purple',
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  action?: { label: string; href: string };
  variant?: 'purple' | 'blue' | 'gold';
}) {
  const colors = {
    purple: { bg: 'bg-brand-purple-muted', text: 'text-brand-purple', glow: 'shadow-glow-purple' },
    blue:   { bg: 'bg-blue-500/10',       text: 'text-blue-400',    glow: '' },
    gold:   { bg: 'bg-brand-gold-muted',   text: 'text-brand-gold',  glow: 'shadow-glow-gold' },
  };
  const c = colors[variant];

  return (
    <Card hover className="relative overflow-hidden group">
      <div className={cn('absolute right-0 top-0 w-16 h-16 rounded-bl-full flex items-start justify-end p-3', c.bg)}>
        <Icon className={cn('w-5 h-5', c.text)} />
      </div>
      <h3 className="text-sm font-semibold text-gray-400 mb-3">{label}</h3>
      <p className="text-2xl font-black text-white mb-1">
        {value}
        {sub && <span className="text-sm font-medium text-gray-500 ml-1">{sub}</span>}
      </p>
      {action && (
        <a href={action.href} className="text-sm font-semibold text-brand-purple hover:text-brand-purple-hover transition-colors">
          {action.label} →
        </a>
      )}
    </Card>
  );
}

// ── PageHeader ──
export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div className="animate-slide-up">
        <h1 className="text-2xl md:text-3xl font-black text-white">{title}</h1>
        {description && <p className="text-gray-400 mt-1 text-sm">{description}</p>}
      </div>
      {children && <div className="animate-slide-up">{children}</div>}
    </div>
  );
}

// ── Badge ──
export function Badge({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'gold' | 'purple';
}) {
  const variants = {
    default: 'bg-white/5 border-white/10 text-gray-300',
    gold:    'bg-brand-gold-muted border-brand-gold/30 text-brand-gold',
    purple:  'bg-brand-purple-muted border-brand-purple/30 text-brand-purple',
  };
  return (
    <span className={cn('inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold', variants[variant])}>
      {children}
    </span>
  );
}

// ── EmptyState ──
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-brand-dark-elevated border border-brand-border flex items-center justify-center mb-6">
        <Icon className="w-8 h-8 text-gray-500" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
      <p className="text-gray-400 max-w-md mb-6">{description}</p>
      {action && (
        <a
          href={action.href}
          className="bg-brand-gold hover:bg-brand-gold-hover text-brand-dark px-6 py-3 rounded-btn font-bold transition-colors"
        >
          {action.label}
        </a>
      )}
    </div>
  );
}