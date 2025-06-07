import {useState, useEffect} from "react"
import packageService from "../services/packageService";
import { Link } from "react-router-dom";

const Main = (props) => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const data = await packageService.getPackages();
        setPackages(data);
      } catch (err) {
        console.error("Failed to fetch packages", err);
        setError("Failed to load packages");
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);


  const formatPrice = (price) => (price / 100).toFixed(2);

  const groupedPackages = packages.reduce((acc, pkg) => {
    if (!acc[pkg.room]) acc[pkg.room] = [];
    acc[pkg.room].push(pkg);
    return acc;
  }, {});

  return (
  <>
    <section className="hero">
      <div className="container">
        <div className="content">
          <h1>Book your perfect gaming spot instantly</h1>
          <p className="description">
            eReserve is the modern platform for fast and convenient booking of 
            computers and gaming consoles at any gaming club. Forget about queues 
            and occupied seats — choose, book, and play!
          </p>
            <div className="features">
              <div className="feature">
                <div className="feature-text">
                  <h3>Instant Booking</h3>
                  <p>Choose a club and book a spot in seconds</p>
                </div>
              </div>
              <div className="feature">
                <div className="feature-text">
                  <h3>Network of Clubs</h3>
                  <p>Access to hundreds of gaming clubs across the city</p>
                </div>
              </div>
              <div className="feature">
                <div className="feature-text">
                  <h3>Guaranteed Spot</h3>
                  <p>Your spot will always be ready at the scheduled time</p>
                </div>
              </div>
            </div>
          </div>
          <div className="visual">
            <div className="gaming-setup">
              <div className="monitor">
                <div className="screen">
                  <div className="game-interface">
                    <div className="health-bar"></div>
                    <div className="minimap"></div>
                    <div className="crosshair">+</div>
                  </div>
                </div>
                <div className="monitor-stand"></div>
              </div>
              <div className="keyboard"></div>
              <div className="mouse"></div>
              <div className="console">
                <div className="console-body"></div>
                <div className="controller"></div>
              </div>
            </div>
        </div>
      </div>
    </section>
    <section className="packages-section">
        <div className="packages-container">
          <div className="section-header">
            <h2>Choose Your Gaming Package</h2>
            <p>Select the perfect package for your gaming session</p>
          </div>

          {loading ? (
            <p>Loading packages...</p>
          ) : error ? (
            <p>{error}</p>
          ) : (
            <div className="room-categories">
              {Object.entries(groupedPackages).map(([roomType, roomPackages]) => (
                <div key={roomType} className="room-category">
                  <div className="room-header">
                    <h3>{roomType} Room</h3>
                  </div>

                  <div className="packages-grid">
                    {roomPackages.map((pkg) => (
                      <div key={pkg.id} className="package-card" data-room={roomType.toLowerCase()}>
                        <div className="package-header">
                          <div className="package-name">{pkg.name}</div>
                          <div className="package-duration">{pkg.duration}h</div>
                        </div>

                        <div className="package-price">
                          <span className="currency">$</span>
                          <span className="amount">{formatPrice(pkg.price)}</span>
                        </div>

                        <div className="package-details">
                          <div className="detail-item">
                            <span>{pkg.duration} {pkg.duration === 1 ? 'hour' : 'hours'}</span>
                          </div>
                          <div className="detail-item">
                            <span>{pkg.room} Room</span>
                          </div>
                        </div>

                        <Link to={`/booking?packageId=${pkg.id}`} className="package-btn">
                          Book Now
                        </Link>

                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
  </>
  )
};

export default Main;
