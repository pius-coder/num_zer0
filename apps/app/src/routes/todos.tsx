import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@/aura/client";
import { api } from "@/aura/_generated/api";
import { Button } from "@/aura/ui/button";
import { Input } from "@/aura/ui/input";
import { Textarea } from "@/aura/ui/textarea";
import { Label } from "@/aura/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/aura/ui/card";
import { Badge } from "@/aura/ui/badge";
import { Checkbox } from "@/aura/ui/checkbox";
import { AuraEmptyState, AuraLoadingSkeleton, AuraConfirmDialog, AuraSearchInput } from "@/aura/ui";
import { cn } from "@/lib/utils";
import type { Todo } from "@/aura/entities";

export const Route = createFileRoute("/todos")({
  component: TodosPage,
});

const PRIORITY_CONFIG = {
  URGENT: { label: "Urgente", variant: "destructive" as const, dot: "bg-red-500" },
  HIGH: { label: "Haute", variant: "default" as const, dot: "bg-orange-500" },
  MEDIUM: { label: "Moyenne", variant: "secondary" as const, dot: "bg-blue-500" },
  LOW: { label: "Basse", variant: "outline" as const, dot: "bg-gray-400" },
} as const;

type StatusTab = "all" | "PENDING" | "IN_PROGRESS" | "DONE";
const STATUS_TABS: { key: StatusTab; label: string }[] = [
  { key: "all", label: "Toutes" },
  { key: "PENDING", label: "À faire" },
  { key: "IN_PROGRESS", label: "En cours" },
  { key: "DONE", label: "Terminées" },
];

function TodosPage() {
  const [statusFilter, setStatusFilter] = useState<StatusTab>("all");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery(api.todos.list, {
    numItems: 100,
    ...(statusFilter !== "all" && { status: statusFilter }),
    ...(search ? { search } : {}),
  });

  const todos = data?.items ?? [];

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Mes tâches</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">{todos.length} tâche{todos.length > 1 ? "s" : ""}</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>Nouvelle tâche</Button>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <AuraSearchInput onSearch={setSearch} placeholder="Rechercher..." />
        </div>
        <div className="flex gap-1">
          {STATUS_TABS.map(({ key, label }) => (
            <Button
              key={key}
              variant={statusFilter === key ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(key)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <AuraLoadingSkeleton lines={6} />
          </CardContent>
        </Card>
      ) : todos.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <AuraEmptyState
              title={search ? "Aucun résultat" : "Aucune tâche"}
              description={search ? "Essayez d'autres termes de recherche." : "Créez votre première tâche pour commencer."}
              action={!search ? { label: "Nouvelle tâche", onClick: () => setShowCreate(true) } : undefined}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              isEditing={editingId === todo.id}
              onStartEdit={() => setEditingId(todo.id)}
              onStopEdit={() => setEditingId(null)}
            />
          ))}
        </div>
      )}

      {showCreate && <CreateTodoModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}

function TodoItem({
  todo,
  isEditing,
  onStartEdit,
  onStopEdit,
}: {
  todo: Todo;
  isEditing: boolean;
  onStartEdit: () => void;
  onStopEdit: () => void;
}) {
  const toggle = useMutation(api.todos.toggle);
  const remove = useMutation(api.todos.delete);
  const update = useMutation(api.todos.update);

  const config = PRIORITY_CONFIG[todo.priority as keyof typeof PRIORITY_CONFIG];
  const isDone = todo.status === "DONE";

  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDesc, setEditDesc] = useState(todo.description ?? "");

  const handleSave = () => {
    if (!editTitle.trim()) return;
    update.mutate(
      { id: todo.id, title: editTitle, description: editDesc || null },
      { onSuccess: onStopEdit },
    );
  };

  const handleCancel = () => {
    setEditTitle(todo.title);
    setEditDesc(todo.description ?? "");
    onStopEdit();
  };

  if (isEditing) {
    return (
      <Card className="border-primary/30">
        <CardContent className="pt-4">
          <div className="space-y-3">
            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} autoFocus />
            <Textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={2} placeholder="Description..." />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={handleCancel}>Annuler</Button>
              <Button size="sm" onClick={handleSave} disabled={update.isPending}>
                {update.isPending ? "..." : "Enregistrer"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("group", isDone && "opacity-60")}>
      <CardContent className="flex items-start gap-3 pt-4">
        <Checkbox
          checked={isDone}
          onCheckedChange={() => toggle.mutate({ id: todo.id })}
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("flex items-center gap-1.5 text-sm font-medium", isDone && "line-through")}>
              <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", config.dot)} />
              {todo.title}
            </span>
            <Badge variant={config.variant} className="text-[10px] leading-none">
              {config.label}
            </Badge>
            {todo.dueDate && (
              <span className="text-muted-foreground text-[10px]">
                {new Date(todo.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
          {todo.description && (
            <p className="text-muted-foreground mt-0.5 text-xs line-clamp-2">{todo.description}</p>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon-xs" onClick={onStartEdit} aria-label="Modifier">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
            </svg>
          </Button>
          <AuraConfirmDialog
            title="Supprimer cette tâche ?"
            description={`"${todo.title}" sera définitivement supprimée.`}
            confirmLabel="Supprimer"
            variant="destructive"
            onConfirm={() => remove.mutate({ id: todo.id })}
            trigger={
              <Button variant="ghost" size="icon-xs" aria-label="Supprimer">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 3H10M4.5 3V1.5C4.5 1.22386 4.72386 1 5 1H7C7.27614 1 7.5 1.22386 7.5 1.5V3M5 5.5V8.5M7 5.5V8.5M2.5 3L3 10.5C3 10.7761 3.22386 11 3.5 11H8.5C8.77614 11 9 10.7761 9 10.5L9.5 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Button>
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}

function CreateTodoModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");

  const create = useMutation(api.todos.create, {
    onSuccess: () => {
      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    create.mutate({ title: title.trim(), description: description.trim() || undefined, priority });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Nouvelle tâche</CardTitle>
          <Button variant="ghost" size="icon-xs" onClick={onClose} aria-label="Fermer">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="modal-title">Titre</Label>
              <Input id="modal-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Que devez-vous faire ?" autoFocus required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="modal-desc">Description</Label>
              <Textarea id="modal-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Détails optionnels..." rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label>Priorité</Label>
              <div className="flex gap-2">
                {(Object.entries(PRIORITY_CONFIG) as [keyof typeof PRIORITY_CONFIG, typeof PRIORITY_CONFIG[keyof typeof PRIORITY_CONFIG]][]).map(([key, cfg]) => (
                  <Button
                    key={key}
                    type="button"
                    variant={priority === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPriority(key)}
                    className="flex-1"
                  >
                    {cfg.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" type="button" onClick={onClose} className="flex-1">Annuler</Button>
              <Button type="submit" disabled={create.isPending || !title.trim()} className="flex-1">
                {create.isPending ? "Création..." : "Créer"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
