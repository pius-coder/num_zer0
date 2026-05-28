"use client";

import {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  type ReactNode,
} from "react";

const RECONNECT_BASE_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;
const CHANNEL = "aura:realtime";
const LOCK = "aura:realtime-leader";
const DEDUP_MS = 2_000;

type ServerMessage =
  | { type: "INVALIDATE"; id: string; keys: string[] }
  | { type: "PING" }
  | { type: "CLOSING" };

export interface RealtimeHandle {
  setSubscriptions(keys: Set<string>): void;
}

export interface AuraRealtimeProviderProps {
  children: ReactNode;
  wsUrl?: string;
  onInvalidate: (keys: string[]) => void;
}

function diffKeys(prev: Set<string>, next: Set<string>): { sub: string[]; unsub: string[] } {
  const sub: string[] = [];
  const unsub: string[] = [];
  for (const k of next) if (!prev.has(k)) sub.push(k);
  for (const k of prev) if (!next.has(k)) unsub.push(k);
  return { sub, unsub };
}

export const AuraRealtimeProvider = forwardRef<RealtimeHandle, AuraRealtimeProviderProps>(
  function AuraRealtimeProvider({ children, wsUrl, onInvalidate }, ref) {
    const callbackRef = useRef(onInvalidate);
    callbackRef.current = onInvalidate;

    const localKeysRef = useRef<Set<string>>(new Set());
    const siblingKeysRef = useRef<Map<string, Set<string>>>(new Map());
    const socketRef = useRef<WebSocket | null>(null);
    const isLeaderRef = useRef(false);
    const channelRef = useRef<BroadcastChannel | null>(null);
    const tabIdRef = useRef<string>(crypto.randomUUID());

    function computeUnion(): Set<string> {
      const union = new Set<string>();
      for (const k of localKeysRef.current) union.add(k);
      for (const keys of siblingKeysRef.current.values()) {
        for (const k of keys) union.add(k);
      }
      return union;
    }

    function emitDiffToServer(prev: Set<string>, next: Set<string>) {
      if (!isLeaderRef.current || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
      const { sub, unsub } = diffKeys(prev, next);
      if (sub.length > 0) socketRef.current.send(JSON.stringify({ type: "SUB", keys: sub }));
      if (unsub.length > 0) socketRef.current.send(JSON.stringify({ type: "UNSUB", keys: unsub }));
    }

    useImperativeHandle(ref, () => ({
      setSubscriptions(keys: Set<string>) {
        const prev = computeUnion();
        localKeysRef.current = new Set(keys);
        const next = computeUnion();
        if (isLeaderRef.current) {
          emitDiffToServer(prev, next);
        } else {
          // Non-leader tab: forward its keys to the leader, which owns the
          // single WS and aggregates the union across all tabs.
          channelRef.current?.postMessage({
            type: "SIBLING_KEYS",
            tabId: tabIdRef.current,
            readKeys: [...localKeysRef.current],
          });
        }
      },
    }));

    useEffect(() => {
      if (typeof window === "undefined") return;
      if (!wsUrl) {
        console.warn(
          "[aura:realtime] wsUrl is not configured — realtime invalidations disabled."
        );
        return;
      }
      const url = wsUrl;
      const channel = new BroadcastChannel(CHANNEL);
      channelRef.current = channel;
      const seen = new Map<string, number>();
      let unmounted = false;
      let socket: WebSocket | null = null;
      let reconnectAttempt = 0;
      let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
      let releaseLock: (() => void) | null = null;

      socketRef.current = null;
      isLeaderRef.current = false;

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

      channel.onmessage = (event: MessageEvent<{ type?: string; id?: string; keys?: string[]; tabId?: string; readKeys?: string[] }>) => {
        const msg = event.data;
        if (!msg) return;

        if (msg.type === "SIBLING_KEYS" && msg.tabId && Array.isArray(msg.readKeys)) {
          const prev = computeUnion();
          siblingKeysRef.current.set(msg.tabId, new Set(msg.readKeys));
          if (isLeaderRef.current) {
            const next = computeUnion();
            emitDiffToServer(prev, next);
          }
          return;
        }

        if (msg.type === "SIBLING_LEAVE" && msg.tabId) {
          const prev = computeUnion();
          siblingKeysRef.current.delete(msg.tabId);
          if (isLeaderRef.current) {
            const next = computeUnion();
            emitDiffToServer(prev, next);
          }
          return;
        }

        // A newly elected leader asks every tab to re-announce its keys so
        // it can rebuild the union after a leader handoff.
        if (msg.type === "REQUEST_KEYS") {
          channel.postMessage({
            type: "SIBLING_KEYS",
            tabId,
            readKeys: [...localKeysRef.current],
          });
          return;
        }

        if (msg.id && Array.isArray(msg.keys)) {
          deliver(msg.id, msg.keys);
        }
      };

      const tabId = tabIdRef.current;

      function connect() {
        if (unmounted) return;
        socket = new WebSocket(url);
        socketRef.current = socket;

        socket.onopen = () => {
          reconnectAttempt = 0;
          console.log("[aura:realtime] connected", url);
          const prev = new Set<string>();
          const next = computeUnion();
          emitDiffToServer(prev, next);
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
          socketRef.current = null;
          if (unmounted) return;
          const delay = Math.min(RECONNECT_BASE_MS * 2 ** reconnectAttempt, RECONNECT_MAX_MS);
          reconnectAttempt += 1;
          reconnectTimer = setTimeout(connect, delay);
        };

        socket.onerror = () => socket?.close();
      }

      function onBecameLeader() {
        isLeaderRef.current = true;
        connect();
        // Ask sibling tabs to re-announce their keys so the union is rebuilt
        // correctly after a leader handoff (their prior announce went to the
        // previous leader, which is now gone).
        channel.postMessage({ type: "REQUEST_KEYS" });
      }

      if ("locks" in navigator) {
        navigator.locks
          .request(LOCK, { mode: "exclusive" }, () => {
            if (unmounted) return;
            console.log("[aura:realtime] elected leader for this browser");
            onBecameLeader();
            return new Promise<void>((resolve) => {
              releaseLock = resolve;
            });
          })
          .catch(() => {
            channel.postMessage({ type: "SIBLING_KEYS", tabId, readKeys: [...localKeysRef.current] });
          });
      } else {
        onBecameLeader();
      }

      return () => {
        unmounted = true;
        channel.postMessage({ type: "SIBLING_LEAVE", tabId });
        channel.close();
        channelRef.current = null;
        if (reconnectTimer) clearTimeout(reconnectTimer);
        if (socket) {
          socket.onopen = null;
          socket.onmessage = null;
          socket.onclose = null;
          socket.onerror = null;
          socket.close();
        }
        socketRef.current = null;
        releaseLock?.();
      };
    }, [wsUrl]);

    return <>{children}</>;
  }
);
