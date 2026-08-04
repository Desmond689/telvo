import type { ReactNode } from 'react';

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="container-page py-16 max-w-3xl">
      <h1 className="text-3xl font-extrabold text-ink-900">{title}</h1>
      <p className="text-sm text-ink-400 mt-2">Last updated: {updated}</p>
      <div className="prose prose-sm mt-8 space-y-5 text-ink-600 leading-relaxed [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ink-900 [&_h2]:mt-8 [&_h2]:mb-2">
        {children}
      </div>
    </div>
  );
}
