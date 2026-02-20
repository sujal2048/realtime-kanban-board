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
      socket.emit('join_board', username);
    }
    return () => {
      socket.disconnect();
    };
  }, [username]);

  if (!username) {
    return <UsernameModal onSubmit={setUsername} />;
  }

  return (
    <div className="app-container">
      <header className="header">
        <h1>Real-Time Task Board</h1>
        <div className="header-right">
          <div className="status">
            <div className={`status-dot ${online ? 'online' : 'offline'}`} />
            <span>{online ? 'Online' : 'Offline'}</span>
          </div>
          <div className="avatars">
            {onlineUsers.map((user, i) => (
              <div key={i} className="avatar" title={user}>
                {user.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
          <div className="user-badge">
            You: <span>{username}</span>
          </div>
        </div>
      </header>
      <Board />
    </div>
  );
}

export default App;