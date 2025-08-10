import PagasaParser from 'pagasa-parser';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: 'Text data is required' });
    }

    // Parse the PAGASA bulletin text
    const parser = new PagasaParser();
    const parsedData = parser.parse(text);

    return res.status(200).json({
      success: true,
      data: parsedData,
      message: 'PAGASA bulletin parsed successfully'
    });

  } catch (error) {
    console.error('Error parsing PAGASA text:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to parse PAGASA bulletin',
      error: error.message
    });
  }
}
