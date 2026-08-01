import type { ReactNode } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Plus, Search, FileText, Calendar, Users, ChefHat, ClipboardList, BedDouble } from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

const defaultIcon = <FileText className="w-12 h-12" />;

export function EmptyState({
  icon = defaultIcon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
          {icon}
        </div>
        <h3 className="mb-2 text-xl font-semibold text-foreground">{title}</h3>
        <p className="mb-6 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
        <div className="flex items-center gap-3">
          {actionLabel && onAction && (
            <Button onClick={onAction}>
              <Plus className="w-4 h-4 mr-2" />
              {actionLabel}
            </Button>
          )}
          {secondaryLabel && onSecondary && (
            <Button variant="outline" onClick={onSecondary}>
              {secondaryLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Pre-configured empty states for common pages ──

export function NoBookings({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={<Calendar className="w-12 h-12" />}
      title="No bookings found"
      description="Start by creating your first reservation. Bookings will appear here once guests make reservations."
      actionLabel="Create Booking"
      onAction={onAction}
    />
  );
}

export function NoGuests({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={<Users className="w-12 h-12" />}
      title="No guest history"
      description="Guest profiles will be created automatically when bookings are made. Check back after your first reservation."
      actionLabel="New Reservation"
      onAction={onAction}
    />
  );
}

export function NoOrders() {
  return (
    <EmptyState
      icon={<ChefHat className="w-12 h-12" />}
      title="No active orders"
      description="Orders will appear here when placed through the POS or room service. The kitchen is ready!"
    />
  );
}

export function NoTasks({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={<ClipboardList className="w-12 h-12" />}
      title="All tasks completed"
      description="No pending housekeeping tasks. All rooms are in order! Create a new task if needed."
      actionLabel="Create Task"
      onAction={onAction}
    />
  );
}

export function NoRooms({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={<BedDouble className="w-12 h-12" />}
      title="No rooms configured"
      description="Set up your room inventory to start accepting bookings. Add room types first, then individual rooms."
      actionLabel="Add Room Type"
      onAction={onAction}
    />
  );
}

export function NoResults() {
  return (
    <EmptyState
      icon={<Search className="w-12 h-12" />}
      title="No results found"
      description="Try adjusting your search or filter criteria. Clear all filters to see everything."
    />
  );
}

