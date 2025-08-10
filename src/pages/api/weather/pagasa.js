import { pagasaParser } from 'pagasa-parser';
import initMiddleware from '@/lib/server/init-middleware';
import { validateSession } from '@/lib/server/session-check';
import { runValidation } from '@/lib/server/validate';

const handler = async (req, res) => {
  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Validate session (optional - remove if you want public access)
    await validateSession(req, res);

    const { area, format = 'json' } = req.query;

    // Example: Parse a sample PAGASA bulletin text
    const sampleText = `The rest of mainland Cagayan, the eastern portion of Ilocos Norte (Pagudpud, Adams, Dumalneg, Bangui, Vintar, Carasi, Nueva Era, Burgos, Pasuquin, Bacarra, Laoag City, Piddig, Solsona, Dingras, Sarrat, San Nicolas), the rest of Apayao, the northern portion of Kalinga (Balbalan, Pinukpuk, City of Tabuk, Rizal), the eastern portion of Mountain Province (Paracelis), the northeastern portion of Abra (Tineg, Lacub, Malibcong), the northwestern and southeastern portions of Isabela (Santa Maria, Quezon, Mallig, Roxas, San Manuel, Cabatuan, Aurora, City of Cauayan, Angadanan, San Guillermo, Dinapigue, San Mariano, Cabagan, Santo Tomas, Delfin Albano, Tumauini, Quirino, Burgos, Gamu, Ilagan City, Luna, Reina Mercedes, Naguilian, Benito Soliven), and the northern portion of Aurora (Dilasag, Casiguran)`;

    try {
      // Parse the bulletin text using pagasa-parser
      const parsedData = pagasaParser(sampleText);

      // Filter by area if specified
      let result = parsedData;
      if (area) {
        result = {
          ...parsedData,
          areas: Object.keys(parsedData.areas).reduce((filtered, key) => {
            const areaData = parsedData.areas[key].filter(item => 
              item.name.toLowerCase().includes(area.toLowerCase())
            );
            if (areaData.length > 0) {
              filtered[key] = areaData;
            }
            return filtered;
          }, {})
        };
      }

      return res.status(200).json({
        success: true,
        data: result,
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'PAGASA',
          parser_version: 'pagasa-parser',
          format: format
        }
      });

    } catch (parseError) {
      console.error('PAGASA parsing error:', parseError);
      return res.status(500).json({ 
        error: 'Failed to parse PAGASA data',
        details: parseError.message 
      });
    }

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export default initMiddleware(handler);
