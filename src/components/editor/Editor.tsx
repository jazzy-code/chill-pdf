'use client';
import PagesSidebar from '@/components/editor/PagesSidebar';
import PropertiesBar from '@/components/editor/PropertiesBar';
import Toolbar from '@/components/editor/Toolbar';
import Viewer from '@/components/editor/Viewer';

export default function Editor() {
  return (
    <div className="flex h-dvh flex-col">
      <Toolbar />
      <PropertiesBar />
      <div className="flex min-h-0 flex-1">
        <PagesSidebar />
        <Viewer />
      </div>
    </div>
  );
}
