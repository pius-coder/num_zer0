export interface ConsoleLog {
  level: "info" | "warn" | "error" | "debug";
  message: string;
  timestamp: Date;
}

export interface ExecutionEvent {
  type: "query" | "mutation" | "action";
  name: string;
  status: "success" | "error";
  durationMs: number;
  error?: string;
  timestamp: Date;
  requestId: string;
  consoleLogs: ConsoleLog[];
}

type Subscriber = (event: ExecutionEvent) => void;

const MAX_RECENT = 1000;

class EventBus {
  private subscribers = new Set<Subscriber>();
  private recent: ExecutionEvent[] = [];

  emit(event: ExecutionEvent): void {
    this.recent.push(event);
    if (this.recent.length > MAX_RECENT) this.recent.shift();
    for (const sub of this.subscribers) sub(event);
  }

  subscribe(fn: Subscriber): () => void {
    this.subscribers.add(fn);
    return () => this.subscribers.delete(fn);
  }

  getRecent(): ExecutionEvent[] {
    return this.recent;
  }
}

export const eventBus = new EventBus();
