import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, usePaginatedQuery } from "@/aura/client";
import { api } from "@/aura/_generated/api";
import { Button } from "@/aura/ui/button";
import { Input } from "@/aura/ui/input";
import { Textarea } from "@/aura/ui/textarea";
import { Badge } from "@/aura/ui/badge";
import { NativeSelect } from "@/aura/ui/native-select";
import { AuraEmptyState } from "@/aura/ui/aura-empty-state";
import { AuraLoadingSkeleton } from "@/aura/ui/aura-loading-skeleton";
import { AuraGuard } from "@/aura/client/guard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/aura/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/analyser")({ component: TodoApp });

type Status = "PENDING" | "IN_PROGRESS" | "DONE";
type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

const PRIORITIES: { value: Priority; label: string; dot: string }[] = [
  { value: "URGENT", label: "Urgente", dot: "bg-red-500" },
  { value: "HIGH", label: "Haute", dot: "bg-orange-500" },
  { value: "MEDIUM", label: "Moyenne", dot: "bg-blue-500" },
  { value: "LOW", label: "Basse", dot: "bg-zinc-500" },
];

const STATUSES: { value: Status; label: string; tone: string }[] = [
  { value: "PENDING", label: "À faire", tone: "text-muted-foreground" },
  { value: "IN_PROGRESS", label: "En cours", tone: "text-blue-500" },
  { value: "DONE", label: "Terminée", tone: "text-emerald-500" },
];

const STATUS_FILTERS: { value: string; label: string; statuses: Status[] | undefined }[] = [
  { value: "all", label: "Toutes", statuses: undefined },
  { value: "active", label: "Actives", statuses: ["PENDING", "IN_PROGRESS"] },
  { value: "in_progress", label: "En cours", statuses: ["IN_PROGRESS"] },
  { value: "done", label: "Terminées", statuses: ["DONE"] },
];

const NEXT_STATUS: Record<Status, Status> = {
  PENDING: "IN_PROGRESS",
  IN_PROGRESS: "DONE",
  DONE: "PENDING",
};

function priorityMeta(value: Priority) {
  return PRIORITIES.find((p) => p.value === value) ?? PRIORITIES[2];
}

function statusMeta(value: Status) {
  return STATUSES.find((s) => s.value === value) ?? STATUSES[0];
}

function TodoApp() {
  return (
    <AuraGuard redirectTo="/login">
      <TodoContent />
    </AuraGuard>
  );
}

interface Todo {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  priority: Priority;
  dueDate: string | Date | null;
}

function TodoContent() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | Priority>("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Todo | null>(null);
  const [creating, setCreating] = useState(false);

  const currentStatusFilter =
    STATUS_FILTERS.find((f) => f.value === statusFilter) ?? STATUS_FILTERS[0];

  const { items, isLoading, isDone, isFetchingNextPage, loadMore } = usePaginatedQuery(
    api.todos.list,
    {
      ...(currentStatusFilter.statuses && { statuses: currentStatusFilter.statuses }),
      ...(priorityFilter !== "all" && { priority: priorityFilter }),
      ...(search ? { search } : {}),
    },
    { numItems: 20 },
  );

  const todos = items as Todo[];
  const update = useMutation(api.todos.update);
  const remove = useMutation(api.todos.delete);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Todo</h1>
        <Button onClick={() => setCreating(true)}>Nouvelle tâche</Button>
      </div>

      <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center">
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher..."
          className="flex-1"
        />
        <NativeSelect
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="sm:w-36"
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </NativeSelect>
        <NativeSelect
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as "all" | Priority)}
          className="sm:w-36"
        >
          <option value="all">Toutes priorités</option>
          {PRIORITIES.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </NativeSelect>
      </div>

      {isLoading ? (
        <AuraLoadingSkeleton lines={6} />
      ) : todos.length === 0 ? (
        <div className="mt-8">
          <AuraEmptyState
            title={search || statusFilter !== "all" || priorityFilter !== "all" ? "Aucun résultat" : "Bienvenue"}
            description={search ? "Essayez d'autres termes." : "Ajoutez votre première tâche."}
          />
        </div>
      ) : (
        <div className="divide-y divide-border">
          {todos.map((todo) => (
            <TodoRow
              key={todo.id}
              todo={todo}
              onCycleStatus={() => {
                update.mutate({ id: todo.id, status: NEXT_STATUS[todo.status] });
              }}
              onEdit={() => setEditing(todo)}
              onDelete={() => remove.mutate({ id: todo.id })}
              deleting={remove.isPending}
            />
          ))}
        </div>
      )}

      {!isLoading && todos.length > 0 && !isDone && (
        <div className="mt-6 flex justify-center">
          <Button variant="outline" onClick={loadMore} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? "Chargement..." : "Charger plus"}
          </Button>
        </div>
      )}

      <TodoDialog
        open={creating}
        onOpenChange={setCreating}
        mode="create"
      />
      <TodoDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        mode="edit"
        todo={editing}
      />
    </div>
  );
}

