// import React, { useState, useEffect, useRef } from "react";
// import { Link, useLocation } from "react-router-dom";
// import './Header.css';

// function Header() {
//   const [isDropdownOpen, setIsDropdownOpen] = useState(false);
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
//   const dropdownRef = useRef(null);
//   const buttonRef = useRef(null);
//   const mobileMenuRef = useRef(null);
//   const mobileButtonRef = useRef(null);
//   const location = useLocation();

//   useEffect(() => {
//     function handleClickOutside(event) {
//       if (
//         dropdownRef.current && 
//         !dropdownRef.current.contains(event.target) &&
//         buttonRef.current && 
//         !buttonRef.current.contains(event.target)
//       ) {
//         setIsDropdownOpen(false);
//       }
      
//       if (
//         mobileMenuRef.current && 
//         !mobileMenuRef.current.contains(event.target) &&
//         mobileButtonRef.current && 
//         !mobileButtonRef.current.contains(event.target) &&
//         isMobileMenuOpen
//       ) {
//         setIsMobileMenuOpen(false);
//       }
//     }
    
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, [isMobileMenuOpen]);

//   useEffect(() => {
//     setIsDropdownOpen(false);
//     setIsMobileMenuOpen(false);
//   }, [location]);

//   const navItems = [
//     { path: "/home", label: "Home" },
//     { path: "/chatbot", label: "AI Chatbot" },
//     { path: "/router", label: "Router" }
//   ];

//   const dropdownItems = [
//     { path: "/inventory", label: "Inventory Management" },
//     { path: "/dispensaries", label: "Dispensary Locations" },
//     { path: "/orders", label: "Order Tracking" },
//     { path: "/analytics", label: "Analytics Dashboard" }
//   ];

//   const isActive = (path) => {
//     return location.pathname === path;
//   };

//   return (
//     <header className="header" role="banner">
//       <div className="container">
//         <Link to="/" className="logo" aria-label="MediGramin Home">
//           <span className="logo-text">MediGramin</span>
//         </Link>

//         <button
//           ref={mobileButtonRef}
//           className="mobile-menu-button"
//           onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
//           aria-expanded={isMobileMenuOpen}
//           aria-controls="mobile-menu"
//           aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
//         >
//           <svg 
//             className="menu-icon" 
//             fill="none" 
//             viewBox="0 0 24 24" 
//             stroke="currentColor"
//             aria-hidden="true"
//           >
//             {isMobileMenuOpen ? (
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//             ) : (
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
//             )}
//           </svg>
//         </button>

//         <nav 
//           className={`nav ${isMobileMenuOpen ? 'mobile-open' : ''}`} 
//           ref={mobileMenuRef}
//           id="mobile-menu"
//           aria-label="Main Navigation"
//         >
//           <ul className="nav-list">
//             {navItems.map((item) => (
//               <li key={item.path} className="nav-item">
//                 <Link 
//                   to={item.path} 
//                   className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
//                   aria-current={isActive(item.path) ? "page" : undefined}
//                 >
//                   {item.label}
//                 </Link>
//               </li>
//             ))}
            
//             <li className="nav-item dropdown">
//               <button
//                 ref={buttonRef}
//                 onClick={() => setIsDropdownOpen(!isDropdownOpen)}
//                 className={`dropdown-button ${
//                   location.pathname.startsWith('/inventory') || 
//                   location.pathname.startsWith('/dispensaries') || 
//                   location.pathname.startsWith('/orders') || 
//                   location.pathname.startsWith('/analytics') ? 'active' : ''
//                 }`}
//                 aria-expanded={isDropdownOpen}
//                 aria-haspopup="true"
//                 aria-controls="dashboard-menu"
//               >
//                 Dashboard
//                 <svg 
//                   className={`dropdown-arrow ${isDropdownOpen ? 'rotate' : ''}`} 
//                   fill="none" 
//                   viewBox="0 0 24 24" 
//                   stroke="currentColor"
//                   width="16"
//                   height="16"
//                   aria-hidden="true"
//                 >
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//                 </svg>
//               </button>

//               <div
//                 id="dashboard-menu"
//                 ref={dropdownRef}
//                 className={`dropdown-menu ${isDropdownOpen ? 'active' : ''}`}
//                 role="menu"
//               >
//                 <div className="dropdown-content">
//                   {dropdownItems.map((item) => (
//                     <Link 
//                       key={item.path}
//                       to={item.path} 
//                       className={`dropdown-item ${isActive(item.path) ? 'active' : ''}`}
//                       role="menuitem"
//                       aria-current={isActive(item.path) ? "page" : undefined}
//                     >
//                       {item.label}
//                     </Link>
//                   ))}
//                 </div>
//               </div>
//             </li>
//           </ul>

//           <Link to="/account" className="account-button">
//             <span>My</span>
//             <span>Account</span>
//           </Link>
//         </nav>
//       </div>
//     </header>
//   );
// }

