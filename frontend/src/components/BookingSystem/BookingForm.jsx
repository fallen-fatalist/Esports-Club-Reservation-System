import React, { useState, useEffect } from "react";
import Timedate from "../UI/date/Timedate/Timedate";
import MyTime from "../UI/date/MyTime/MyTime";
import MyDropdown from "../UI/dropdown/MyDropdown/MyDropdown";
import MyModal from "../UI/modal/MyModal";
import packageService from "../../services/packageService";

const BookingForm = ({
  date, setDate,
  time, setTime,
  selectedPackage, setSelectedPackage,
  errorMessage,
  infoMessage, bookingSuccess,
  selectedComputers, handleBookMultipleComputers,
  setSelectedComputers, handleAutoSelectComputers,
  autoSelectCountInput, setAutoSelectCountInput,
  availableComputersCount,
  currentRoom: initialRoom = "All",
  setCurrentRoom,
  authWarning,
  navigate,
  isAuthenticated = false 
}) => {
  const [packages, setPackages] = useState([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packagesError, setPackagesError] = useState(null);
  const [internalRoom, setInternalRoom] = useState(initialRoom);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState({ title: "", message: "", type: "" });

  const currentRoom = setCurrentRoom ? initialRoom : internalRoom;

  const showModal = (title, message, type = "info") => {
    setModalContent({ title, message, type });
    setModalVisible(true);
  };

  useEffect(() => {
    if (errorMessage) {
      showModal("Error", errorMessage, "error");
    }
  }, [errorMessage]);

  useEffect(() => {
    if (infoMessage) {
      showModal("Information", infoMessage, "info");
    }
  }, [infoMessage]);

  useEffect(() => {
    if (bookingSuccess) {
      showModal("Success", "Your computer has been booked successfully!", "success");
    }
  }, [bookingSuccess]);

  useEffect(() => {
    if (packagesError) {
      showModal("Error", packagesError, "error");
    }
  }, [packagesError]);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setPackagesLoading(true);
        const fetchedPackages = await packageService.getPackages();
        setPackages(fetchedPackages);

        if (selectedPackage) {
          const currentPackage = fetchedPackages.find(pkg => pkg.id === selectedPackage);
          if (currentRoom !== 'All' && (!currentPackage || currentPackage.room !== currentRoom)) {
            setSelectedPackage('');
          }
        }
      } catch (error) {
        console.error('Error fetching packages:', error);
        setPackagesError('Failed to load packages');
      } finally {
        setPackagesLoading(false);
      }
    };

    fetchPackages();
  }, [currentRoom, selectedPackage, setSelectedPackage]);

  const filteredPackages = currentRoom === 'All'
    ? packages
    : packages.filter(pkg => pkg.room === currentRoom);
  
  const availableRooms = ['All', ...new Set(packages.map(pkg => pkg.room))].sort();

  const parseValidCount = () => {
    const parsed = parseInt(autoSelectCountInput);
    if (isNaN(parsed) || parsed < 1) return 1;
    if (parsed > availableComputersCount) return availableComputersCount;
    return parsed;
  };

  const handleAutoSelectClick = () => {
    const count = parseValidCount();
    
    if (currentRoom === 'All' && selectedPackage) {
      const selectedPkg = packages.find(pkg => pkg.id === selectedPackage);
      if (selectedPkg && selectedPkg.room) {
        if (setCurrentRoom) {
          setCurrentRoom(selectedPkg.room);
        } else {
          setInternalRoom(selectedPkg.room);
        }
        setTimeout(() => {
          handleAutoSelectComputers(count, selectedPkg.room);
        }, 100);
        return;
      }
    }
    
    handleAutoSelectComputers(count);
  };

  const formatPackageOption = (pkg) => {
    if (currentRoom === 'All') {
      return `${pkg.name} (${pkg.room}) - ${pkg.duration}h - ${pkg.price}₸`;
    }
    return `${pkg.name} - ${pkg.duration}h - ${pkg.price}₸`;
  };

  const handleRoomChange = (newRoom) => {
    if (setCurrentRoom) {
      setCurrentRoom(newRoom);
    } else {
      setInternalRoom(newRoom);
    }
    setSelectedComputers([]);
    if (newRoom !== 'All') {
      setSelectedPackage('');
    }
  };

  const handlePackageChange = (packageId) => {
    setSelectedPackage(Number(packageId));
    
    if (currentRoom === 'All' && packageId) {
      const selectedPkg = packages.find(pkg => pkg.id === Number(packageId));
      if (selectedPkg && selectedPkg.room) {
        if (setCurrentRoom) {
          setCurrentRoom(selectedPkg.room);
        } else {
          setInternalRoom(selectedPkg.room);
        }
      }
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
  };

  const getTitleColor = (type) => {
    switch (type) {
      case "error":
        return "#d8000c";
      case "success":
        return "#28a745";
      case "info":
      default:
        return "#007bff";
    }
  };

  const getLoadingText = () => {
    if (currentRoom === 'All') {
      return "Loading all packages...";
    }
    return `Loading ${currentRoom} packages...`;
  };

  const getPackagePlaceholder = () => {
    if (currentRoom === 'All') {
      return "Select package (all rooms)";
    }
    return ""; 
  };

  return (
    <>
      <div className="reservation__container">
        <h3>PC Reservation</h3>
        <p>Select date and time</p>

        <div className="reservation__date">
          <Timedate value={date} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div className="time__duration">
          <div className="reservation__time">
            <MyTime value={time} onChange={(e) => setTime(e.target.value)} />
          </div>

          <div className="reservation__room">
            <MyDropdown value={currentRoom} onChange={(e) => handleRoomChange(e.target.value)}>
              {availableRooms.map((room) => (
                <option key={room} value={room}>
                  {room === 'All' ? 'All Rooms' : `${room} Room`}
                </option>
              ))}
            </MyDropdown>
          </div>

          <div className="reservation__duration">
            {packagesLoading ? (
              <MyDropdown disabled>
                <option>{getLoadingText()}</option>
              </MyDropdown>
            ) : packagesError ? (
              <MyDropdown disabled>
                <option>Error loading packages</option>
              </MyDropdown>
            ) : (
              <MyDropdown value={selectedPackage} onChange={(e) => handlePackageChange(e.target.value)}>
                {getPackagePlaceholder() && <option value="">{getPackagePlaceholder()}</option>}
                {filteredPackages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {formatPackageOption(pkg)}
                  </option>
                ))}
              </MyDropdown>
            )}
          </div>
        </div>

        {isAuthenticated && (
          <div className="auto-selection">
            <label htmlFor="autoSelectCount">Auto-select computers:</label>
            <input
              id="autoSelectCount"
              type="number"
              min="1"
              max={availableComputersCount}
              value={autoSelectCountInput}
              onChange={(e) => {
                const value = e.target.value;
                const parsed = parseInt(value);
                if (parsed > availableComputersCount) {
                  setAutoSelectCountInput(String(availableComputersCount));
                } else {
                  setAutoSelectCountInput(value);
                }
              }}
              onBlur={() => {
                const count = parseValidCount();
                setAutoSelectCountInput(String(count));
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAutoSelectClick();
                }
              }}
              className="auto-select-input"
            />
            <button className="auto-select-btn" onClick={handleAutoSelectClick}>
              <span className="btn-txt">Auto Select</span>
            </button>
          </div>
        )}
        
        {authWarning && (
          <div className="auth-warning">
            Please log in to book computers and access all features.
          </div>
        )}

        {isAuthenticated && selectedComputers.length > 0 && (
          <div className="computers__selection-actions">
            <span className="computers__selection-count">
              Selected computers: {selectedComputers.length}
            </span>
            <button className="book-multiple-button" onClick={handleBookMultipleComputers}>
              <span className="btn-txt">Book Selected</span>
            </button>
            <button className="clear-selection-button" onClick={() => setSelectedComputers([])}>
              <span className="btn-txt">Clear Selected</span>
            </button>
          </div>
        )}
      </div>

      <MyModal visible={modalVisible} setVisible={setModalVisible}>
        <div style={{ padding: "20px", textAlign: "center" }}>
          <h3 style={{ 
            color: getTitleColor(modalContent.type),
            marginBottom: "15px"
          }}>
            {modalContent.title}
          </h3>
          <p style={{ 
            marginBottom: "20px",
            fontSize: "16px",
            lineHeight: "1.5"
          }}>
            {modalContent.message}
          </p>
          <button className="auth-btn" onClick={handleModalClose}>
            OK
          </button>
        </div>
      </MyModal>
    </>
  );
};

export default BookingForm;