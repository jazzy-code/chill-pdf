'use client';
import CropDialog from '@/components/editor/CropDialog';
import FileDropZone from '@/components/editor/FileDropZone';
import PagesSidebar from '@/components/editor/PagesSidebar';
import PropertiesBar from '@/components/editor/PropertiesBar';
import Toolbar from '@/components/editor/Toolbar';
import Viewer from '@/components/editor/Viewer';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useSessionPersistence } from '@/hooks/useSessionPersistence';

export default function Editor() {
  useKeyboardShortcuts();
  useSessionPersistence();
  return (
    <div className="flex h-dvh flex-col">
      <Toolbar />
      <PropertiesBar />
      <FileDropZone>
        <PagesSidebar />
        <Viewer />
      </FileDropZone>
      <CropDialog />
    </div>
  );
}