function TodoRow({
  todo,
  onCycleStatus,
  onEdit,
  onDelete,
  deleting,
}: {
  todo: Todo;
  onCycleStatus: () => void;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const isDone = todo.status === "DONE";
  const prio = priorityMeta(todo.priority);
  const status = statusMeta(todo.status);
  const dueDate = todo.dueDate ? new Date(todo.dueDate) : null;

  return (
    <div className={cn("flex items-start gap-3 py-3 group", isDone && "opacity-50")}>
      <button
        type="button"
        onClick={onCycleStatus}
        className={cn(
          "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-medium",
          todo.status === "PENDING" && "border-border text-muted-foreground",
          todo.status === "IN_PROGRESS" && "border-blue-500 text-blue-500",
          todo.status === "DONE" && "border-emerald-500 bg-emerald-500/15 text-emerald-500",
        )}
        title={`Statut : ${status.label} (cliquer pour changer)`}
      >
        {todo.status === "DONE" ? "✓" : todo.status === "IN_PROGRESS" ? "…" : ""}
      </button>

      <button
        type="button"
        onClick={onEdit}
        className="flex-1 min-w-0 text-left"
      >
        <div className="flex items-center gap-2">
          <span className={cn("text-sm", isDone && "line-through text-muted-foreground")}>
            {todo.title}
          </span>
          <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", prio.dot)} />
        </div>
        {todo.description && (
          <p className="text-muted-foreground text-xs mt-0.5 line-clamp-2">{todo.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className={cn("text-[10px]", status.tone)}>{status.label}</span>
          {dueDate && (
            <span className="text-muted-foreground text-[10px]">
              · {dueDate.toLocaleDateString()}
            </span>
          )}
        </div>
      </button>

      <Badge variant="outline" className="text-[10px] h-4 shrink-0 mt-0.5">
        {prio.label}
      </Badge>
      <button
        onClick={onDelete}
        disabled={deleting}
        className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 shrink-0 mt-1"
        aria-label="Supprimer"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 3h8M4.5 3V1.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5V3M5 5.5v3M7 5.5v3M2.5 3l.5 7a1 1 0 001 1h4a1 1 0 001-1l.5-7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

function toDateInputValue(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromDateInputValue(value: string): string | null {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

type TodoDialogProps =
  | { open: boolean; onOpenChange: (open: boolean) => void; mode: "create"; todo?: undefined }
  | { open: boolean; onOpenChange: (open: boolean) => void; mode: "edit"; todo: Todo | null };

function TodoDialog(props: TodoDialogProps) {
  const isEdit = props.mode === "edit";
  const todo = isEdit ? props.todo : null;

  const [title, setTitle] = useState(todo?.title ?? "");
  const [description, setDescription] = useState(todo?.description ?? "");
  const [priority, setPriority] = useState<Priority>(todo?.priority ?? "MEDIUM");
  const [status, setStatus] = useState<Status>(todo?.status ?? "PENDING");
  const [dueDate, setDueDate] = useState<string>(toDateInputValue(todo?.dueDate));

  const create = useMutation(api.todos.create, {
    onSuccess: () => props.onOpenChange(false),
  });
  const update = useMutation(api.todos.update, {
    onSuccess: () => props.onOpenChange(false),
  });

  function reset(next: Todo | null) {
    setTitle(next?.title ?? "");
    setDescription(next?.description ?? "");
    setPriority(next?.priority ?? "MEDIUM");
    setStatus(next?.status ?? "PENDING");
    setDueDate(toDateInputValue(next?.dueDate));
  }

  function handleOpenChange(open: boolean) {
    if (!open) reset(null);
    else if (isEdit) reset(todo);
    props.onOpenChange(open);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    const isoDueDate = fromDateInputValue(dueDate);

    if (isEdit && todo) {
      update.mutate({
        id: todo.id,
        title: trimmedTitle,
        description: description.trim() || null,
        priority,
        status,
        dueDate: isoDueDate,
      });
    } else {
      create.mutate({
        title: trimmedTitle,
        ...(description.trim() && { description: description.trim() }),
        priority,
        ...(isoDueDate && { dueDate: isoDueDate }),
      });
    }
  }

  const pending = isEdit ? update.isPending : create.isPending;
  const error = isEdit ? update.error : create.error;

  return (
    <Dialog open={props.open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Modifier la tâche" : "Nouvelle tâche"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Mettez à jour les détails de cette tâche."
              : "Renseignez le titre et les options de votre nouvelle tâche."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="todo-title">Titre</label>
            <Input
              id="todo-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Que faut-il faire ?"
              required
              maxLength={200}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="todo-description">Description</label>
            <Textarea
              id="todo-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Détails (optionnel)"
              maxLength={2000}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="todo-priority">Priorité</label>
              <NativeSelect
                id="todo-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </NativeSelect>
            </div>
            {isEdit && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="todo-status">Statut</label>
                <NativeSelect
                  id="todo-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Status)}
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </NativeSelect>
              </div>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="todo-due">Échéance</label>
            <Input
              id="todo-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error.message ?? "Erreur."}</p>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => props.onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={pending || !title.trim()}>
              {pending ? "Enregistrement..." : isEdit ? "Enregistrer" : "Créer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
