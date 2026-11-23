'use client';
import { memo, useState } from 'react';
import { Rnd } from 'react-rnd';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/store/editor-store';
import type { ImageAnnotation as ImageAnnotationType } from '@/types/editor';

const MIN_SIDE = 12; // PDF points

const handle = (
  <span className="absolute top-1/2 left-1/2 block size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-card shadow-sm" />
);
const HANDLES = {
  top: handle,
  right: handle,
  bottom: handle,
  left: handle,
  topRight: handle,
  bottomRight: handle,
  bottomLeft: handle,
  topLeft: handle,
};

interface Props {
  a: ImageAnnotationType;
  zoom: number;
}

function ImageAnnotation({ a, zoom }: Props) {
  const selected = useEditorStore((s) => s.selectedId === a.id);
  const { select, updateAnnotation, setCropping } = useEditorStore.getState();
  // Shift held when the resize starts → free proportions for that gesture
  const [freeAspect, setFreeAspect] = useState(false);

  return (
    <Rnd
      bounds="parent"
      position={{ x: a.x * zoom, y: a.y * zoom }}
      size={{ width: a.width * zoom, height: a.height * zoom }}
      minWidth={MIN_SIDE * zoom}
      minHeight={MIN_SIDE * zoom}
      lockAspectRatio={!freeAspect}
      enableResizing={selected}
      resizeHandleComponent={HANDLES}
      className={cn(
        'cursor-move outline-2 outline-offset-2 outline-transparent',
        selected ? 'outline-dashed outline-primary' : 'hover:outline-dashed hover:outline-primary/40'
      )}
      onMouseDown={(e: MouseEvent) => {
        e.stopPropagation();
        if (!selected) select(a.id);
      }}
      onDragStop={(_e, d) => {
        const x = d.x / zoom;
        const y = d.y / zoom;
        if (Math.abs(x - a.x) > 0.01 || Math.abs(y - a.y) > 0.01) updateAnnotation(a.id, { x, y });
      }}
      onResizeStart={(e) => setFreeAspect(e.shiftKey)}
      onResizeStop={(_e, _dir, ref, _delta, pos) => {
        setFreeAspect(false);
        updateAnnotation(a.id, {
          x: pos.x / zoom,
          y: pos.y / zoom,
          width: ref.offsetWidth / zoom,
          height: ref.offsetHeight / zoom,
        });
      }}
    >
      <div
        className="h-full w-full"
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={(e) => {
          e.stopPropagation();
          select(a.id);
          setCropping(a.id);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- dataURL drawn at an exact size */}
        <img
          src={a.src}
          alt=""
          draggable={false}
          className="pointer-events-none block h-full w-full select-none"
        />
      </div>
    </Rnd>
  );
}

export default memo(ImageAnnotation);
