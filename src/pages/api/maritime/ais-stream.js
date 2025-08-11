import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';

// Store active connections
const activeConnections = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { action, connectionId, subscriptionConfig, aisApiKey } = req.body;

  try {
    switch (action) {
      case 'connect':
        return await handleConnect(req, res, subscriptionConfig, aisApiKey);
      
      case 'disconnect':
        return await handleDisconnect(req, res, connectionId);
      
      case 'updateSubscription':
        return await handleUpdateSubscription(req, res, connectionId, subscriptionConfig);
      
      case 'getStatus':
        return await handleGetStatus(req, res, connectionId);
      
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }
  } catch (error) {
    console.error('AIS Stream API error:', error);
    return res.status(500).json({
      success: false,
      message: 'AIS Stream operation failed',
      error: error.message
    });
  }
}

async function handleConnect(req, res, subscriptionConfig, aisApiKey) {
  if (!aisApiKey) {
    return res.status(400).json({ message: 'AIS API key is required' });
  }

  if (!subscriptionConfig?.BoundingBoxes) {
    return res.status(400).json({ message: 'Bounding boxes are required' });
  }

  const connectionId = uuidv4();
  const connection = {
    id: connectionId,
    ws: null,
    status: 'connecting',
    messages: [],
    lastMessage: null,
    startTime: new Date(),
    messageCount: 0
  };

  try {
    // Create WebSocket connection to AIS Stream
    const ws = new WebSocket('wss://stream.aisstream.io/v0/stream');
    connection.ws = ws;
    
    // Set up connection handlers
    ws.on('open', () => {
      connection.status = 'connected';
      
      // Send subscription message
      const subscriptionMessage = {
        APIKey: aisApiKey,
        BoundingBoxes: subscriptionConfig.BoundingBoxes,
        ...(subscriptionConfig.FiltersShipMMSI && { FiltersShipMMSI: subscriptionConfig.FiltersShipMMSI }),
        ...(subscriptionConfig.FilterMessageTypes && { FilterMessageTypes: subscriptionConfig.FilterMessageTypes })
      };
      
      ws.send(JSON.stringify(subscriptionMessage));
      connection.status = 'subscribed';
      
      console.log(`AIS Stream connected: ${connectionId}`);
    });

    ws.on('message', (data) => {
      try {
        const aisMessage = JSON.parse(data.toString());
        connection.messageCount++;
        connection.lastMessage = new Date();
        
        // Store only the last 100 messages to prevent memory issues
        if (connection.messages.length >= 100) {
          connection.messages.shift();
        }
        connection.messages.push(aisMessage);
        
      } catch (parseError) {
        console.error('Error parsing AIS message:', parseError);
      }
    });

    ws.on('close', () => {
      connection.status = 'disconnected';
      console.log(`AIS Stream disconnected: ${connectionId}`);
    });

    ws.on('error', (error) => {
      connection.status = 'error';
      connection.error = error.message;
      console.error(`AIS Stream error for ${connectionId}:`, error);
    });

    // Store connection
    activeConnections.set(connectionId, connection);

    return res.status(200).json({
      success: true,
      connectionId: connectionId,
      message: 'AIS Stream connection initiated'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to connect to AIS Stream',
      error: error.message
    });
  }
}

async function handleDisconnect(req, res, connectionId) {
  const connection = activeConnections.get(connectionId);
  
  if (!connection) {
    return res.status(404).json({ message: 'Connection not found' });
  }

  if (connection.ws) {
    connection.ws.close();
  }
  
  activeConnections.delete(connectionId);

  return res.status(200).json({
    success: true,
    message: 'Connection closed'
  });
}

async function handleUpdateSubscription(req, res, connectionId, subscriptionConfig) {
  const connection = activeConnections.get(connectionId);
  
  if (!connection) {
    return res.status(404).json({ message: 'Connection not found' });
  }

  if (connection.status !== 'subscribed') {
    return res.status(400).json({ message: 'Connection is not active' });
  }

  try {
    // Send updated subscription
    const updateMessage = {
      APIKey: subscriptionConfig.APIKey,
      BoundingBoxes: subscriptionConfig.BoundingBoxes,
      ...(subscriptionConfig.FiltersShipMMSI && { FiltersShipMMSI: subscriptionConfig.FiltersShipMMSI }),
      ...(subscriptionConfig.FilterMessageTypes && { FilterMessageTypes: subscriptionConfig.FilterMessageTypes })
    };
    
    connection.ws.send(JSON.stringify(updateMessage));

    return res.status(200).json({
      success: true,
      message: 'Subscription updated'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update subscription',
      error: error.message
    });
  }
}

async function handleGetStatus(req, res, connectionId) {
  if (connectionId) {
    const connection = activeConnections.get(connectionId);
    
    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }

    return res.status(200).json({
      success: true,
      connection: {
        id: connection.id,
        status: connection.status,
        messageCount: connection.messageCount,
        lastMessage: connection.lastMessage,
        startTime: connection.startTime,
        recentMessages: connection.messages.slice(-10), // Last 10 messages
        error: connection.error
      }
    });
  } else {
    // Return status of all connections
    const connections = Array.from(activeConnections.values()).map(conn => ({
      id: conn.id,
      status: conn.status,
      messageCount: conn.messageCount,
      lastMessage: conn.lastMessage,
      startTime: conn.startTime,
      error: conn.error
    }));

    return res.status(200).json({
      success: true,
      totalConnections: connections.length,
      connections: connections
    });
  }
}
