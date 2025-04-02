import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../api/supabase';

function ChatRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [roomName, setRoomName] = useState('');
  const [audioEnabled, setAudioEnabled] = useState(false);
  const userName = sessionStorage.getItem('userName');
  const messagesEndRef = useRef(null);
  const audioRef = useRef(null);

  // Initialize audio when user first interacts
  const enableAudio = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/notification.mp3');
      // Try to play/pause to pre-load
      audioRef.current.play().then(() => {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setAudioEnabled(true);
      }).catch(err => {
        console.log("Audio initialization failed", err);
        setAudioEnabled(false);
      });
    } else {
      setAudioEnabled(true);
    }
  };

  // Auto-scroll to the latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!userName) {
      navigate('/');
      return;
    }

    const fetchRoomAndMessages = async () => {
      try {
        // Fetch room data
        const { data: roomData, error: roomError } = await supabase
          .from('chat_rooms')
          .select('name')
          .eq('id', roomId)
          .single();

        if (roomError || !roomData) {
          throw roomError || new Error('Room not found');
        }
        setRoomName(roomData.name);

        // Fetch messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .eq('chat_room_id', roomId)
          .order('created_at', { ascending: true });

        if (messagesError) throw messagesError;
        setMessages(messagesData);
      } catch (error) {
        console.error('Error:', error);
        navigate('/');
      }
    };

    fetchRoomAndMessages();

    // Set up real-time subscription
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log('New message received:', payload);
          setMessages((prev) => [...prev, payload.new]);
          
          // Play sound if audio is enabled and message isn't from current user
          if (payload.new.user_name !== userName && audioEnabled && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch((err) => {
              console.error('Error playing sound:', err);
              setAudioEnabled(false);
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, userName, navigate, audioEnabled]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const { error } = await supabase.from('messages').insert({
        chat_room_id: roomId,
        user_name: userName,
        content: newMessage,
      });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="chat-room-container">
      <div className="chat-header">
        <h1>{roomName} (Room ID: {roomId})</h1>
        <div className="chat-controls">
          {!audioEnabled && (
            <button onClick={enableAudio} className="enable-audio-btn">
              Enable Sounds
            </button>
          )}
          <button onClick={() => navigate('/')}>Leave Room</button>
        </div>
      </div>
      <div className="messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message ${msg.user_name === userName ? 'message-self' : 'message-other'}`}
          >
            <strong>{msg.user_name}:</strong> {msg.content}
            <span className="timestamp">
              {new Date(msg.created_at).toLocaleTimeString()}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="message-input">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
}

export default ChatRoom;