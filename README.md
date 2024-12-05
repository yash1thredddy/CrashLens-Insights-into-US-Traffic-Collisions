# US Traffic Accidents Visualization Dashboard

A comprehensive web application for visualizing and analyzing traffic accident data across the United States. Built with React, Flask, and PostgreSQL, featuring interactive maps, detailed state/county analysis, and temporal data visualization.

## 🚀 Features

- **Interactive Map Visualization**
  - National overview with state-level drill-down
  - Multiple visualization types (hexagon, heatmap)
  - Real-time data filtering and analysis
  - County-level detailed statistics

- **Advanced Analytics**
  - Temporal analysis with customizable time ranges
  - Severity and accident density visualization
  - Weather condition correlation
  - City and street-level accident analysis

- **Rich User Interface**
  - Responsive design with dark theme
  - Interactive charts and graphs
  - Draggable and resizable components
  - Custom tooltips and legends

## 🛠️ Technology Stack

### Frontend
- React
- Material-UI
- deck.gl for map visualization
- Mapbox GL
- Leaflet
- Recharts for data visualization
- D3.js for custom charts

### Backend
- Flask
- PostgreSQL
- SQLAlchemy
- Flask-CORS

## 📋 Prerequisites

- Node.js (v14 or higher)
- Python 3.8+
- PostgreSQL 12+
- Mapbox API key

## 🔧 Installation

### Backend Setup

1. Create a virtual environment and activate it:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Configure PostgreSQL:
- Create a database named `accidents_db`
- Update database credentials in `config.py`

### Frontend Setup

1. Install Node.js dependencies:
```bash
npm install
```

2. Configure environment variables:
- Create `.env` file in the root directory
- Add your Mapbox token:
```
REACT_APP_MAPBOX_TOKEN=your_mapbox_token_here
```

## 🚀 Running the Application

1. Start the Flask backend:
```bash
python run.py
```

2. Start the React frontend (in a separate terminal):
```bash
npm start
```

The application will be available at `http://localhost:3000`

## 🔍 Project Structure

```
project/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── map/
│   │   │   ├── filters/
│   │   │   └── charts/
│   │   ├── constants/
│   │   └── services/
│   └── public/
├── backend/
│   ├── api/
│   │   ├── routes/
│   │   └── utils/
│   ├── config/
│   └── run.py
└── requirements.txt
```

## 🔐 API Endpoints

### Spatial Data
- `GET /api/spatial/map-data`: Get accident data for map visualization
- `GET /api/spatial/top-accidents`: Get top accident statistics
- `GET /api/spatial/states`: Get list of available states

### State/County Data
- `GET /api/state/details`: Get detailed state-level statistics
- `GET /api/county/time-analysis`: Get temporal analysis for counties

## 🎨 Visualization Types

1. **Hexagon Layer**
   - 3D visualization of accident density
   - Configurable height scale and radius
   - Color-coded by severity or count

2. **Heatmap Layer**
   - 2D density visualization
   - Adjustable intensity and radius
   - Smooth gradient coloring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the [MIT License + Commons Clause](LICENSE), which restricts commercial use.

## 👥 Authors

- **Yashwanth Reddy Dasari Reddy**
- **Adithya Reddy Chidirala**
- **Hemanth Srinivas Reddy Chennur**

## 🙏 Acknowledgments

- US Traffic Accident Dataset
- Mapbox for mapping services
- deck.gl team for visualization tools
- Material-UI team for UI components
