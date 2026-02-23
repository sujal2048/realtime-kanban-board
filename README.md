# Real-Time Collaboration Algorithms
The general theory of collaboration algorithms is to transmit changes between users with the goal of "eventual consistency". If multiple users make changes at the same time their copies of the document might look different for a while, but eventually every user's view will converge to be the same. This is done through what I call a "baseline"; incoming changes are integrated into the local data to form new baselines and local changes are sent based on the current baseline.


1.In OT, every user action is broken down into one or more operations. These operations are transmitted between clients along with their baseline reference; if two users perform actions at the same time, incoming operations must be transformed to include the local operations that have happened since that baseline. They are then applied locally and form the new baseline.


2.The magic of CRDT is due in large part to how it breaks down data into such small pieces that it generally doesn't need to transform the change itself, only the position of the change. For example, text data collaboration with CRDT treats every character as a separate entity.


The limitations of CRDT are similar to what happened when the TP2 restriction was proposed for OT; the difficulty is in the data type. It is not as difficult as TP2 - there is a working OT+TP2 for JSON, but my impression is the CRDT implementation was easier to achieve - but it's still only appropriate for simple use cases.

# About the Real-Time Collaborative task Board

# Real‑Time Synchronization
Each client connects to the Socket.IO server upon entering a username.

The server maintains a room 'board' for all active users.

When a client performs an action (create, update, delete), it emits a corresponding event with the operation data.

Server workflow:

Validates the operation.

Persists the change in PostgreSQL using Prisma.

Broadcasts the updated task (or deletion ID) to all clients in the room (including the sender) via io.emit().

Client workflow:

Listens for broadcast events (task:created, task:updated, task:deleted).

Updates the local Zustand store (applyServerUpdate or applyServerDelete).

For updates, merges changes (if task exists) or inserts it (if new).




# Conflict Resolution Strategy
We are treating the server as the source of truth. All operations are processed in the order they arrive, and conflicts are resolved deterministically.

Scenario	Resolution

Move + Edit	Moves change column/rank; edits change title/description.(focusing on title first) These are disjoint fields, so both are preserved. The server applies both operations – final task contains both modifications.


Move + Move	The operation that arrives last wins. The losing client receives a broadcast of the final task and shows a notification (via toast).


Reorder + Add	Both operations generate unique ranks (fractional indexing). The server merges them; final order is consistent when sorted by rank.


Notification for losing user: In applyServerUpdate, we detect if a task’s column changed and the previous column existed (i.e., the user didn’t initiate this move). A simple alert is shown; this can be replaced with a toast library for better UX.


# FOR THIS ACTUALLY TRYING TO TO  Conflict-free Replicated Data Types (CRDT) .


# Offline Support
The frontend monitors socket connection status via socket.on('disconnect') and socket.on('connect').

When disconnected, the online flag in taskStore becomes false.

All user actions (create, update, delete) are still applied optimistically to the UI, but instead of being sent immediately, they are pushed into an in‑memory queue (offlineQueue.ts).

Upon reconnection, the queue is flushed: each action is emitted to the server in order. The server processes them normally (conflicts resolved as above), and the client reconciles any differences via server broadcasts.

Temporary tasks (IDs starting with temp-) are disabled for editing to prevent confusion; they are automatically replaced when the server confirms creation.


## ✨ Features

- **Three-column Kanban**: To Do, In Progress, Done
- **Real-time sync**: All changes propagate to connected clients in <200ms (local)
- **Drag-and-drop**: Move tasks between columns and reorder within a column
- **Optimistic UI**: Instant feedback, then reconcile with server
- **Offline support**: Queue actions when disconnected, replay on reconnect
- **Conflict resolution**:
  - Concurrent move + edit → both preserved
  - Concurrent move + move → last write wins, loser notified
  - Concurrent reorder + add → consistent order via fractional indexing
- **Multi-user presence**: Avatars and editing indicators (who is viewing/editing)
- **Persistent storage**: PostgreSQL with Prisma ORM

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite, Zustand (state), dnd-kit (drag & drop), Socket.IO-client
- **Backend**: Node.js + Express + TypeScript, Socket.IO, Prisma (ORM)
- **Database**: PostgreSQL (with fractional indexing for ordering)
- **Deployment**: Railway (Dockerized)

## ⚙️ Local Development Setup

### Prerequisites
- Node.js v20+ (v20.19 or higher)
- PostgreSQL (local or Docker)
- Git

