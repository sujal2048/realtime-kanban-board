import io from 'socket.io-client';
import { useTaskStore } from '../store/taskStore';
import { usePresenceStore } from '../store/presenceStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

export const socket = io(SOCKET_URL, {
  autoConnect: false, // we'll connect after username is set
  reconnection: true,
  transports: ['websocket', 'polling'],
});

socket.on('connect', () => {
  console.log('connected');
  console.log('✅ Socket connected, id:', socket.id);
  useTaskStore.getState().setOnline(true);
  //socket.emit('join_board', username);
});

socket.on('disconnect', () => {
  console.log('disconnected');
  useTaskStore.getState().setOnline(false);
});

socket.on('init', (tasks) => {
  useTaskStore.getState().init(tasks);
});
socket.on('connect_error', (err) => console.error('❌ Connection error', err.message));
socket.on('task:created', (task) => {
    console.log('Received task:created', task); // <-- ADD THIS
  useTaskStore.getState().applyServerUpdate(task);
});

socket.on('task:updated', (task) => {
  console.log('Received task:updated', task);
  useTaskStore.getState().applyServerUpdate(task);
});

socket.on('task:deleted', (id) => {
  console.log('Received task:deleted', id);
  useTaskStore.getState().applyServerDelete(id);
});

// Presence events
socket.on('presence', (users: string[]) => {
  console.log(' presence received', users);
  usePresenceStore.getState().setOnlineUsers(users);
});

socket.on('task:startEdit', ({ taskId, username }: { taskId: string; username: string }) => {
  usePresenceStore.getState().addEditing(taskId, username);
});

socket.on('task:stopEdit', ({ taskId, username }: { taskId: string; username: string }) => {
  usePresenceStore.getState().removeEditing(taskId, username);
});

// When a user disconnects, clear their editing markers
socket.on('user:disconnected', (username: string) => {
  usePresenceStore.getState().clearEditingByUser(username);
});

socket.on('task:created', (task) => {
  console.log('📦 Received task:created', task);
  useTaskStore.getState().applyServerUpdate(task);
});

socket.on('task:updated', (task) => {
  console.log('📦 Received task:updated', task);
  useTaskStore.getState().applyServerUpdate(task);
});

socket.on('task:deleted', (id) => {
  console.log('📦 Received task:deleted', id);
  useTaskStore.getState().applyServerDelete(id);
});
