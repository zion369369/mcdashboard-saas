// This API endpoint simulates real-time weather status updates
// In a production app, you'd integrate with PAGASA's official data sources

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Simulated weather status data
    const weatherStatus = {
      lastUpdate: new Date().toISOString(),
      activeCyclones: [
        {
          name: "Sample Typhoon",
          status: "Active",
          location: "East of Northern Luzon",
          maxWinds: "120 km/h",
          signalAreas: {
            "1": 15,
            "2": 8,
            "3": 3,
            "4": 0
          },
          nextUpdate: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString() // 3 hours from now
        }
      ],
      totalAreasAffected: 26,
      parserStats: {
        successfulParses: Math.floor(Math.random() * 100) + 50,
        failedParses: Math.floor(Math.random() * 5),
        averageParseTime: "2.3ms",
        lastParsedBulletin: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minutes ago
      },
      systemHealth: {
        apiStatus: "Online",
        parserStatus: "Operational",
        pdfParserStatus: "Operational",
        uptime: "99.8%"
      }
    };

    return res.status(200).json({
      success: true,
      data: weatherStatus,
      message: 'Weather status retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching weather status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch weather status',
      error: error.message
    });
  }
}
