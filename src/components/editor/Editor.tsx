'use client';
import FileDropZone from '@/components/editor/FileDropZone';
import PagesSidebar from '@/components/editor/PagesSidebar';
import PropertiesBar from '@/components/editor/PropertiesBar';
import Toolbar from '@/components/editor/Toolbar';
import Viewer from '@/components/editor/Viewer';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export default function Editor() {
  useKeyboardShortcuts();
  return (
    <div className="flex h-dvh flex-col">
      <Toolbar />
      <PropertiesBar />
      <FileDropZone>
        <PagesSidebar />
        <Viewer />
      </FileDropZone>
    </div>
  );
}
