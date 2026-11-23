'use client';
import { useState, type SyntheticEvent } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop, type PercentCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { loadImage } from '@/lib/files';
import { useEditorStore } from '@/store/editor-store';
import type { ImageAnnotation } from '@/types/editor';

const ASPECTS = [
  { value: 'free', label: 'Libre', aspect: undefined },
  { value: '1:1', label: '1:1', aspect: 1 },
  { value: '4:3', label: '4:3', aspect: 4 / 3 },
  { value: '16:9', label: '16:9', aspect: 16 / 9 },
] as const;
type AspectValue = (typeof ASPECTS)[number]['value'];

const FULL: PercentCrop = { unit: '%', x: 0, y: 0, width: 100, height: 100 };

export default function CropDialog() {
  const image = useEditorStore((s) =>
    s.annotations.find((a) => a.id === s.croppingId && a.type === 'image')
  ) as ImageAnnotation | undefined;
  const setCropping = useEditorStore((s) => s.setCropping);

  return (
    <Dialog open={!!image} onOpenChange={(open) => !open && setCropping(null)}>
      {image && <CropContent key={image.id} image={image} onClose={() => setCropping(null)} />}
    </Dialog>
  );
}

function CropContent({ image, onClose }: { image: ImageAnnotation; onClose: () => void }) {
  const [crop, setCrop] = useState<PercentCrop>(
    image.crop ? { unit: '%', ...image.crop } : FULL
  );
  const [aspect, setAspect] = useState<AspectValue>('free');
  const [box, setBox] = useState<{ w: number; h: number } | null>(null); // displayed image size

  const onImageLoad = (e: SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setBox({ w: width, h: height });
  };

  const changeAspect = (value: AspectValue) => {
    setAspect(value);
    const ratio = ASPECTS.find((a) => a.value === value)?.aspect;
    if (!ratio || !box) return;
    setCrop(centerCrop(makeAspectCrop({ unit: '%', width: 90 }, ratio, box.w, box.h), box.w, box.h));
  };

  const apply = async () => {
    const { updateAnnotation, annotations } = useEditorStore.getState();
    const current = annotations.find((a) => a.id === image.id) as ImageAnnotation | undefined;
    if (!current) return onClose();

    const img = await loadImage(current.originalSrc);
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    const isFull = crop.width >= 99.9 && crop.height >= 99.9;
    if (isFull || crop.width <= 0 || crop.height <= 0) {
      updateAnnotation(image.id, {
        src: current.originalSrc,
        crop: undefined,
        height: current.width * (nh / nw),
      });
      return onClose();
    }

    // % → natural pixels of the original image
    const sx = Math.round((crop.x / 100) * nw);
    const sy = Math.round((crop.y / 100) * nh);
    const sw = Math.max(1, Math.round((crop.width / 100) * nw));
    const sh = Math.max(1, Math.round((crop.height / 100) * nh));
    const canvas = document.createElement('canvas');
    canvas.width = sw;
    canvas.height = sh;
    canvas.getContext('2d')!.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

    updateAnnotation(image.id, {
      src: canvas.toDataURL(current.mime, 0.92),
      crop: { x: crop.x, y: crop.y, width: crop.width, height: crop.height },
      height: current.width * (sh / sw),
    });
    onClose();
  };

  const reset = async () => {
    const { updateAnnotation, annotations } = useEditorStore.getState();
    const current = annotations.find((a) => a.id === image.id) as ImageAnnotation | undefined;
    if (!current) return onClose();
    const img = await loadImage(current.originalSrc);
    updateAnnotation(image.id, {
      src: current.originalSrc,
      crop: undefined,
      height: current.width * (img.naturalHeight / img.naturalWidth),
    });
    onClose();
  };

  const ratio = ASPECTS.find((a) => a.value === aspect)?.aspect;

  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle className="font-display text-xl">Recortar imagen</DialogTitle>
        <DialogDescription>Arrastra el recuadro o sus esquinas para elegir la zona.</DialogDescription>
      </DialogHeader>

      <ToggleGroup
        size="sm"
        variant="outline"
        value={[aspect]}
        onValueChange={(v) => v[0] && changeAspect(v[0] as AspectValue)}
        aria-label="Proporción"
        className="justify-center"
      >
        {ASPECTS.map((a) => (
          <ToggleGroupItem key={a.value} value={a.value} className="px-3">
            {a.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <div className="flex max-h-[60vh] justify-center overflow-hidden rounded-xl bg-muted p-3">
        <ReactCrop
          crop={crop}
          onChange={(_px, percent) => setCrop(percent)}
          aspect={ratio}
          keepSelection
          ruleOfThirds
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- dataURL in the crop tool */}
          <img
            src={image.originalSrc}
            alt="Imagen a recortar"
            onLoad={onImageLoad}
            className="max-h-[calc(60vh-1.5rem)] w-auto"
          />
        </ReactCrop>
      </div>

      <DialogFooter className="sm:justify-between">
        <Button variant="ghost" onClick={reset}>
          <RotateCcw />
          Restablecer
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={apply} className="font-bold">
            Aplicar
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}
