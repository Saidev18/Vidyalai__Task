const express = require('express');
const multer = require('multer');
const fs = require('fs').promises;
const { PDFDocument } = require('pdf-lib');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 5000;

// Enable CORS
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
}));

// Set up multer for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Middleware to parse JSON bodies
app.use(express.json());

// Route to handle PDF file upload
app.post('/api/upload-pdf', upload.single('pdf'), async (req, res) => {
    try {
        const file = req.file;
        if (!file || file.mimetype !== 'application/pdf') {
            res.status(400).send('Please upload a PDF file.');
            return;
        }
        res.send('PDF uploaded successfully.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to get information about the uploaded PDF
app.post('/api/get-pdf-info', upload.single('pdf'), async (req, res) => {
    try {
        const pdfBuffer = req.file.buffer;
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        const numPages = pdfDoc.getPageCount();
        res.json({ numPages });
    } catch (error) {
        console.error('Error fetching PDF info:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to create a new PDF with selected pages
app.post('/api/create-pdf', upload.single('pdf'), async (req, res) => {
    try {
        const { pages } = req.body;
        const pdfBuffer = req.file.buffer;
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        const selectedPages = pages.split(',').map(Number);
        const newPdfDoc = await PDFDocument.create();
        for (const pageNum of selectedPages) {
            const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageNum - 1]);
            newPdfDoc.addPage(copiedPage);
        }
        const newPdfBytes = await newPdfDoc.save();
        const newPdfPath = path.join(__dirname, 'new_pdf_folder', 'new_pdf.pdf');
        await fs.writeFile(newPdfPath, newPdfBytes);
        res.json({ filePath: newPdfPath });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

// Route to serve the newly created PDF
app.get('/api/get-new-pdf', async (req, res) => {
    try {
        const filePath = req.query.filePath;
        if (!filePath) {
            throw new Error('File path is missing.');
        }
        res.sendFile(filePath);
    } catch (error) {
        console.error('Error retrieving new PDF:', error);
        res.status(500).send('Internal Server Error: Unable to retrieve new PDF');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
