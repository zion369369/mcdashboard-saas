import PagasaParserPDFSource from '@pagasa-parser/source-pdf';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file uploads
const upload = multer({
  dest: './uploads/', // temporary upload directory
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Disable the default body parser for this API route
export const config = {
  api: {
    bodyParser: false,
  },
};

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Ensure uploads directory exists
    const uploadsDir = './uploads';
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Run the multer middleware
    await runMiddleware(req, res, upload.single('bulletin'));

    if (!req.file) {
      return res.status(400).json({ message: 'No PDF file uploaded' });
    }

    const filePath = req.file.path;

    try {
      // Parse the PDF using PAGASA Parser
      const data = new PagasaParserPDFSource(filePath);
      const parsedData = await data.parse();

      // Clean up - remove the uploaded file
      fs.unlinkSync(filePath);

      return res.status(200).json({
        success: true,
        data: parsedData,
        message: 'PAGASA PDF bulletin parsed successfully',
        fileName: req.file.originalname
      });

    } catch (parseError) {
      // Clean up - remove the uploaded file even if parsing fails
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw parseError;
    }

  } catch (error) {
    console.error('Error parsing PAGASA PDF:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to parse PAGASA PDF bulletin',
      error: error.message
    });
  }
}
