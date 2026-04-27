import type { Room } from '../types';
import './RoomCard.css';

interface RoomCardProps {
  room: Room;
  onClick: () => void;
  onDelete: (roomId: number) => void;
}

export default function RoomCard({ room, onClick, onDelete }: RoomCardProps) {
  const date = new Date(room.createAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete room "${room.slug}"? This cannot be undone.`)) {
      onDelete(room.id);
    }
  };

  return (
    <div className="room-card" id={`room-${room.id}`}>
      <div className="room-card-preview">
        <span className="room-card-icon">◇</span>
      </div>
      <div className="room-card-info">
        <div className="room-card-header">
          <h3 className="room-card-name">{room.slug}</h3>
          <button
            className="room-delete-btn"
            onClick={handleDelete}
            title="Delete room"
            id={`delete-room-${room.id}`}
            aria-label={`Delete room ${room.slug}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>
        </div>
        <p className="room-card-meta">
          {room.admin?.name || 'Unknown'} · {date}
        </p>
        <button className="room-join-btn" onClick={onClick}>
          Open Room →
        </button>
      </div>
    </div>
  );
}
