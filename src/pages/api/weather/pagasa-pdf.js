import PagasaParserPDFSource from '@pagasa-parser/source-pdf';
import initMiddleware from '@/lib/server/init-middleware';
import { validateSession } from '@/lib/server/session-check';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), 'uploads', 'weather');
      // Ensure directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    }
  }),
  fileFilter: (req, file, cb) => {
    // Only accept PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Disable Next.js body parsing for this route
export const config = {
  api: {
    bodyParser: false,
  },
};

const handler = async (req, res) => {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Validate session (optional - remove if you want public access)
    await validateSession(req, res);

    // Handle file upload
    const uploadMiddleware = upload.single('bulletin');
    
    await new Promise((resolve, reject) => {
      uploadMiddleware(req, res, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const filePath = req.file.path;

    try {
      // Parse the PDF using PAGASA Parser
      const data = new PagasaParserPDFSource(filePath);
      const parsedData = await data.parse();

      // Clean up the uploaded file
      fs.unlinkSync(filePath);

      return res.status(200).json({
        success: true,
        data: parsedData,
        metadata: {
          timestamp: new Date().toISOString(),
          source: 'PAGASA PDF',
          filename: req.file.originalname,
          parser_version: '@pagasa-parser/source-pdf'
        }
      });

    } catch (parseError) {
      // Clean up the uploaded file even if parsing fails
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      console.error('PDF parsing error:', parseError);
      return res.status(500).json({ 
        error: 'Failed to parse PAGASA PDF',
        details: parseError.message 
      });
    }

  } catch (error) {
    console.error('API Error:', error);
    
    // Handle multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
    if (error.message === 'Only PDF files are allowed') {
      return res.status(400).json({ error: 'Only PDF files are allowed' });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export default initMiddleware(handler);
