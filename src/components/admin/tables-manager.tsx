"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  createTable,
  updateTable,
  deleteTable,
  toggleTableActive,
} from "@/lib/tables/actions";

type AdminTable = {
  id: string;
  label: string;
  is_active: boolean;
};

type TablesManagerProps = {
  tables: AdminTable[];
};

export function TablesManager({ tables }: TablesManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Total {tables.length} meja.
        </p>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button type="button" size="cta" variant="primary">
              Tambah meja
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md p-5 sm:p-7 gap-5 sm:gap-7">
            <DialogHeader>
              <DialogTitle>Tambah meja baru</DialogTitle>
            </DialogHeader>
            <TableForm onSaved={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {tables.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-7 text-center text-sm text-muted-foreground">
          Belum ada meja. Klik &quot;Tambah meja&quot; untuk mulai.
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tables.map((table) => (
            <li key={table.id}>
              <TableRow table={table} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TableForm({
  defaults,
  onSaved,
}: {
  defaults?: { id: string; label: string; is_active: boolean };
  onSaved: () => void;
}) {
  const [label, setLabel] = useState(defaults?.label ?? "");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;

    const formData = new FormData();
    formData.set("label", label.trim());
    formData.set("is_active", defaults ? String(defaults.is_active) : "true");

    startTransition(async () => {
      const action = defaults
        ? updateTable.bind(null, defaults.id)
        : createTable;
      const result = await action({ ok: true }, formData);
      if (result.ok) {
        toast.success(result.message ?? "Berhasil");
        onSaved();
      } else {
        toast.error(result.message ?? "Gagal");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="label" className="text-sm font-medium text-foreground">
          Label meja
        </label>
        <Input
          id="label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Contoh: M01, VIP01, Outdoor 1"
          maxLength={20}
          autoFocus
        />
        <span className="text-xs text-muted-foreground">
          Maksimal 20 karakter.
        </span>
      </div>
      <div className="flex justify-end gap-3">
        <Button type="submit" size="cta" variant="primary" disabled={isPending || !label.trim()}>
          {isPending ? "Menyimpan..." : defaults ? "Simpan" : "Tambah"}
        </Button>
      </div>
    </form>
  );
}

function TableRow({ table }: { table: AdminTable }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isActive, setIsActive] = useState(table.is_active);
  const [isToggling, startToggle] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  function handleToggle(next: boolean) {
    setIsActive(next);
    startToggle(async () => {
      const result = await toggleTableActive(table.id, next);
      if (!result.ok) {
        setIsActive(!next);
        toast.error(result.message ?? "Gagal mengubah status");
      }
    });
  }

  function handleDelete() {
    return new Promise<void>((resolve) => {
      startDelete(async () => {
        const result = await deleteTable(table.id);
        if (result.ok) toast.success(result.message ?? "Meja dihapus");
        else toast.error(result.message ?? "Gagal menghapus");
        resolve();
      });
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cream-paper font-display text-sm font-semibold tabular-nums text-foreground">
          {table.label}
        </div>
        <Switch
          checked={isActive}
          onCheckedChange={handleToggle}
          disabled={isToggling}
          aria-label={isActive ? "Nonaktifkan meja" : "Aktifkan meja"}
        />
      </div>

      <div className="flex items-center gap-2">
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="rounded-lg flex-1">
              Edit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md p-5 sm:p-7 gap-5 sm:gap-7">
            <DialogHeader>
              <DialogTitle>Edit meja</DialogTitle>
            </DialogHeader>
            <TableForm
              defaults={{ id: table.id, label: table.label, is_active: table.is_active }}
              onSaved={() => setIsEditOpen(false)}
            />
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          trigger={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-lg flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={isDeleting}
            >
              {isDeleting ? "..." : "Hapus"}
            </Button>
          }
          title={`Hapus meja "${table.label}"?`}
          description="Meja yang dihapus tidak bisa dikembalikan."
          confirmLabel="Hapus meja"
          tone="destructive"
          onConfirm={handleDelete}
        />
      </div>
    </div>
  );
}
