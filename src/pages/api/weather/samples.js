import PagasaParser from 'pagasa-parser';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Sample PAGASA bulletin texts for demonstration
    const sampleBulletins = [
      {
        title: "Northern Luzon Signal #1",
        text: "The rest of mainland Cagayan, the eastern portion of Ilocos Norte (Pagudpud, Adams, Dumalneg, Bangui, Vintar, Carasi, Nueva Era, Burgos, Pasuquin, Bacarra, Laoag City, Piddig, Solsona, Dingras, Sarrat, San Nicolas), the rest of Apayao, the northern portion of Kalinga (Balbalan, Pinukpuk, City of Tabuk, Rizal), the eastern portion of Mountain Province (Paracelis), the northeastern portion of Abra (Tineg, Lacub, Malibcong)"
      },
      {
        title: "Isabela and Aurora Areas",
        text: "the northwestern and southeastern portions of Isabela (Santa Maria, Quezon, Mallig, Roxas, San Manuel, Cabatuan, Aurora, City of Cauayan, Angadanan, San Guillermo, Dinapigue, San Mariano, Cabagan, Santo Tomas, Delfin Albano, Tumauini, Quirino, Burgos, Gamu, Ilagan City, Luna, Reina Mercedes, Naguilian, Benito Soliven), and the northern portion of Aurora (Dilasag, Casiguran)"
      }
    ];

    const parsedSamples = [];

    // Parse each sample bulletin
    for (const bulletin of sampleBulletins) {
      try {
        const parser = new PagasaParser();
        const parsed = parser.parse(bulletin.text);
        
        parsedSamples.push({
          title: bulletin.title,
          originalText: bulletin.text,
          parsed: parsed
        });
      } catch (parseError) {
        parsedSamples.push({
          title: bulletin.title,
          originalText: bulletin.text,
          error: parseError.message
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Sample PAGASA bulletins parsed',
      samples: parsedSamples,
      info: {
        parserVersion: '2.2.4',
        description: 'PAGASA Parser converts tropical cyclone bulletin text into structured data',
        features: [
          'Parse text-based bulletins',
          'Extract affected areas by signal level',
          'Identify partial coverage areas',
          'Support for PDF parsing with @pagasa-parser/source-pdf'
        ]
      }
    });

  } catch (error) {
    console.error('Error in weather samples API:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate sample data',
      error: error.message
    });
  }
}
