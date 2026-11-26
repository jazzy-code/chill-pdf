'use client';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import Dropzone from '@/components/landing/Dropzone';
import LandingInfo from '@/components/landing/LandingInfo';
import { useEditorStore } from '@/store/editor-store';

const Editor = dynamic(() => import('@/components/editor/Editor'), {
  ssr: false,
  loading: () => (
    <div className="flex h-dvh items-center justify-center text-primary">
      <Loader2 className="size-8 animate-spin" />
    </div>
  ),
});

export default function Home() {
  const hasDocument = useEditorStore((s) => s.pages.length > 0);
  return hasDocument ? (
    <Editor />
  ) : (
    <>
      <Dropzone />
      <LandingInfo />
    </>
  );
}
