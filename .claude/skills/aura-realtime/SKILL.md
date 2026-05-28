---
name: aura-realtime
description: "Aura reactive realtime system. Use when debugging invalidation, understanding read/write keys, configuring WebSocket subscriptions, or multi-tab sync."
---

# Aura Realtime

## Flow
1. Operation executes → tracked proxy records `readKeys` + `writeKeys`
2. Mutation succeeds → `writeKeys` published to realtime server (`POST /publish`)
3. Realtime server routes to clients whose subscriptions match any write key
4. Client invalidates matching TanStack queries

## Server routing
Inverted index: `readKey → Set<clientId>`.
- Write `Todo:123` → delivers to clients subscribed to `Todo` or `Todo:123`
- Write `Todo` → delivers to clients subscribed to `Todo` or `Todo:<anyId>`

## Multi-tab
- Leader election via `navigator.locks` (Web Locks API)
- Leader holds single WebSocket; siblings use `BroadcastChannel`
- Each tab announces its readKeys to leader via BroadcastChannel
- Leader aggregates union → sends SUB/UNSUB diffs to server
- On leader close → re-election, new leader re-announces all keys

## Client subscription
`AuraRealtimeProvider` (inside `AuraProvider`) manages subscriptions automatically. The `read-registry` tracks which read keys each active query has, and `collectActiveReadKeys()` computes the union for the realtime provider.

## Debugging

### Server endpoints
```
GET /clients — list connected clients + subscribed keys
GET /        — status page (client count + subscription count)
```

### Logs
```
[aura:realtime] open <id> (total: N)
[aura:realtime] publish → N client(s) [Todo, Todo:abc]
[aura:realtime] connected ws://...
[aura:realtime] elected leader for this browser
[aura:realtime] invalidated [...] from [...]
```

## Architecture
```
Browser (leader tab)
  ├─ WebSocket ──────────→ Realtime Server (Hono, :3001)
  │                         ├─ /ws — WebSocket (SUB/UNSUB/PONG)
  │                         ├─ /publish — HTTP (HMAC-signed)
  │                         ├─ /clients — debug listing
  │                         └─ inverted index: key → clientIds
  └─ BroadcastChannel ──→ sibling tabs (local invalidation)

Runner (after mutation)
  └─ POST /publish ─────→ Realtime Server
     HMAC-signed body      └─ routePublish() → targeted fanout
```

## Source files
- `packages/plugins/realtime/src/server.ts` — WS server, SUB/UNSUB, routing
- `packages/plugins/realtime/src/client.tsx` — leader election, subscriptions
- `packages/plugins/realtime/src/publish.ts` — server-to-server publish
- `packages/aura/src/client/read-registry.ts` — client read-key registry
