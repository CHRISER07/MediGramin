# Medical Inventory Management System

## Overview
Medical Inventory is a comprehensive web application for managing medical supplies and equipment inventory. Built with React and powered by a Flask backend, it provides real-time tracking, data visualization, and predictive analytics for healthcare facilities.

## Features
- Inventory tracking and management
- Interactive dashboards with Charts.js and Recharts
- Geographic visualization with Leaflet
- Predictive analytics using machine learning
- User-friendly notifications via React-Toastify
- Responsive design with Tailwind CSS

## Tech Stack
### Frontend
- React 19.0.0
- React Router 7.4.0
- Chart.js & React-Chartjs-2
- Recharts for data visualization
- Leaflet for maps
- Tailwind CSS for styling
- Lucide React for icons

### Backend
- Flask (Python)
- SQLite for database
- Pandas & NumPy for data processing
- Scikit-learn for predictive analytics
- AIXplain integration for advanced analytics

## Installation

### Prerequisites
- Node.js (v16 or higher)
- Python 3.8+
- pip

### Frontend Setup
1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/medical-inventory.git
   cd medical-inventory
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the development server
   ```bash
   npm start
   ```

### Backend Setup
1. Navigate to the backend directory
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows, use: venv\Scripts\activate
   ```

3. Install Python dependencies
   ```bash
   pip install -r requirements.txt
   ```

4. Start the Flask server
   ```bash
   flask run
   ```

## Usage
- Access the application at http://localhost:3000
- Log in with your credentials
- Navigate through the dashboard to manage inventory, view analytics, and generate reports

## Configuration
- Environment variables can be set in a `.env` file in the root directory
- Database configuration can be adjusted in the backend Flask application

## Development
### Scripts
- `npm start`: Start the development server
- `npm build`: Build the application for production
- `npm test`: Run tests
- `npm eject`: Eject from Create React App

### ESLint Configuration
This project uses the default ESLint configuration provided by Create React App.

## Browser Support
- Production: Browsers with >0.2% market share
- Development: Latest versions of Chrome, Firefox, and Safari

## License
This project is private and proprietary.

## Contact
For support or inquiries, please contact [your contact information].
