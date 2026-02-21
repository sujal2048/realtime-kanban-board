import { create } from 'zustand';
import type { Task } from '../types';
import { socket } from '../socket/client';
import { offlineQueue } from './offlineQueue';
import toast from 'react-hot-toast';

export interface TaskStore {
  tasks: Task[];
  online: boolean;
  init: (tasks: Task[]) => void;
  optimisticCreate: (task: Partial<Task>) => void;
  optimisticUpdate: (id: string, changes: Partial<Task>) => void;
  optimisticDelete: (id: string) => void;
  applyServerUpdate: (task: Task) => void;
  applyServerDelete: (id: string) => void;
  setOnline: (status: boolean) => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  online: true,

  init: (tasks) => set({ tasks }),

  optimisticCreate: (task) => {
  const tempId = `temp-${Date.now()}-${Math.random()}`;
  const newTask = { 
    id: tempId, 
    title: 'New Task', 
    description: '', 
    column: 'todo', 
    rank: 'a0', 
    ...task,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  } as Task;
  set(state => ({ tasks: [...state.tasks, newTask] }));

   setTimeout(() => {
    set(state => {
      if (state.tasks.some(t => t.id === tempId)) {
        return { tasks: state.tasks.filter(t => t.id !== tempId) };
      }
      return state;
    });
  }, 10000);

  if (!get().online) {
    offlineQueue.enqueue({ type: 'CREATE', payload: { ...task, tempId } });
  } else {
    socket.emit('task:create', { ...task, tempId }, (response: any) => {
      if (response.success) {
        // Replace temp task with real task
        set(state => ({
          tasks: state.tasks.map(t => t.id === response.tempId ? response.task : t)
        }));
      } else {
        // Rollback on error
        set(state => ({ tasks: state.tasks.filter(t => t.id !== tempId) }));
      }
    });
  }
},

applyServerUpdate: (task) => {
  set(state => {
    const oldTask = state.tasks.find(t => t.id === task.id);
    // If the task existed and its column changed, show notification (move conflict)
    if (oldTask && oldTask.column !== task.column) {
      // Use a simple alert; in production, use a toast library
      toast(`Task "${task.title}" was moved to ${task.column} by another user.`);
    }
    const exists = state.tasks.some(t => t.id === task.id);
    if (exists) {
      return { tasks: state.tasks.map(t => t.id === task.id ? task : t) };
    } else {
      return { tasks: [...state.tasks, task] };
    }
  });
},
  optimisticUpdate: (id, changes) => {
    set(state => ({
      tasks: state.tasks.map(t => t.id === id ? { ...t, ...changes } : t)
    }));

    if (!get().online) {
      offlineQueue.enqueue({ type: 'UPDATE', payload: { id, ...changes } });
    } else {
      socket.emit('task:update', { id, ...changes }, (response: any) => {
        if (!response.success) {
          // revert? but server state will be broadcast anyway
        }
      });
    }
  },

  optimisticDelete: (id) => {
    set(state => ({ tasks: state.tasks.filter(t => t.id !== id) }));
    if (!get().online) {
      offlineQueue.enqueue({ type: 'DELETE', payload: id });
    } else {
      socket.emit('task:delete', id);
    }
  },

  
  applyServerDelete: (id) => {
    set(state => ({ tasks: state.tasks.filter(t => t.id !== id) }));
  },

  setOnline: (status) => {
    set({ online: status });
    if (status) {
      offlineQueue.flush(get());
    }
  },
}));
