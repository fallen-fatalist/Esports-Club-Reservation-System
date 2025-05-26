import React, { useState } from "react";
import { ReactComponent as ComputerIcon } from '../../images/computer.svg';
import MyButton from "../UI/button/MyButton/MyButton";
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';

const groupByRoom = (computers, selectedRoom = null) => {
  const roomOrder = ['Standard', 'VIP', 'Console'];

  const grouped = computers.reduce((acc, comp) => {
    const room = comp.room || 'Unknown';
    if (!acc[room]) acc[room] = [];
    acc[room].push(comp);
    return acc;
  }, {});

  const sortedGrouped = {};

  if (selectedRoom && grouped[selectedRoom]) {
    sortedGrouped[selectedRoom] = grouped[selectedRoom];
  }

  roomOrder.forEach(room => {
    if (grouped[room] && room !== selectedRoom) {
      sortedGrouped[room] = grouped[room];
    }
  });

  Object.keys(grouped).forEach(room => {
    if (!roomOrder.includes(room) && room !== selectedRoom) {
      sortedGrouped[room] = grouped[room];
    }
  });

  return sortedGrouped;
};

const getRoomDisplayName = (room) => ({
  'Standard': 'Standard Hall',
  'VIP': 'VIP Hall',
  'Console': 'Console Hall'
}[room] || room);

const getRoomClass = (room) => ({
  'Standard': 'standard-room',
  'VIP': 'vip-room',
  'Console': 'console-room'
}[room] || 'default-room');

const isPS5 = (comp) => {
  return comp.type === 'ps5' || 
         comp.name?.toLowerCase().includes('ps5') || 
         comp.model?.toLowerCase().includes('ps5') ||
         comp.room === 'Console';
};

const ComputerCard = ({ comp, selectedComputers, onComputerClick, onViewDetails, onBook, isAuthenticated }) => {
  const itemIsPS5 = isPS5(comp);

  return (
    <div
      className={`computer-card ${comp.status || 'available'} ${
        selectedComputers.includes(comp.id) ? 'selected' : ''
      } ${itemIsPS5 ? 'ps5-card' : ''}`}
      onClick={() => isAuthenticated ? onComputerClick(comp.id) : null}
      style={{ cursor: isAuthenticated && comp.status === 'available' ? 'pointer' : 'default' }}
    >
      <div className="computer-header">
        {!itemIsPS5 && (
          <ComputerIcon className={`computer-icon ${comp.status === 'busy' ? 'busy' : ''}`} />
        )}
        <span className="computer-number">
          {itemIsPS5 ? (
            <>
              <SportsEsportsIcon className={`ps5-icon ${comp.status === 'busy' ? 'busy' : ''}`} />
              №{comp.id}
            </>
          ) : (
            `№${comp.id}`
          )}
        </span>
      </div>

      {itemIsPS5 ? (
        <div className="ps5-info">
          {comp.description && (
            <div className="ps5-description">{comp.description}</div>
          )}
        </div>
      ) : (
        <div className="computer-specs">
          <div className="spec-item"><span>CPU:</span> {comp.cpu || 'N/A'}</div>
          <div className="spec-item"><span>GPU:</span> {comp.gpu || 'N/A'}</div>
          <div className="spec-item"><span>RAM:</span> {comp.ram || 'N/A'}</div>
        </div>
      )}

      <div className="computer-actions">
        <button className="details-button" onClick={(e) => {
          e.stopPropagation(); 
          onViewDetails(comp.id);
        }}>
          <span className="btn-txt">Details</span>
        </button>
        {comp.status === 'available' && isAuthenticated && (
          <MyButton className="book-button" onClick={(e) => {
            e.stopPropagation();
            onBook(comp.id);
          }}>
            <span className="btn-txt">Book</span>
          </MyButton>
        )}
      </div>

      <div className="computer-status">
        {comp.status?.trim() ? (
          comp.status === 'busy' ? (
            <span className="busy-status">Busy</span>
          ) : (
            <span className="available-status">Available</span>
          )
        ) : (
          <span className="na-status">N/A</span>
        )}
      </div>
    </div>
  );
};

const ComputerList = ({
  computers,
  onComputerClick,
  onViewDetails,
  selectedComputers = [],
  onBook,
  selectedRoom = null,
  isAuthenticated = false
}) => {
  const groupedComputers = groupByRoom(computers, selectedRoom);
  const [collapsedRooms, setCollapsedRooms] = useState({});

  const toggleRoom = (room) => {
    setCollapsedRooms((prev) => ({
      ...prev,
      [room]: !prev[room]
    }));
  };

  return (
    <div className="icon__container">
      <h3>Select computer(s) to book</h3>

      {Object.keys(groupedComputers).map(room => (
        <div key={room} className={`room-section ${getRoomClass(room)} ${selectedRoom === room ? 'selected-room' : ''}`}>
          <div className="room-header" onClick={() => toggleRoom(room)} style={{ cursor: "pointer" }}>
            <h4 className="room-title">{getRoomDisplayName(room)}</h4>
            <span className="toggle-icon">
              {collapsedRooms[room] ? '▼' : '▲'}
            </span>
          </div>

          {!collapsedRooms[room] && (
            <div className="computer-grid">
              {groupedComputers[room].map(comp => (
                <ComputerCard
                  key={comp.id}
                  comp={comp}
                  selectedComputers={selectedComputers}
                  onComputerClick={onComputerClick}
                  onViewDetails={onViewDetails}
                  onBook={onBook}
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </div>
          )}
        </div>
      ))}

      {Object.keys(groupedComputers).length === 0 && (
        <div className="no-computers">
          <p>No computers available</p>
        </div>
      )}
    </div>
  );
};

export default ComputerList;
