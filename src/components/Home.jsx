import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../api/supabase';

function Home() {
  const [roomName, setRoomName] = useState('');
  const [chatRooms, setChatRooms] = useState([]);
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  // Fetch all chat rooms
  useEffect(() => {
    const fetchRooms = async () => {
      const { data, error } = await supabase.from('chat_rooms').select('*');
      if (error) {
        console.error('Error fetching rooms:', error);
      } else {
        setChatRooms(data);
      }
    };

    fetchRooms();

    // Subscribe to new chat rooms in real-time
    const subscription = supabase
      .channel('chat_rooms')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_rooms' }, (payload) => {
        setChatRooms((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Create a new chat room
  const handleCreateRoom = async () => {
    if (!roomName || !userName) {
      alert('Please enter a room name and your name');
      return;
    }

    const { data, error } = await supabase
      .from('chat_rooms')
      .insert({ name: roomName })
      .select()
      .single();

    if (error) {
      console.error('Error creating room:', error);
    } else {
      sessionStorage.setItem('userName', userName);
      navigate(`/room/${data.id}`);
    }
  };

  // Join an existing chat room
  const handleJoinRoom = (roomId) => {
    if (!userName) {
      alert('Please enter your name');
      return;
    }
    sessionStorage.setItem('userName', userName);
    navigate(`/room/${roomId}`);
  };

  return (
    <div className="home-container">
      <h1>Real-Time Chat App</h1>
      <div className="user-name-section">
        <input
          type="text"
          placeholder="Enter your name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
        />
      </div>
      <div className="create-room-section">
        <input
          type="text"
          placeholder="Enter new room name"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
        />
        <button onClick={handleCreateRoom}>Create Room</button>
      </div>
      <div className="room-list">
        <h2>Available Chat Rooms</h2>
        {chatRooms.length === 0 ? (
          <p>No chat rooms available. Create one!</p>
        ) : (
          <ul>
            {chatRooms.map((room) => (
              <li key={room.id}>
                {room.name}
                <button onClick={() => handleJoinRoom(room.id)}>Join</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Home;