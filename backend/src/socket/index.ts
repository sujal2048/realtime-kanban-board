import { Server, Socket } from 'socket.io';
import { getAllTasks, createTask, updateTask, deleteTask } from '../services/taskService';

export function registerSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log('user connected', socket.id);

    // Send current tasks to the new client
    getAllTasks().then(tasks => {
      socket.emit('init', tasks);
    });

    // Presence: join a room and broadcast users
    socket.on('join_board', (username: string) => {
      console.log(`👤 ${username} joined`);
      socket.data.username = username;
      socket.join('board');
      io.to('board').emit('presence', getOnlineUsers(io));
    });

    // Task operations
   socket.on('task:create', async (data, callback) => {
    console.log('📤 task:create received', data);
  try {
    const { tempId, ...taskData } = data; // extract tempId
    const task = await createTask(taskData);
     console.log('✅ Task created in DB', task);
    // Return both the created task and the tempId so client can replace
    callback?.({ success: true, task, tempId });
    // Broadcast to all other clients (excluding sender? We'll broadcast to all, sender will handle via callback)
    io.emit('task:created', task);
  } catch (err) {
    console.error('❌ DB error', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    callback?.({ success: false, error: errorMessage });
  }
});

    socket.on('task:update', async (data, callback) => {
  try {
    const { id, ...changes } = data;
    const task = await updateTask(id, changes);
    io.emit('task:updated', task);
    callback?.({ success: true, task });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    callback?.({ success: false, error: errorMessage });
  }
});
    socket.on('task:delete', async (id, callback) => {
      try {
        await deleteTask(id);
          console.log('Task deleted, broadcasting:', id); // <-- ADD THIS

        io.emit('task:deleted', id);
        callback?.({ success: true });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('Delete error:', errorMessage); // <-- ADD THIS
  callback?.({ success: false, error: errorMessage });
      }
    });
   
    socket.on('task:startEdit', ({ taskId }) => {
  // Broadcast to all other clients that this user started editing a task
  socket.to('board').emit('task:startEdit', {
    taskId,
    username: socket.data.username,
  });
});

socket.on('task:stopEdit', ({ taskId }) => {
  socket.to('board').emit('task:stopEdit', {
    taskId,
    username: socket.data.username,
  });
});

    socket.on('disconnect', () => {
      io.to('board').emit('presence', getOnlineUsers(io));
      // also update presence
  io.to('board').emit('presence', getOnlineUsers(io));
    });
  });
}

function getOnlineUsers(io: Server) {
  const users: string[] = [];
  const rooms = io.sockets.adapter.rooms.get('board');
  if (rooms) {
    for (const id of rooms) {
      const socket = io.sockets.sockets.get(id);
      if (socket?.data.username) users.push(socket.data.username);
    }
  }
  return users;
}