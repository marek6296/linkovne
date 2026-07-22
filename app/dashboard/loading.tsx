/**
 * Skeleton OBSAHU dashboardu — ukaze sa pocas nacitavania podstranky. Header a
 * menu su v zdielanom layoute (persistuju), takze sem patri len obsahova cast.
 */
function Bar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-line ${className}`} />;
}

export default function DashboardLoading() {
  return (
    <div>
      <Bar className="h-8 w-48" />
      <Bar className="mt-3 h-4 w-64" />

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card p-6">
            <Bar className="h-3 w-20" />
            <Bar className="mt-3 h-9 w-24" />
          </div>
        ))}
      </div>

      <div className="card mt-4 p-6">
        <Bar className="h-4 w-24" />
        <Bar className="mt-6 h-44 w-full" />
      </div>
    </div>
  );
}
