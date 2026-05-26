import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "@/aura/client/hooks";
import { api } from "@/aura/_generated/api";
import { Button } from "@/aura/ui/button";
import { Input } from "@/aura/ui/input";
import { Badge } from "@/aura/ui/badge";
import { Checkbox } from "@/aura/ui/checkbox";
import { NativeSelect } from "@/aura/ui/native-select";
import { AuraEmptyState } from "@/aura/ui/aura-empty-state";
import { AuraLoadingSkeleton } from "@/aura/ui/aura-loading-skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: TodoApp });

const PRIORITIES = [
  { value: "URGENT", label: "Urgente", color: "bg-red-500" },
  { value: "HIGH", label: "Haute", color: "bg-orange-500" },
  { value: "MEDIUM", label: "Moyenne", color: "bg-blue-500" },
  { value: "LOW", label: "Basse", color: "bg-zinc-500" },
] as const;

const FILTERS = [
  { value: "all", label: "Toutes", statuses: undefined as const },
  { value: "active", label: "Actives", statuses: ["PENDING", "IN_PROGRESS"] as const },
  { value: "done", label: "Terminées", statuses: ["DONE"] as const },
];

function TodoApp() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [newTitle, setNewTitle] = useState("");

  const currentFilter = FILTERS.find((f) => f.value === filter) ?? FILTERS[0];

  const { data, isLoading } = useQuery(api.todos.list, {
    numItems: 100,
    ...(currentFilter.statuses && { statuses: currentFilter.statuses }),
    ...(search ? { search } : {}),
  });
  const todos = data?.items ?? [];

  const create = useMutation(api.todos.create);
  const toggle = useMutation(api.todos.toggle);
  const remove = useMutation(api.todos.delete);

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    create.mutate({ title: newTitle.trim(), priority: "MEDIUM" }, {
      onSuccess: () => setNewTitle(""),
    });
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight mb-6">Todo</h1>

      <div className="flex gap-2 mb-4">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Ajouter une tâche..."
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="flex-1"
        />
        <Button onClick={handleAdd} disabled={create.isPending || !newTitle.trim()}>
          Ajouter
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher..."
          className="flex-1"
        />
        <NativeSelect value={filter} onChange={(e) => setFilter(e.target.value)} className="w-32">
          {FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </NativeSelect>
      </div>

      {isLoading ? (
        <AuraLoadingSkeleton lines={6} />
      ) : todos.length === 0 ? (
        <div className="mt-8">
          <AuraEmptyState
            title={search || filter !== "all" ? "Aucun résultat" : "Bienvenue"}
            description={search ? "Essayez d'autres termes." : "Ajoutez votre première tâche."}
          />
        </div>
      ) : (
        <div className="divide-y divide-border">
          {todos.map((todo) => {
            const isDone = todo.status === "DONE";
            const prio = PRIORITIES.find((p) => p.value === todo.priority) ?? PRIORITIES[3];
            return (
              <div key={todo.id} className={cn("flex items-center gap-3 py-3 group", isDone && "opacity-40")}>
                <Checkbox
                  checked={isDone}
                  onCheckedChange={() => toggle.mutate({ id: todo.id })}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-sm", isDone && "line-through text-muted-foreground")}>
                      {todo.title}
                    </span>
                    <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", prio.color)} />
                  </div>
                  {todo.description && (
                    <p className="text-muted-foreground text-xs mt-0.5">{todo.description}</p>
                  )}
                </div>
                {todo.dueDate && (
                  <span className="text-muted-foreground text-[10px] shrink-0">
                    {new Date(todo.dueDate).toLocaleDateString()}
                  </span>
                )}
                <Badge variant="outline" className="text-[10px] h-4 shrink-0">
                  {prio.label}
                </Badge>
                <button
                  onClick={() => remove.mutate({ id: todo.id })}
                  disabled={remove.isPending}
                  className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 3h8M4.5 3V1.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5V3M5 5.5v3M7 5.5v3M2.5 3l.5 7a1 1 0 001 1h4a1 1 0 001-1l.5-7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
