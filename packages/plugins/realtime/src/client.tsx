"use client";

import { useEffect, useRef, type ReactNode } from "react";

const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;
const CHANNEL = "aura:realtime";
const LOCK = "aura:realtime-leader";
const DEDUP_MS = 2_000;

type ServerMessage =
  | { type: "INVALIDATE"; id: string; keys: string[] }
  | { type: "PING" }
  | { type: "CLOSING" };

function defaultWsUrl(): string {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/aura-realtime/ws`;
}

export interface AuraRealtimeProviderProps {
  children: ReactNode;
  /** Optional override. Defaults to `ws(s)://<same-origin>/aura-realtime/ws`. */
  wsUrl?: string;
  /** Invoked once per unique invalidation (dedup is internal). */
  onInvalidate: (keys: string[]) => void;
}

/**
 * Mounts a WebSocket connection (leader-only via Web Locks) and a
 * BroadcastChannel that fans invalidations out to sibling tabs of the same
 * browser. The leader's WS receives every server publish; sibling tabs hear
 * it via the channel without opening their own socket.
 */
export function AuraRealtimeProvider({
  children,
  wsUrl,
  onInvalidate,
}: AuraRealtimeProviderProps) {
  const callbackRef = useRef(onInvalidate);
  callbackRef.current = onInvalidate;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const url = wsUrl ?? defaultWsUrl();
    const channel = new BroadcastChannel(CHANNEL);
    const seen = new Map<string, number>();
    let unmounted = false;
    let socket: WebSocket | null = null;
    let reconnectAttempt = 0;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let releaseLock: (() => void) | null = null;

    function isDuplicate(id: string): boolean {
      const now = Date.now();
      for (const [k, ts] of seen) if (now - ts > DEDUP_MS) seen.delete(k);
      if (seen.has(id)) return true;
      seen.set(id, now);
      return false;
    }

    function deliver(id: string, keys: string[]) {
      if (isDuplicate(id)) return;
      callbackRef.current(keys);
    }

    channel.onmessage = (event: MessageEvent<{ id: string; keys: string[] }>) => {
      const msg = event.data;
      if (!msg?.id || !Array.isArray(msg.keys)) return;
      deliver(msg.id, msg.keys);
    };

    function connect() {
      if (unmounted) return;
      socket = new WebSocket(url);

      socket.onopen = () => {
        reconnectAttempt = 0;
        console.log("[aura:realtime] connected", url);
      };

      socket.onmessage = (event) => {
        let msg: ServerMessage;
        try {
          msg = JSON.parse(event.data as string);
        } catch {
          return;
        }
        if (msg.type === "PING") {
          socket?.send(JSON.stringify({ type: "PONG" }));
          return;
        }
        if (msg.type === "INVALIDATE") {
          deliver(msg.id, msg.keys);
          channel.postMessage({ id: msg.id, keys: msg.keys });
        }
      };

      socket.onclose = () => {
        if (unmounted) return;
        const delay = Math.min(RECONNECT_BASE_MS * 2 ** reconnectAttempt, RECONNECT_MAX_MS);
        reconnectAttempt += 1;
        reconnectTimer = setTimeout(connect, delay);
      };

      socket.onerror = () => socket?.close();
    }

    if ("locks" in navigator) {
      navigator.locks
        .request(LOCK, { mode: "exclusive" }, () => {
          if (unmounted) return;
          console.log("[aura:realtime] elected leader for this browser");
          connect();
          return new Promise<void>((resolve) => {
            releaseLock = resolve;
          });
        })
        .catch(() => {
          /* another tab is leader — listen via BroadcastChannel only */
        });
    } else {
      connect();
    }

    return () => {
      unmounted = true;
      channel.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (socket) {
        socket.onopen = null;
        socket.onmessage = null;
        socket.onclose = null;
        socket.onerror = null;
        socket.close();
      }
      releaseLock?.();
    };
  }, [wsUrl]);

  return <>{children}</>;
}