// export default Header;


import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import './Header.css';

function Header() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAppointmentDropdownOpen, setIsAppointmentDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const appointmentDropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const appointmentButtonRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const mobileButtonRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    function handleClickOutside(event) {
      // Existing dropdown close logic
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current && 
        !buttonRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }

      // Appointment dropdown close logic
      if (
        appointmentDropdownRef.current && 
        !appointmentDropdownRef.current.contains(event.target) &&
        appointmentButtonRef.current && 
        !appointmentButtonRef.current.contains(event.target)
      ) {
        setIsAppointmentDropdownOpen(false);
      }
      
      // Mobile menu close logic
      if (
        mobileMenuRef.current && 
        !mobileMenuRef.current.contains(event.target) &&
        mobileButtonRef.current && 
        !mobileButtonRef.current.contains(event.target) &&
        isMobileMenuOpen
      ) {
        setIsMobileMenuOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    setIsDropdownOpen(false);
    setIsAppointmentDropdownOpen(false);
    setIsMobileMenuOpen(false);
  }, [location]);

  const navItems = [
    { path: "/home", label: "Home" },
    { path: "/chatbot", label: "AI Chatbot" },
    { path: "/router", label: "Router" }
  ];

  const dropdownItems = [
    { path: "/inventory", label: "Inventory Management" },
    { path: "/dispensaries", label: "Dispensary Locations" },
    { path: "/orders", label: "Order Tracking" },
    { path: "/analytics", label: "Analytics Dashboard" }
  ];

  const appointmentItems = [
    { path: "/doctors", label: "Book Appointment" },
    { path: "/appointments", label: "My Appointments" }
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="header" role="banner">
      <div className="container">
        <Link to="/" className="logo" aria-label="MediGramin Home">
          <span className="logo-text">MediGramin</span>
        </Link>

        <button
          ref={mobileButtonRef}
          className="mobile-menu-button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-menu"
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        >
          <svg 
            className="menu-icon" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            aria-hidden="true"
          >
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        <nav 
          className={`nav ${isMobileMenuOpen ? 'mobile-open' : ''}`} 
          ref={mobileMenuRef}
          id="mobile-menu"
          aria-label="Main Navigation"
        >
          <ul className="nav-list">
            {navItems.map((item) => (
              <li key={item.path} className="nav-item">
                <Link 
                  to={item.path} 
                  className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                  aria-current={isActive(item.path) ? "page" : undefined}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            
            {/* Appointments Dropdown */}
            <li className="nav-item dropdown">
              <button
                ref={appointmentButtonRef}
                onClick={() => setIsAppointmentDropdownOpen(!isAppointmentDropdownOpen)}
                className={`dropdown-button ${
                  location.pathname.startsWith('/doctors') || 
                  location.pathname.startsWith('/appointments') ? 'active' : ''
                }`}
                aria-expanded={isAppointmentDropdownOpen}
                aria-haspopup="true"
                aria-controls="appointments-menu"
              >
                Appointments
                <svg 
                  className={`dropdown-arrow ${isAppointmentDropdownOpen ? 'rotate' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  width="16"
                  height="16"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div
                id="appointments-menu"
                ref={appointmentDropdownRef}
                className={`dropdown-menu ${isAppointmentDropdownOpen ? 'active' : ''}`}
                role="menu"
              >
                <div className="dropdown-content">
                  {appointmentItems.map((item) => (
                    <Link 
                      key={item.path}
                      to={item.path} 
                      className={`dropdown-item ${isActive(item.path) ? 'active' : ''}`}
                      role="menuitem"
                      aria-current={isActive(item.path) ? "page" : undefined}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </li>
            
            {/* Existing Dashboard Dropdown */}
            <li className="nav-item dropdown">
              <button
                ref={buttonRef}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`dropdown-button ${
                  location.pathname.startsWith('/inventory') || 
                  location.pathname.startsWith('/dispensaries') || 
                  location.pathname.startsWith('/orders') || 
                  location.pathname.startsWith('/analytics') ? 'active' : ''
                }`}
                aria-expanded={isDropdownOpen}
                aria-haspopup="true"
                aria-controls="dashboard-menu"
              >
                Inventory
                <svg 
                  className={`dropdown-arrow ${isDropdownOpen ? 'rotate' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  width="16"
                  height="16"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div
                id="dashboard-menu"
                ref={dropdownRef}
                className={`dropdown-menu ${isDropdownOpen ? 'active' : ''}`}
                role="menu"
              >
                <div className="dropdown-content">
                  {dropdownItems.map((item) => (
                    <Link 
                      key={item.path}
                      to={item.path} 
                      className={`dropdown-item ${isActive(item.path) ? 'active' : ''}`}
                      role="menuitem"
                      aria-current={isActive(item.path) ? "page" : undefined}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </li>
          </ul>

          <Link to="/account" className="account-button">
            <span>My</span>
            <span>Account</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;