import type { Room } from '../types';
import './RoomCard.css';

interface RoomCardProps {
  room: Room;
  onClick: () => void;
}

export default function RoomCard({ room, onClick }: RoomCardProps) {
  const date = new Date(room.createAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="room-card" id={`room-${room.id}`}>
      <div className="room-card-preview">
        <span className="room-card-icon">◇</span>
      </div>
      <div className="room-card-info">
        <h3 className="room-card-name">{room.slug}</h3>
        <p className="room-card-meta">
          {room.admin?.name || 'Unknown'} · {date}
        </p>
        <button className="room-join-btn" onClick={onClick}>
          Join Room →
        </button>
      </div>
    </div>
  );
}
