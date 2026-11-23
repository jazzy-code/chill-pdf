'use client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useEditorStore } from '@/store/editor-store';

/** Confirms closing the current document to start over with a new one. */
export default function NewDocumentDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const fileName = useEditorStore((s) => s.fileName);
  const reset = useEditorStore((s) => s.reset);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-xl">¿Empezar con otro documento?</DialogTitle>
          <DialogDescription>
            Se cerrará «{fileName}.pdf» y perderás los cambios que no hayas descargado.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Seguir editando
          </Button>
          <Button
            className="bg-destructive font-bold text-primary-foreground hover:bg-destructive/90"
            onClick={() => {
              onOpenChange(false);
              reset();
            }}
          >
            Cerrar y empezar de nuevo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
