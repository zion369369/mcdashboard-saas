import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import toast from 'react-hot-toast';

const MaritimeDashboard = () => {
  const [connectionId, setConnectionId] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [aisApiKey, setAisApiKey] = useState('');
  const [messages, setMessages] = useState([]);
  const [messageCount, setMessageCount] = useState(0);
  const [subscriptionConfig, setSubscriptionConfig] = useState({
    BoundingBoxes: [[[-90, -180], [90, 180]]], // Default: worldwide
    FilterMessageTypes: ['PositionReport'] // Default: position reports only
  });
  const [customBoundingBox, setCustomBoundingBox] = useState({
    lat1: 25.6, lng1: -80.2, lat2: 25.8, lng2: -79.9 // Miami area as default
  });
  const [loading, setLoading] = useState(false);
  const [selectedMMSI, setSelectedMMSI] = useState('');
  const intervalRef = useRef(null);

  // Predefined areas
  const predefinedAreas = {
    worldwide: [[[-90, -180], [90, 180]]],
    miami: [[[25.602700, -80.207729], [25.835302, -79.879297]]],
    losAngeles: [[[33.673490, -118.356139], [33.772292, -118.095731]]],
    philippines: [[[4.5, 114.0], [21.0, 127.0]]],
    singapore: [[[1.1, 103.5], [1.5, 104.1]]],
    suez: [[[29.5, 32.0], [30.5, 33.0]]]
  };

  // Poll for connection status and messages
  useEffect(() => {
    if (connectionId && connectionStatus === 'subscribed') {
      intervalRef.current = setInterval(async () => {
        try {
          const response = await fetch('/api/maritime/ais-stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'getStatus',
              connectionId: connectionId
            })
          });

          const result = await response.json();
          if (result.success && result.connection) {
            setMessageCount(result.connection.messageCount);
            setMessages(result.connection.recentMessages || []);
            
            if (result.connection.status !== connectionStatus) {
              setConnectionStatus(result.connection.status);
            }
          }
        } catch (error) {
          console.error('Error polling status:', error);
        }
      }, 2000); // Poll every 2 seconds

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [connectionId, connectionStatus]);

  const handleConnect = async () => {
    if (!aisApiKey.trim()) {
      toast.error('Please enter your AIS Stream API key');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/maritime/ais-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'connect',
          subscriptionConfig: subscriptionConfig,
          aisApiKey: aisApiKey.trim()
        })
      });

      const result = await response.json();
      if (result.success) {
        setConnectionId(result.connectionId);
        setConnectionStatus('connecting');
        toast.success('Connecting to AIS Stream...');
        
        // Wait a moment then update status
        setTimeout(async () => {
          setConnectionStatus('subscribed');
          toast.success('Connected to AIS Stream successfully!');
        }, 2000);
      } else {
        toast.error(result.message || 'Failed to connect');
      }
    } catch (error) {
      toast.error('Connection error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!connectionId) return;

    setLoading(true);
    try {
      const response = await fetch('/api/maritime/ais-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'disconnect',
          connectionId: connectionId
        })
      });

      const result = await response.json();
      if (result.success) {
        setConnectionId(null);
        setConnectionStatus('disconnected');
        setMessages([]);
        setMessageCount(0);
        toast.success('Disconnected from AIS Stream');
        
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      } else {
        toast.error(result.message || 'Failed to disconnect');
      }
    } catch (error) {
      toast.error('Disconnect error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateBoundingBox = (area) => {
    setSubscriptionConfig({
      ...subscriptionConfig,
      BoundingBoxes: predefinedAreas[area]
    });
  };

  const handleCustomBoundingBox = () => {
    const bbox = [[[parseFloat(customBoundingBox.lat1), parseFloat(customBoundingBox.lng1)], 
                   [parseFloat(customBoundingBox.lat2), parseFloat(customBoundingBox.lng2)]]];
    
    setSubscriptionConfig({
      ...subscriptionConfig,
      BoundingBoxes: bbox
    });
    toast.success('Custom bounding box applied');
  };

  const addMMSIFilter = () => {
    if (!selectedMMSI.trim()) return;
    
    const currentFilters = subscriptionConfig.FiltersShipMMSI || [];
    if (!currentFilters.includes(selectedMMSI.trim())) {
      setSubscriptionConfig({
        ...subscriptionConfig,
        FiltersShipMMSI: [...currentFilters, selectedMMSI.trim()]
      });
      setSelectedMMSI('');
      toast.success('MMSI filter added');
    }
  };

  const removeMMSIFilter = (mmsi) => {
    const updatedFilters = (subscriptionConfig.FiltersShipMMSI || []).filter(m => m !== mmsi);
    setSubscriptionConfig({
      ...subscriptionConfig,
      FiltersShipMMSI: updatedFilters.length > 0 ? updatedFilters : undefined
    });
    toast.success('MMSI filter removed');
  };

  const renderMessage = (message, index) => {
    if (!message.Message || !message.MessageType) return null;

    const messageData = message.Message[message.MessageType];
    if (!messageData) return null;

    return (
      <div key={index} className="bg-gray-50 p-3 rounded-lg mb-2 text-sm">
        <div className="flex justify-between items-start mb-2">
          <span className="font-semibold text-blue-600">{message.MessageType}</span>
          <span className="text-xs text-gray-500">
            {new Date().toLocaleTimeString()}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-xs">
          {messageData.UserID && (
            <div><strong>MMSI:</strong> {messageData.UserID}</div>
          )}
          {messageData.Latitude && (
            <div><strong>Lat:</strong> {messageData.Latitude.toFixed(4)}</div>
          )}
          {messageData.Longitude && (
            <div><strong>Lng:</strong> {messageData.Longitude.toFixed(4)}</div>
          )}
          {messageData.SpeedOverGround !== undefined && (
            <div><strong>Speed:</strong> {messageData.SpeedOverGround} knots</div>
          )}
          {messageData.CourseOverGround !== undefined && (
            <div><strong>Course:</strong> {messageData.CourseOverGround}°</div>
          )}
          {messageData.NavigationalStatus !== undefined && (
            <div className="col-span-2"><strong>Status:</strong> {messageData.NavigationalStatus}</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Maritime AIS Tracking</h1>
        <p className="text-gray-600">
          Real-time ship tracking using AIS Stream WebSocket API
        </p>
      </div>

      {/* Connection Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">AIS Stream Connection</h3>
            
            <div className="mb-4">
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
                AIS Stream API Key
              </label>
              <input
                id="apiKey"
                type="password"
                placeholder="Enter your AIS Stream API key..."
                value={aisApiKey}
                onChange={(e) => setAisApiKey(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={connectionStatus === 'subscribed'}
              />
              <p className="mt-1 text-xs text-gray-500">
                Get your API key from <a href="https://aisstream.io" target="_blank" rel="noopener noreferrer" className="text-blue-600">aisstream.io</a>
              </p>
            </div>

            <div className="flex gap-2">
              {connectionStatus === 'disconnected' ? (
                <Button
                  onClick={handleConnect}
                  disabled={loading || !aisApiKey.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? 'Connecting...' : 'Connect to AIS Stream'}
                </Button>
              ) : (
                <Button
                  onClick={handleDisconnect}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {loading ? 'Disconnecting...' : 'Disconnect'}
                </Button>
              )}
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Connection Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  connectionStatus === 'subscribed' ? 'bg-green-100 text-green-800' :
                  connectionStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {connectionStatus}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Messages:</span>
                <span className="font-mono">{messageCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Connection ID:</span>
                <span className="font-mono text-xs">{connectionId ? connectionId.slice(0, 8) : 'N/A'}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Configuration Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Area Selection</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Predefined Areas
              </label>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(predefinedAreas).map((area) => (
                  <button
                    key={area}
                    onClick={() => updateBoundingBox(area)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 capitalize"
                    disabled={connectionStatus === 'subscribed'}
                  >
                    {area.replace(/([A-Z])/g, ' $1')}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Bounding Box
              </label>
              <div className="grid grid-cols-4 gap-2">
                <input
                  type="number"
                  step="0.0001"
                  placeholder="Lat 1"
                  value={customBoundingBox.lat1}
                  onChange={(e) => setCustomBoundingBox({...customBoundingBox, lat1: e.target.value})}
                  className="px-2 py-1 text-sm border border-gray-300 rounded"
                />
                <input
                  type="number"
                  step="0.0001"
                  placeholder="Lng 1"
                  value={customBoundingBox.lng1}
                  onChange={(e) => setCustomBoundingBox({...customBoundingBox, lng1: e.target.value})}
                  className="px-2 py-1 text-sm border border-gray-300 rounded"
                />
                <input
                  type="number"
                  step="0.0001"
                  placeholder="Lat 2"
                  value={customBoundingBox.lat2}
                  onChange={(e) => setCustomBoundingBox({...customBoundingBox, lat2: e.target.value})}
                  className="px-2 py-1 text-sm border border-gray-300 rounded"
                />
                <input
                  type="number"
                  step="0.0001"
                  placeholder="Lng 2"
                  value={customBoundingBox.lng2}
                  onChange={(e) => setCustomBoundingBox({...customBoundingBox, lng2: e.target.value})}
                  className="px-2 py-1 text-sm border border-gray-300 rounded"
                />
              </div>
              <Button
                onClick={handleCustomBoundingBox}
                variant="outline"
                size="sm"
                className="mt-2"
                disabled={connectionStatus === 'subscribed'}
              >
                Apply Custom Area
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Filters</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                MMSI Filters
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Enter MMSI number..."
                  value={selectedMMSI}
                  onChange={(e) => setSelectedMMSI(e.target.value)}
                  className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                />
                <Button
                  onClick={addMMSIFilter}
                  variant="outline"
                  size="sm"
                  disabled={connectionStatus === 'subscribed'}
                >
                  Add
                </Button>
              </div>
              
              {subscriptionConfig.FiltersShipMMSI && subscriptionConfig.FiltersShipMMSI.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {subscriptionConfig.FiltersShipMMSI.map((mmsi) => (
                    <span
                      key={mmsi}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                    >
                      {mmsi}
                      <button
                        onClick={() => removeMMSIFilter(mmsi)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                        disabled={connectionStatus === 'subscribed'}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Types
              </label>
              <select
                multiple
                value={subscriptionConfig.FilterMessageTypes || []}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, option => option.value);
                  setSubscriptionConfig({
                    ...subscriptionConfig,
                    FilterMessageTypes: values.length > 0 ? values : ['PositionReport']
                  });
                }}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                disabled={connectionStatus === 'subscribed'}
              >
                <option value="PositionReport">Position Report</option>
                <option value="ShipAndVoyageData">Ship and Voyage Data</option>
                <option value="BaseStationReport">Base Station Report</option>
                <option value="AddressedBinaryMessage">Addressed Binary Message</option>
              </select>
            </div>
          </div>
        </Card>
      </div>

      {/* Live Messages */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Live AIS Messages ({messages.length})</h3>
          
          <div className="max-h-96 overflow-y-auto">
            {messages.length > 0 ? (
              messages.slice().reverse().map((message, index) => renderMessage(message, index))
            ) : (
              <div className="text-center text-gray-500 py-8">
                {connectionStatus === 'subscribed' ? 
                  'Waiting for AIS messages...' : 
                  'Connect to AIS Stream to see live messages'
                }
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MaritimeDashboard;
