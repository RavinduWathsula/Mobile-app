import { Card, CardContent, CardHeader } from "../ui/card";

interface PageSkeletonProps {
  variant?: "table" | "grid" | "gantt" | "form";
  rows?: number;
  columns?: number;
}

function Pulse({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} style={style} />;
}

export function StatCardSkeleton() {
  return (
    <Card className="dark:bg-gray-900 dark:border-gray-800">
      <CardHeader className="pb-2">
        <Pulse className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Pulse className="h-8 w-16 mb-2" />
        <Pulse className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4 pb-3 border-b border-gray-200 dark:border-gray-700">
        {Array.from({ length: columns }).map((_, i) => (
          <Pulse key={i} className={`h-4 ${i === 0 ? "w-32" : "flex-1"}`} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 py-2">
          {Array.from({ length: columns }).map((_, c) => (
            <Pulse key={c} className={`h-4 ${c === 0 ? "w-32" : "flex-1"}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function GridSkeleton({ items = 8 }: { items?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: items }).map((_, i) => (
        <Card key={i} className="dark:bg-gray-900 dark:border-gray-800">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <Pulse className="h-6 w-16" />
                <Pulse className="h-3 w-24" />
              </div>
              <Pulse className="h-5 w-14 rounded-full" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Pulse className="h-4 w-full" />
              <Pulse className="h-4 w-3/4" />
              <Pulse className="h-9 w-full mt-4 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function GanttSkeleton() {
  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex">
        <Pulse className="h-8 w-24 mr-2" />
        <div className="flex-1 flex gap-1">
          {Array.from({ length: 14 }).map((_, i) => (
            <Pulse key={i} className="h-8 flex-1" />
          ))}
        </div>
      </div>
      {/* Rows */}
      {Array.from({ length: 8 }).map((_, r) => (
        <div key={r} className="flex">
          <Pulse className="h-10 w-24 mr-2" />
          <div className="flex-1 relative">
            <Pulse
              className="h-8 absolute top-1"
              style={{
                left: `${Math.random() * 40}%`,
                width: `${20 + Math.random() * 30}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton({ variant = "table", rows, columns }: PageSkeletonProps) {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <Pulse className="h-8 w-48 mb-2" />
        <Pulse className="h-4 w-64" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Content */}
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardContent className="pt-6">
          {variant === "table" && <TableSkeleton rows={rows} columns={columns} />}
          {variant === "grid" && <GridSkeleton />}
          {variant === "gantt" && <GanttSkeleton />}
          {variant === "form" && (
            <div className="space-y-4 max-w-xl">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Pulse className="h-4 w-24" />
                  <Pulse className="h-10 w-full rounded-lg" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
