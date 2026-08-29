export default function InternshipCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-paper-raised p-5">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-lg bg-border" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-border" />
          <div className="h-3 w-1/2 rounded bg-border" />
        </div>
      </div>
      <div className="mt-3 flex gap-1.5">
        <div className="h-5 w-16 rounded-full bg-border" />
        <div className="h-5 w-20 rounded-full bg-border" />
      </div>
      <div className="mt-3 h-4 w-2/3 rounded bg-border" />
      <div className="mt-3 flex gap-1.5">
        <div className="h-5 w-14 rounded-full bg-border" />
        <div className="h-5 w-14 rounded-full bg-border" />
        <div className="h-5 w-14 rounded-full bg-border" />
      </div>
      <div className="mt-4 h-8 border-t border-border pt-3">
        <div className="h-3 w-24 rounded bg-border" />
      </div>
    </div>
  );
}
