import { Server, Socket } from 'socket.io';
import { createTask, updateTask, moveTask, deleteTask } from '../../services/taskService';

export const handleCreate = async (io: Server, socket: Socket, data: any) => {
  try {
    const { id, title, column, afterId } = data;
    const task = await createTask({ id, title, column, afterId });
    io.to('board').emit('task:created', { task, createdBy: socket.id });
  } catch (err: any) {
    socket.emit('error', { message: err.message });
  }
};

export const handleUpdate = async (io: Server, socket: Socket, data: any) => {
  try {
    const { id, ...changes } = data; // changes is an object with title, description, etc.
    const task = await updateTask(id, changes);
    io.to('board').emit('task:updated', { task, updatedBy: socket.id });
  } catch (err: any) {
    socket.emit('error', { message: err.message });
  }
};

export const handleMove = async (io: Server, socket: Socket, data: any) => {
  try {
    const { id, column, afterId } = data;
    const task = await moveTask({ id, column, afterId });
    io.to('board').emit('task:moved', { task, movedBy: socket.id });
  } catch (err: any) {
    socket.emit('error', { message: err.message });
  }
};

export const handleDelete = async (io: Server, socket: Socket, data: any) => {
  try {
    const { id } = data;
    await deleteTask(id);
    io.to('board').emit('task:deleted', { id, deletedBy: socket.id });
  } catch (err: any) {
    socket.emit('error', { message: err.message });
  }
};