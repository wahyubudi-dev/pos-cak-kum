"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";

import {
  type CategoryActionState,
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/lib/categories/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const INITIAL_STATE: CategoryActionState = { ok: true };

type Category = {
  id: string;
  name: string;
  sort_order: number;
};

type CategoriesManagerProps = {
  categories: Category[];
};

export function CategoriesManager({ categories }: CategoriesManagerProps) {
  return (
    <div className="flex flex-col gap-7">
      <CreateCategoryForm />
      <CategoryList categories={categories} />
    </div>
  );
}

function CreateCategoryForm() {
  const [state, formAction, isPending] = useActionState(
    createCategory,
    INITIAL_STATE,
  );

  // Surface success / error toasts when the action settles.
  if (state.message) {
    if (state.ok) toast.success(state.message);
    else toast.error(state.message);
    state.message = undefined;
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6"
    >
      <h2 className="font-display text-lg font-semibold">Tambah kategori</h2>
      <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Nama</Label>
          <Input id="name" name="name" placeholder="Misal: Mie" required />
          {state.fieldErrors?.name ? (
            <p className="text-xs text-destructive">{state.fieldErrors.name}</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sort_order">Urutan</Label>
          <Input
            id="sort_order"
            name="sort_order"
            type="number"
            min={0}
            defaultValue={0}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          type="submit"
          size="cta"
          variant="primary"
          disabled={isPending}
        >
          {isPending ? "Menyimpan..." : "Tambah"}
        </Button>
      </div>
    </form>
  );
}

function CategoryList({ categories }: { categories: Category[] }) {
  if (categories.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-card p-7 text-center text-sm text-muted-foreground">
        Belum ada kategori. Tambahkan satu di atas.
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {categories.map((category) => (
        <li key={category.id}>
          <CategoryRow category={category} />
        </li>
      ))}
    </ul>
  );
}

function CategoryRow({ category }: { category: Category }) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <EditCategoryForm
        category={category}
        onCancel={() => setIsEditing(false)}
        onSaved={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-3">
      <div className="flex flex-col">
        <span className="font-medium text-foreground">{category.name}</span>
        <span className="text-xs text-muted-foreground">
          Urutan: {category.sort_order}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-lg"
          onClick={() => setIsEditing(true)}
        >
          Edit
        </Button>
        <DeleteCategoryButton id={category.id} name={category.name} />
      </div>
    </div>
  );
}

function EditCategoryForm({
  category,
  onCancel,
  onSaved,
}: {
  category: Category;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    updateCategory.bind(null, category.id),
    INITIAL_STATE,
  );

  if (state.message) {
    if (state.ok) {
      toast.success(state.message);
      state.message = undefined;
      onSaved();
    } else {
      toast.error(state.message);
      state.message = undefined;
    }
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-card px-5 py-4"
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
        <Input name="name" defaultValue={category.name} required />
        <Input
          name="sort_order"
          type="number"
          min={0}
          defaultValue={category.sort_order}
        />
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-lg"
          onClick={onCancel}
        >
          Batal
        </Button>
        <Button
          type="submit"
          size="sm"
          disabled={isPending}
          className="rounded-lg bg-brand-teal text-white hover:bg-brand-teal/90"
        >
          {isPending ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </form>
  );
}

function DeleteCategoryButton({ id, name }: { id: string; name: string }) {
  async function handleDelete() {
    const result = await deleteCategory(id);
    if (result.ok) toast.success(result.message ?? "Kategori dihapus");
    else toast.error(result.message ?? "Gagal menghapus");
  }

  return (
    <ConfirmDialog
      trigger={
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          Hapus
        </Button>
      }
      title={`Hapus kategori "${name}"?`}
      description="Kategori yang dihapus tidak bisa dikembalikan. Pastikan tidak ada menu yang masih dikelompokkan di sini."
      confirmLabel="Hapus kategori"
      tone="destructive"
      onConfirm={handleDelete}
    />
  );
}
