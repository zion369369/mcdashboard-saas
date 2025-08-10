import { useState } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import toast from 'react-hot-toast';

const WeatherDashboard = () => {
  const [textInput, setTextInput] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('text');

  const handleTextParse = async () => {
    if (!textInput.trim()) {
      toast.error('Please enter PAGASA bulletin text');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/weather/parse-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: textInput }),
      });

      const result = await response.json();

      if (result.success) {
        setParsedData(result.data);
        toast.success('PAGASA bulletin parsed successfully!');
      } else {
        toast.error(result.message || 'Failed to parse bulletin');
      }
    } catch (error) {
      toast.error('Error parsing bulletin: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePDFParse = async () => {
    if (!pdfFile) {
      toast.error('Please select a PDF file');
      return;
    }

    const formData = new FormData();
    formData.append('bulletin', pdfFile);

    setLoading(true);
    try {
      const response = await fetch('/api/weather/parse-pdf', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setParsedData(result.data);
        toast.success(`PDF "${result.fileName}" parsed successfully!`);
      } else {
        toast.error(result.message || 'Failed to parse PDF');
      }
    } catch (error) {
      toast.error('Error parsing PDF: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderArea = (area, index) => (
    <div key={index} className="bg-gray-50 p-4 rounded-lg mb-4">
      <h4 className="font-semibold text-lg text-gray-800">{area.name}</h4>
      
      {area.part && (
        <div className="mt-2">
          <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
            Partial Coverage
          </span>
        </div>
      )}

      {area.includes && (
        <div className="mt-3">
          <p className="text-sm text-gray-600">
            <strong>Coverage:</strong> {area.includes.type}
            {area.includes.term && ` (${area.includes.term})`}
            {area.includes.part && ` - ${area.includes.part}`}
            {area.includes.objects && area.includes.objects.length > 0 && (
              <span className="block mt-2">
                <strong>Areas:</strong>
                <div className="flex flex-wrap gap-1 mt-1">
                  {area.includes.objects.map((place, i) => (
                    <span
                      key={i}
                      className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                    >
                      {place}
                    </span>
                  ))}
                </div>
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );

  const renderParsedData = () => {
    if (!parsedData) return null;

    return (
      <div className="mt-8">
        <h3 className="text-xl font-bold mb-4">Parsed Weather Data</h3>
        
        {parsedData.areas && Object.keys(parsedData.areas).length > 0 ? (
          Object.entries(parsedData.areas).map(([signalNumber, areas]) => (
            <Card key={signalNumber} className="mb-6">
              <div className="p-6">
                <h4 className="text-lg font-semibold mb-4 flex items-center">
                  <span className={`inline-block w-6 h-6 rounded-full mr-2 ${
                    signalNumber === '0' ? 'bg-yellow-400' :
                    signalNumber === '1' ? 'bg-orange-400' :
                    signalNumber === '2' ? 'bg-red-400' :
                    'bg-purple-400'
                  }`}></span>
                  Signal #{signalNumber} Areas
                  <span className="ml-2 text-sm text-gray-500">
                    ({areas.length} area{areas.length !== 1 ? 's' : ''})
                  </span>
                </h4>
                
                {areas.length > 0 ? (
                  <div className="space-y-3">
                    {areas.map((area, index) => renderArea(area, index))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No areas under this signal level</p>
                )}
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-6">
            <p className="text-gray-500">No area data found in the parsed bulletin</p>
          </Card>
        )}

        <Card className="mt-6">
          <div className="p-6">
            <h4 className="text-lg font-semibold mb-4">Raw Parsed Data</h4>
            <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-sm">
              {JSON.stringify(parsedData, null, 2)}
            </pre>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">PAGASA Weather Parser</h1>
        <p className="text-gray-600">
          Parse PAGASA Tropical Cyclone Bulletins from text or PDF format
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('text')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'text'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Parse Text
            </button>
            <button
              onClick={() => setActiveTab('pdf')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pdf'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Parse PDF
            </button>
          </nav>
        </div>
      </div>

      {/* Text Input Tab */}
      {activeTab === 'text' && (
        <Card className="mb-6">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Parse Bulletin Text</h3>
            <div className="mb-4">
              <label htmlFor="bulletinText" className="block text-sm font-medium text-gray-700 mb-2">
                PAGASA Bulletin Text
              </label>
              <textarea
                id="bulletinText"
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Paste PAGASA tropical cyclone bulletin text here..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
              />
            </div>
            <Button
              onClick={handleTextParse}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Parsing...' : 'Parse Text'}
            </Button>
          </div>
        </Card>
      )}

      {/* PDF Upload Tab */}
      {activeTab === 'pdf' && (
        <Card className="mb-6">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Parse Bulletin PDF</h3>
            <div className="mb-4">
              <label htmlFor="bulletinPdf" className="block text-sm font-medium text-gray-700 mb-2">
                PAGASA Bulletin PDF File
              </label>
              <input
                id="bulletinPdf"
                type="file"
                accept=".pdf"
                onChange={(e) => setPdfFile(e.target.files[0])}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {pdfFile && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
            <Button
              onClick={handlePDFParse}
              disabled={loading || !pdfFile}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Parsing PDF...' : 'Parse PDF'}
            </Button>
          </div>
        </Card>
      )}

      {/* Sample Text */}
      <Card className="mb-6">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Sample Bulletin Text</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">
              <strong>Try this sample text:</strong>
            </p>
            <p className="text-xs text-gray-600 leading-relaxed">
              "The rest of mainland Cagayan, the eastern portion of Ilocos Norte (Pagudpud, Adams, Dumalneg, Bangui, Vintar, Carasi, Nueva Era, Burgos, Pasuquin, Bacarra, Laoag City, Piddig, Solsona, Dingras, Sarrat, San Nicolas), the rest of Apayao, the northern portion of Kalinga (Balbalan, Pinukpuk, City of Tabuk, Rizal), the eastern portion of Mountain Province (Paracelis), the northeastern portion of Abra (Tineg, Lacub, Malibcong), the northwestern and southeastern portions of Isabela (Santa Maria, Quezon, Mallig, Roxas, San Manuel, Cabatuan, Aurora, City of Cauayan, Angadanan, San Guillermo, Dinapigue, San Mariano, Cabagan, Santo Tomas, Delfin Albano, Tumauini, Quirino, Burgos, Gamu, Ilagan City, Luna, Reina Mercedes, Naguilian, Benito Soliven), and the northern portion of Aurora (Dilasag, Casiguran)"
            </p>
            <Button
              onClick={() => setTextInput("The rest of mainland Cagayan, the eastern portion of Ilocos Norte (Pagudpud, Adams, Dumalneg, Bangui, Vintar, Carasi, Nueva Era, Burgos, Pasuquin, Bacarra, Laoag City, Piddig, Solsona, Dingras, Sarrat, San Nicolas), the rest of Apayao, the northern portion of Kalinga (Balbalan, Pinukpuk, City of Tabuk, Rizal), the eastern portion of Mountain Province (Paracelis), the northeastern portion of Abra (Tineg, Lacub, Malibcong), the northwestern and southeastern portions of Isabela (Santa Maria, Quezon, Mallig, Roxas, San Manuel, Cabatuan, Aurora, City of Cauayan, Angadanan, San Guillermo, Dinapigue, San Mariano, Cabagan, Santo Tomas, Delfin Albano, Tumauini, Quirino, Burgos, Gamu, Ilagan City, Luna, Reina Mercedes, Naguilian, Benito Soliven), and the northern portion of Aurora (Dilasag, Casiguran)")}
              variant="outline"
              size="sm"
              className="mt-3"
            >
              Use Sample Text
            </Button>
          </div>
        </div>
      </Card>

      {/* Parsed Data Display */}
      {renderParsedData()}
    </div>
  );
};

export default WeatherDashboard;
