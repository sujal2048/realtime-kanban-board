import  { useEffect, useState } from 'react';
import Board from './components/Board';
import UsernameModal from './components/UsernameModal';
import { socket } from './socket/client';
import { useTaskStore } from './store/taskStore';
import { usePresenceStore } from './store/presenceStore';

function App() {
  const online = useTaskStore(state => state.online);
  const onlineUsers = usePresenceStore(state => state.onlineUsers);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    if (username) {
      socket.connect();
      // Emit join_board after connection (socket queues events until connected)
      socket.emit('join_board', username);
      console.log('📤 join_board emitted', username);

    }
    return () => {
      socket.disconnect();
    };
  }, [username]);

  if (!username) {
    return <UsernameModal onSubmit={setUsername} />;
  }

  return (
    <div className="app">
      {/* header with presence and offline status */}
      <div className="header">
        <h1>Real-Time Task Board</h1>
        <div>
          {online ? '🟢 Online' : '🔴 Offline'}
          <div className="avatars">
            {onlineUsers.map(user => (
              <span key={user} className="avatar">{user.charAt(0)}</span>
            ))}
          </div>
          <span>You: {username}</span>
        </div>
      </div>
      <Board />
    </div>
  );
}

export default App;