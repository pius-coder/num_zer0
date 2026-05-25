import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "@/aura/client";
import { api } from "@/aura/_generated/api";
import { Button } from "@/aura/ui/button";
import { Input } from "@/aura/ui/input";
import { Textarea } from "@/aura/ui/textarea";
import { Label } from "@/aura/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/aura/ui/card";
import { Badge } from "@/aura/ui/badge";
import { Checkbox } from "@/aura/ui/checkbox";
import { NativeSelect } from "@/aura/ui/native-select";
import { AuraEmptyState, AuraLoadingSkeleton, AuraSearchInput } from "@/aura/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({ component: TodoApp });

type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: "URGENT", label: "Urgente", color: "bg-red-500" },
  { value: "HIGH", label: "Haute", color: "bg-orange-500" },
  { value: "MEDIUM", label: "Moyenne", color: "bg-blue-500" },
  { value: "LOW", label: "Basse", color: "bg-gray-400" },
];

function TodoApp() {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery(api.todos.list, {
    numItems: 100,
    ...(search ? { search } : {}),
  });
  const todos = data?.items ?? [];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Todo App</h1>
          <p className="text-muted-foreground mt-0.5 text-xs">
            {todos.length} tâche{todos.length > 1 ? "s" : ""}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          Nouvelle tâche
        </Button>
      </div>

      <div className="mb-4">
        <AuraSearchInput onSearch={setSearch} placeholder="Rechercher..." />
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="pt-4">
            <AuraLoadingSkeleton lines={5} />
          </CardContent>
        </Card>
      ) : todos.length === 0 ? (
        <Card>
          <CardContent className="pt-4">
            <AuraEmptyState
              title={search ? "Aucun résultat" : "Aucune tâche"}
              description={search ? "Essayez d'autres termes." : "Créez votre première tâche."}
              action={
                !search
                  ? { label: "Nouvelle tâche", onClick: () => setShowCreate(true) }
                  : undefined
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {todos.map((todo: any) => (
            <TodoItem key={todo.id} todo={todo} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateTodoModal onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}

function TodoItem({ todo }: { todo: any }) {
  const toggle = useMutation(api.todos.toggle);
  const remove = useMutation(api.todos.delete);
  const isDone = todo.status === "DONE";
  const priority = PRIORITIES.find((p) => p.value === todo.priority) ?? PRIORITIES[3];

  return (
    <Card className={cn(isDone && "opacity-50")}>
      <CardContent className="flex items-center gap-3 pt-3 pb-3">
        <Checkbox
          checked={isDone}
          onCheckedChange={() => toggle.mutate({ id: todo.id })}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "text-sm font-medium",
                isDone && "line-through text-muted-foreground",
              )}
            >
              {todo.title}
            </span>
            <Badge variant="outline" className="text-[10px] h-4">
              <span
                className={cn("mr-1 inline-block h-1.5 w-1.5 rounded-full", priority.color)}
              />
              {priority.label}
            </Badge>
            {todo.dueDate && (
              <span className="text-muted-foreground text-[10px]">
                {new Date(todo.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
          {todo.description && (
            <p className="text-muted-foreground mt-0.5 text-xs">
              {todo.description}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => remove.mutate({ id: todo.id })}
          disabled={remove.isPending}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 3h8M4.5 3V1.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5V3M5 5.5v3M7 5.5v3M2.5 3l.5 7a1 1 0 001 1h4a1 1 0 001-1l.5-7"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Button>
      </CardContent>
    </Card>
  );
}

function CreateTodoModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");

  const create = useMutation(api.todos.create);

  const handleSubmit = () => {
    if (!title.trim()) return;
    create.mutate(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
      },
      {
        onSuccess: () => {
          setTitle("");
          setDescription("");
          setPriority("MEDIUM");
          onClose();
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <Card className="w-full max-w-sm mx-4">
        <CardHeader>
          <CardTitle>Nouvelle tâche</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Que faire ?"
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Détails (optionnel)"
              rows={3}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="prio">Priorité</Label>
            <NativeSelect
              id="prio"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={create.isPending || !title.trim()}
              className="flex-1"
            >
              {create.isPending ? "..." : "Créer"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
