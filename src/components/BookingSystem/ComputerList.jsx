import React from "react";
import { ReactComponent as ComputerIcon } from '../../images/computer.svg';

const ComputerList = ({ computers, onComputerClick, selectedComputers = [] }) => (
  <div className="icon__container">
    <h3>Select computer(s) to book</h3>
    <div className="computer-grid">
      {computers.map((comp) => (
        <div
          key={comp.id}
          className={`computer-card ${comp.status || 'available'} ${
            selectedComputers.includes(comp.id) ? 'selected' : ''
          }`}
          onClick={() => onComputerClick(comp.id)}
        >
          <div className="computer-header">
            <ComputerIcon className={`computer-icon ${comp.status === 'busy' ? 'busy' : ''}`} />
            <span className="computer-number">#{comp.id}</span>
          </div>
          <div className="computer-specs">
            <div className="spec-item">
              <span>CPU:</span> {comp.cpu || 'N/A'}
            </div>
            <div className="spec-item">
              <span>GPU:</span> {comp.gpu || 'N/A'}
            </div>
            <div className="spec-item">
              <span>RAM:</span> {comp.ram || 'N/A'}
            </div>
          </div>
          <div className="computer-status">
            {comp.status === 'busy' ? (
              <span className="busy-status">Busy</span>
            ) : (
              <span className="available-status">Available</span>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default ComputerList;