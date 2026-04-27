import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRooms, createRoom, joinRoom, deleteRoom } from '../utils/api';
import type { Room } from '../types';
import Navbar from '../components/Navbar';
import RoomCard from '../components/RoomCard';
import './Dashboard.css';

export default function Dashboard() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [slug, setSlug] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      const data = await getRooms();
      setRooms(data.rooms || []);
    } catch {
      setError('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!slug.trim() || slug.length < 4 || !password.trim()) {
      setError('Slug (min 4 chars) and Password are required');
      return;
    }
    setCreating(true);
    setError('');

    try {
      const data = await createRoom(slug.trim(), password.trim());
      if (data.room) {
        setRooms((prev) => [data.room, ...prev]);
        setSlug('');
        setPassword('');
        // Immediately join the newly created room
        navigate(`/canvas/${data.room.id}`, { state: { password: password.trim() } });
      } else {
        setError(data.message || 'Failed to create room');
      }
    } catch {
      setError('Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!slug.trim() || !password.trim()) {
      setError('Slug and Password are required to join');
      return;
    }
    setJoining(true);
    setError('');

    try {
      const data = await joinRoom(slug.trim(), password.trim());
      if (data.room) {
        navigate(`/canvas/${data.room.id}`, { state: { password: password.trim() } });
      } else {
        setError(data.message || 'Failed to join room. Check password.');
      }
    } catch {
      setError('Failed to join room. Check password or room name.');
    } finally {
      setJoining(false);
    }
  };

  const handleDelete = async (roomId: number) => {
    try {
      const data = await deleteRoom(roomId);
      if (data.message?.includes('deleted')) {
        setRooms((prev) => prev.filter((r) => r.id !== roomId));
      } else {
        setError(data.message || 'Failed to delete room');
      }
    } catch {
      setError('Failed to delete room');
    }
  };

  // For RoomCard clicking — requires a password prompt if they haven't entered it
  const handleRoomCardClick = (roomSlug: string) => {
    if (slug === roomSlug && password) {
      handleJoin();
    } else {
      setSlug(roomSlug);
      setPassword('');
      setError(`Entering room "${roomSlug}". Please enter its password and click Open.`);
      document.getElementById('room-password-input')?.focus();
    }
  };

  return (
    <div className="dashboard" id="dashboard-page">
      <Navbar />

      <div className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Your Rooms</h1>
            <p className="dashboard-subtitle">
              Manage your rooms or join someone else's room using their slug and password
            </p>
          </div>
        </header>

        {error && <div className="dashboard-error">{error}</div>}

        {/* Unified Room Form */}
        <div className="dashboard-actions">
          <div className="action-form">
            <h3 className="action-label">Create a new room or join an existing one</h3>
            <div className="action-row">
              <input
                type="text"
                className="form-input action-input"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="Room Slug (e.g., team-alpha)"
                maxLength={12}
              />
              <input
                id="room-password-input"
                type="password"
                className="form-input action-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Room Password"
              />
              <div className="action-buttons-group">
                <button
                  type="button"
                  className="btn btn-primary action-btn"
                  onClick={handleCreate}
                  disabled={creating || joining || slug.length < 4 || !password}
                  id="create-room-btn"
                >
                  {creating ? 'Creating...' : '+ Create'}
                </button>
                <button
                  type="button"
                  className="btn btn-glass action-btn"
                  onClick={handleJoin}
                  disabled={creating || joining || !slug || !password}
                  id="join-room-btn"
                >
                  {joining ? 'Joining...' : 'Join →'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Room grid */}
        {loading ? (
          <div className="dashboard-loading">
            <div className="spinner" />
            Loading rooms...
          </div>
        ) : rooms.length === 0 ? (
          <div className="dashboard-empty">
            <div className="empty-icon">◇</div>
            <h3>No rooms yet</h3>
            <p>Create your first room above, or join someone else's room using their slug and password.</p>
          </div>
        ) : (
          <>
            <h2 className="rooms-heading">Your Rooms</h2>
            <div className="rooms-grid" id="rooms-grid">
              {rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onClick={() => handleRoomCardClick(room.slug)}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
