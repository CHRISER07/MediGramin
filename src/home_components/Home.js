import React from 'react';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Healthcare Without Boundaries</h1>
          <p>MediGramin connects remote villages with essential medical services through AI-powered solutions, bringing quality healthcare to underserved communities.</p>
          <button className="cta-button">Learn How We Help</button>
        </div>
      </section>

      {/* Challenges Section */}
      <section className="challenges-section">
        <h2>Healthcare Challenges in Remote Areas</h2>
        <div className="challenges-grid">
          <div className="challenge-card">
            <div className="icon">❤️</div>
            <h3>Limited Access</h3>
            <p>Geographic barriers prevent timely access to essential healthcare services</p>
          </div>
          <div className="challenge-card">
            <div className="icon">💊</div>
            <h3>Medicine Shortages</h3>
            <p>Inconsistent supply chains lead to critical medication shortages</p>
          </div>
          <div className="challenge-card">
            <div className="icon">👨‍⚕️</div>
            <h3>Specialist Scarcity</h3>
            <p>Lack of specialized medical professionals in rural and remote areas</p>
          </div>
          <div className="challenge-card">
            <div className="icon">🚑</div>
            <h3>Emergency Response</h3>
            <p>Delayed emergency services due to infrastructure and distance challenges</p>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="solutions-section">
        <h2>Our Innovative Solutions</h2>
        <div className="solutions-container">
          <div className="solution-item">
            <div className="solution-image mobile-health"></div>
            <div className="solution-content">
              <h3>Mobile Health Units</h3>
              <p>Fully-equipped medical vans bringing healthcare directly to remote villages on scheduled routes</p>
            </div>
          </div>
          
          <div className="solution-item reverse">
            <div className="solution-content">
              <h3>Telemedicine Clinics</h3>
              <p>Virtual consultations connecting village residents with specialists from urban medical centers</p>
            </div>
            <div className="solution-image telemedicine"></div>
          </div>
          
          <div className="solution-item">
            <div className="solution-image dispensary"></div>
            <div className="solution-content">
              <h3>Central Dispensaries</h3>
              <p>Strategic medicine distribution points ensuring continuous supply of essential medications</p>
            </div>
          </div>
        </div>
      </section>

      {/* AI-Powered Features */}
      <section className="ai-features-section">
        <h2>AI-Powered Healthcare Solutions</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="icon">📊</div>
            <h3>Smart Inventory Management</h3>
            <p>AI-based forecasting ensures critical medicines are always in stock</p>
          </div>
          <div className="feature-card">
            <div className="icon">🤖</div>
            <h3>AI Health Assistants</h3>
            <p>24/7 symptom assessment and health guidance via chatbots</p>
          </div>
          <div className="feature-card">
            <div className="icon">📅</div>
            <h3>Intelligent Scheduling</h3>
            <p>Optimized appointment systems reducing wait times and improving care</p>
          </div>
          <div className="feature-card">
            <div className="icon">🗺️</div>
            <h3>Route Optimization</h3>
            <p>AI algorithms determining the most efficient paths for mobile health units</p>
          </div>
        </div>
      </section>

      {/* Community & Impact Section */}
      <section className="impact-section">
        <h2>Our Impact</h2>
        <div className="stats-container">
          <div className="stat-item">
            <h3>250+</h3>
            <p>Villages Served</p>
          </div>
          <div className="stat-item">
            <h3>45,000+</h3>
            <p>Patients Treated</p>
          </div>
          <div className="stat-item">
            <h3>800+</h3>
            <p>Healthcare Workers Trained</p>
          </div>
          <div className="stat-item">
            <h3>98%</h3>
            <p>Patient Satisfaction</p>
          </div>
        </div>
        
        <div className="community-grid">
          <div className="community-card">
            <div className="icon">👨‍👩‍👧‍👦</div>
            <h3>Community Engagement</h3>
            <p>Working directly with village leaders to address specific health needs</p>
          </div>
          <div className="community-card">
            <div className="icon">🤝</div>
            <h3>Preventive Care</h3>
            <p>Focusing on prevention through health education and early intervention</p>
          </div>
          <div className="community-card">
            <div className="icon">🎓</div>
            <h3>Medical Training</h3>
            <p>Equipping local residents with basic healthcare skills and knowledge</p>
          </div>
          <div className="community-card">
            <div className="icon">🏥</div>
            <h3>Infrastructure Development</h3>
            <p>Building sustainable healthcare infrastructure for long-term impact</p>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta-section">
        <h2>Join Us in Making Healthcare Accessible</h2>
        <p>Whether you're a healthcare provider, technology partner, or supporter - there are many ways to contribute</p>
        
        <div className="cta-form-container">
          <form className="contact-form">
            <div className="form-group">
              <input type="text" placeholder="Your Name" required />
              <input type="email" placeholder="Email Address" required />
            </div>
            <div className="form-group">
              <select defaultValue="">
                <option value="" disabled>I'm interested in...</option>
                <option value="partnership">Partnership</option>
                <option value="donation">Making a Donation</option>
                <option value="volunteer">Volunteer Opportunities</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <textarea placeholder="Your Message" rows="4"></textarea>
            </div>
            <button type="submit" className="cta-button">Send Message</button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="partner-logos">
            <h4>Our Partners</h4>
            <div className="logos-container">
              <div className="partner-logo">Partner 1</div>
              <div className="partner-logo">Partner 2</div>
              <div className="partner-logo">Partner 3</div>
              <div className="partner-logo">Partner 4</div>
            </div>
          </div>
          
          <div className="social-links">
            <h4>Connect With Us</h4>
            <div className="social-icons">
              <a href="#" className="social-icon">FB</a>
              <a href="#" className="social-icon">TW</a>
              <a href="#" className="social-icon">IG</a>
              <a href="#" className="social-icon">LI</a>
            </div>
          </div>
        </div>
        
        <div className="copyright">
          <p>&copy; 2025 MediGramin. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;