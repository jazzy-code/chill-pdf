'use client';
import { useEffect, useState } from 'react';
import { History, Play, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clearSession, loadSession, type SavedSession } from '@/lib/session';
import { useEditorStore } from '@/store/editor-store';

const timeAgo = (ms: number) => {
  const min = Math.round((Date.now() - ms) / 60000);
  if (min < 1) return 'hace un momento';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'ayer' : `hace ${d} días`;
};

/** Offers to resume the document saved in this browser (if any). */
export default function ResumeCard() {
  const [session, setSession] = useState<SavedSession | null>(null);
  const restoreSession = useEditorStore((s) => s.restoreSession);

  useEffect(() => {
    let alive = true;
    loadSession().then((s) => alive && setSession(s));
    return () => {
      alive = false;
    };
  }, []);

  if (!session) return null;

  const pages = session.pages.length;
  const edits = session.annotations.length;
  return (
    <div className="mt-8 flex flex-col items-center gap-4 rounded-3xl bg-card p-5 text-left shadow-md ring-1 ring-border animate-in fade-in slide-in-from-bottom-2 duration-200 sm:flex-row">
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
        <History className="size-6" />
      </span>
      <div className="min-w-0 flex-1 text-center sm:text-left">
        <p className="truncate font-display text-lg font-semibold">
          Continuar editando «{session.fileName}.pdf»
        </p>
        <p className="text-sm text-muted-foreground">
          {pages} {pages === 1 ? 'página' : 'páginas'}
          {edits > 0 && ` · ${edits} ${edits === 1 ? 'elemento añadido' : 'elementos añadidos'}`} ·{' '}
          {timeAgo(session.savedAt)}
        </p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          className="rounded-full"
          onClick={() => {
            clearSession();
            setSession(null);
          }}
        >
          <X />
          Empezar de nuevo
        </Button>
        <Button className="rounded-full font-bold" onClick={() => restoreSession(session)}>
          <Play />
          Continuar
        </Button>
      </div>
    </div>
  );
}
