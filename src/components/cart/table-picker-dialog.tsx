"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { XIcon } from "lucide-react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type TablePickerDialogProps = {
  tables: { label: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TablePickerDialog({ tables, open, onOpenChange }: TablePickerDialogProps) {
  const router = useRouter();

  const handleSelect = useCallback(
    (label: string) => {
      onOpenChange(false);
      router.replace(`/cart?table=${encodeURIComponent(label)}`);
    },
    [router, onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-xs gap-5 p-6 sm:p-6"
      >
        <DialogClose asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="absolute right-4 top-4 rounded-full"
          >
            <XIcon className="size-3.5" />
            <span className="sr-only">Tutup</span>
          </Button>
        </DialogClose>

        <div className="flex items-start gap-3">
          <div className="flex flex-col gap-0.5">
            <DialogTitle className="font-display text-[15px] font-semibold">
              Pilih meja
            </DialogTitle>
            <DialogDescription className="text-[11px] text-muted-foreground">
              Pilih nomor meja untuk melanjutkan ke checkout.
            </DialogDescription>
          </div>
        </div>

        {tables.length === 0 ? (
          <p className="text-center text-[11px] text-muted-foreground py-4">
            Belum ada meja tersedia. Hubungi staf.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2.5">
            {tables.map((table) => (
              <button
                key={table.label}
                type="button"
                onClick={() => handleSelect(table.label)}
                className="flex items-center justify-center rounded-lg border border-border bg-card px-1 py-3 text-[10px] font-base tabular-nums text-foreground shadow-subtle transition-all hover:-translate-y-0.5 hover:border-brand-teal hover:bg-brand-teal/5 hover:shadow-md active:translate-y-0"
              >
                {table.label}
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
