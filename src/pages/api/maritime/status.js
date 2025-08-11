// Maritime system status API for dashboard preview

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Simulated maritime system status
    const maritimeStatus = {
      lastUpdate: new Date().toISOString(),
      aisStreamStatus: {
        apiStatus: "Online",
        websocketStatus: "Operational",
        connectionCount: Math.floor(Math.random() * 10) + 1,
        messagesPerSecond: Math.floor(Math.random() * 50) + 100,
        uptime: "99.9%"
      },
      trackingStats: {
        totalVesselsTracked: Math.floor(Math.random() * 1000) + 5000,
        activeConnections: Math.floor(Math.random() * 5) + 1,
        messageCount: Math.floor(Math.random() * 10000) + 50000,
        averageLatency: "45ms",
        dataQuality: "Excellent"
      },
      coverage: {
        globalCoverage: "95.2%",
        majorPorts: [
          { name: "Singapore", status: "Active", vessels: 234 },
          { name: "Los Angeles", status: "Active", vessels: 189 },
          { name: "Rotterdam", status: "Active", vessels: 156 },
          { name: "Shanghai", status: "Active", vessels: 298 },
          { name: "Hamburg", status: "Active", vessels: 78 }
        ]
      },
      alerts: [
        {
          type: "info",
          message: "High traffic detected in Singapore Strait",
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        },
        {
          type: "success", 
          message: "New AIS station online in Mediterranean",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        }
      ]
    };

    return res.status(200).json({
      success: true,
      data: maritimeStatus,
      message: 'Maritime status retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching maritime status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch maritime status',
      error: error.message
    });
  }
}
