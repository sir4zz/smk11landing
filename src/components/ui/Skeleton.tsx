import type { HTMLAttributes } from 'react';

type SkeletonProps = HTMLAttributes<HTMLDivElement> & { rounded?: string };

/** Lightweight, CSS-only placeholder used for async content. */
export function Skeleton({ className = '', rounded = 'rounded-lg', ...props }: SkeletonProps) {
  return <div aria-hidden="true" className={`skeleton-shimmer ${rounded} ${className}`} {...props} />;
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return <div className={`space-y-3 ${className}`} aria-label="Memuat konten">
    {Array.from({ length: lines }, (_, index) => <Skeleton key={index} className={`h-4 ${index === lines - 1 ? 'w-2/3' : 'w-full'}`} />)}
  </div>;
}

export function SkeletonCard({ image = true }: { image?: boolean }) {
  return <div className="overflow-hidden rounded-2xl border border-[#1B2A4A]/10 bg-white shadow-sm">
    {image && <Skeleton className="aspect-[16/10] w-full" rounded="rounded-none" />}
    <div className="space-y-3 p-5"><Skeleton className="h-3 w-1/3" /><Skeleton className="h-5 w-5/6" /><SkeletonText lines={2} /></div>
  </div>;
}

export function SkeletonList({ count = 6, className = '' }: { count?: number; className?: string }) {
  return <div className={className}>{Array.from({ length: count }, (_, index) => <SkeletonCard key={index} />)}</div>;
}

export function SkeletonProfile({ count = 6 }: { count?: number }) {
  return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: count }, (_, index) =>
    <div key={index} className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm"><Skeleton className="h-16 w-16 shrink-0" rounded="rounded-full" /><div className="min-w-0 flex-1 space-y-3"><Skeleton className="h-4 w-4/5" /><Skeleton className="h-3 w-3/5" /></div></div>
  )}</div>;
}

export function SkeletonDetail() {
  return <div className="mx-auto max-w-4xl space-y-8 px-4 py-12"><Skeleton className="h-8 w-4/5" /><Skeleton className="h-4 w-2/5" /><Skeleton className="aspect-[16/8] w-full" /><SkeletonText lines={7} /></div>;
}

export function SkeletonPage() {
  return <main className="min-h-screen bg-[#FAF6F0]" aria-busy="true" aria-label="Memuat halaman">
    <Skeleton className="h-64 w-full" rounded="rounded-none" />
    <section className="mx-auto max-w-7xl space-y-8 px-4 py-12 sm:px-6 lg:px-8"><Skeleton className="h-8 w-64" /><div className="grid gap-6 md:grid-cols-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div></section>
  </main>;
}
