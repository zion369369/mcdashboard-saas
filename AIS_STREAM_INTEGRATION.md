# AIS Stream Maritime Tracking Integration

This application integrates **AIS Stream** maritime data API to provide real-time vessel tracking and monitoring capabilities. AIS (Automatic Identification System) data provides comprehensive information about ship positions, movements, and voyage details worldwide.

## 🚢 Features

### Real-time Vessel Tracking
- Live ship position updates via WebSocket
- Speed, course, and navigational status
- MMSI (Maritime Mobile Service Identity) filtering
- Global coverage with customizable geographic areas

### Geographic Coverage
- **Worldwide tracking** with customizable bounding boxes
- **Predefined areas**: Miami, Los Angeles, Philippines, Singapore, Suez Canal
- **Custom areas**: Define your own lat/lng boundaries
- **Port monitoring**: Major international ports coverage

### Message Filtering
- **Position Reports**: Real-time location updates
- **Ship and Voyage Data**: Vessel details and destination
- **Base Station Reports**: Shore-based AIS information
- **MMSI Filtering**: Track specific vessels by their unique identifier

## 🔧 Technical Implementation

### Backend WebSocket Management
- Secure API key handling (never exposed to browser)
- Connection pooling and management
- Message buffering and rate limiting
- Automatic reconnection handling

### Frontend Real-time Dashboard
- Live message streaming display
- Interactive area selection
- Connection status monitoring
- Performance metrics and statistics

## 📡 API Endpoints

### AIS Stream Connection Management
```
POST /api/maritime/ais-stream
```

**Actions:**
- `connect` - Establish WebSocket connection
- `disconnect` - Close connection
- `updateSubscription` - Modify tracking parameters
- `getStatus` - Retrieve connection status and recent messages

**Example Connection:**
```javascript
const response = await fetch('/api/maritime/ais-stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'connect',
    aisApiKey: 'your-api-key',
    subscriptionConfig: {
      BoundingBoxes: [[[-90, -180], [90, 180]]], // Worldwide
      FilterMessageTypes: ['PositionReport'],
      FiltersShipMMSI: ['368207620', '367719770'] // Optional
    }
  })
});
```

### Maritime System Status
```
GET /api/maritime/status
```

Returns system health, tracking statistics, and coverage information.

## 🌍 Geographic Configuration

### Bounding Box Format
```javascript
BoundingBoxes: [
  [[lat1, lng1], [lat2, lng2]], // Area 1
  [[lat3, lng3], [lat4, lng4]]  // Area 2 (optional)
]
```

**Coordinate System:**
- **Latitude**: -90.0 to 90.0 (South to North)
- **Longitude**: -180.0 to 180.0 (West to East)

### Predefined Coverage Areas
```javascript
const areas = {
  worldwide: [[[-90, -180], [90, 180]]],
  miami: [[[25.602700, -80.207729], [25.835302, -79.879297]]],
  losAngeles: [[[33.673490, -118.356139], [33.772292, -118.095731]]],
  philippines: [[[4.5, 114.0], [21.0, 127.0]]],
  singapore: [[[1.1, 103.5], [1.5, 104.1]]],
  suez: [[[29.5, 32.0], [30.5, 33.0]]]
};
```

## 📊 Message Types and Data Structure

### Position Report Message
```javascript
{
  "MessageType": "PositionReport",
  "Metadata": {
    "Latitude": 25.7617,
    "Longitude": -80.1918
  },
  "Message": {
    "PositionReport": {
      "UserID": 368207620,        // MMSI
      "Latitude": 25.7617,
      "Longitude": -80.1918,
      "SpeedOverGround": 12.3,    // knots
      "CourseOverGround": 45.2,   // degrees
      "NavigationalStatus": 0,     // 0 = Under way using engine
      "TrueHeading": 46,          // degrees
      "Timestamp": 22             // UTC second when report was generated
    }
  }
}
```

### Ship and Voyage Data Message
```javascript
{
  "MessageType": "ShipAndVoyageData",
  "Message": {
    "ShipAndVoyageData": {
      "UserID": 368207620,
      "ShipName": "VESSEL NAME",
      "CallSign": "WDD1234",
      "VesselType": 70,           // Cargo ship
      "Destination": "MIAMI",
      "ETA": "12161200",          // MMDDHHmm format
      "MaximumStaticDraught": 85, // 0.1 meter units
      "DimensionToBow": 120,      // meters
      "DimensionToStern": 20      // meters
    }
  }
}
```

## 🚨 Security and Best Practices

### API Key Protection
- **Never expose API keys in browser**: All WebSocket connections handled server-side
- **Environment variables**: Store keys securely in `.env.local`
- **Rate limiting**: Automatic throttling at user and API key level
- **Connection monitoring**: Track usage and detect anomalies

### Performance Optimization
- **Message buffering**: Store only recent messages to prevent memory issues
- **Connection pooling**: Reuse connections efficiently
- **Selective filtering**: Use MMSI and message type filters to reduce data volume
- **Geographic focus**: Limit tracking to relevant areas only

## 🎯 Use Cases

### Maritime Operations
- **Port management**: Monitor vessel arrivals and departures
- **Supply chain tracking**: Track cargo ship movements
- **Maritime security**: Monitor vessel behavior in sensitive areas
- **Search and rescue**: Real-time position data for emergency response

### Business Intelligence
- **Shipping analytics**: Analyze trade routes and vessel patterns
- **Market research**: Monitor competitor vessel movements
- **Logistics optimization**: Optimize shipping schedules and routes
- **Environmental monitoring**: Track vessel emissions and compliance

## 🔗 Integration with Weather Data

Combined with the PAGASA weather parser, this creates a comprehensive maritime intelligence platform:

- **Weather-aware tracking**: Correlate vessel positions with weather conditions
- **Storm avoidance**: Monitor ship movements during severe weather
- **Route optimization**: Use weather data to predict optimal shipping routes
- **Safety analysis**: Analyze vessel behavior in various weather conditions

## 📈 Dashboard Features

### Real-time Monitoring
- Live vessel position updates
- Connection status indicators
- Message rate and latency metrics
- System health monitoring

### Interactive Controls
- Geographic area selection
- MMSI-based vessel filtering
- Message type filtering
- Connection management

### Data Visualization
- Recent messages display
- Vessel tracking statistics
- Coverage area visualization
- Performance metrics

## 🚀 Getting Started

1. **Get AIS Stream API Key**: Sign up at [aisstream.io](https://aisstream.io)
2. **Configure Environment**: Add API key to `.env.local`
3. **Access Maritime Dashboard**: Navigate to `/maritime`
4. **Connect and Track**: Enter API key and start tracking vessels

## 📝 API Rate Limits and Quotas

AIS Stream provides different tiers:
- **Free tier**: Limited connections and message rate
- **Pro tier**: Higher throughput and multiple concurrent connections
- **Enterprise**: Custom limits and dedicated support

**Important**: Monitor your usage to avoid quota exceeded errors.

## 🔧 Development and Testing

### Local Development
```bash
# Install dependencies
npm install ws uuid

# Start development server
npm run dev

# Access maritime dashboard
http://localhost:3000/maritime
```

### Testing Connection
1. Enter valid AIS Stream API key
2. Select geographic area (start with a smaller area like Miami)
3. Connect and monitor message flow
4. Verify WebSocket connection stability

This integration provides a production-ready foundation for maritime tracking applications, with proper error handling, security measures, and scalable architecture.
