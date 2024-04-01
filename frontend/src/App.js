import React, { useState, useEffect } from 'react';

function App() {
    // State hooks for managing file selection, pages, and PDF URL
    const [selectedFile, setSelectedFile] = useState(null);
    const [pages, setPages] = useState([]);
    const [numPages, setNumPages] = useState(0);
    const [uploadedPdfUrl, setUploadedPdfUrl] = useState('');
    const [newPdfUrl, setNewPdfUrl] = useState('');

    // Effect hook to fetch PDF info upon file selection
    useEffect(() => {
        if (selectedFile) {
            // Fetch PDF info
            const formData = new FormData();
            formData.append('pdf', selectedFile);

            fetch('http://localhost:5000/api/get-pdf-info', {
                method: 'POST',
                body: formData,
            })
            .then(response => response.json())
            .then(data => {
                // Update states with PDF info
                setNumPages(data.numPages);
                setPages(Array.from({ length: data.numPages }, () => false));
                setUploadedPdfUrl(URL.createObjectURL(selectedFile));
            })
            .catch(error => {
                console.error('Error fetching PDF info:', error);
                alert('Failed to fetch PDF info.');
            });
        }
    }, [selectedFile]);

    // Function to handle file selection
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && file.type === 'application/pdf') {
            setSelectedFile(file);
            setNewPdfUrl('');
        } else {
            setSelectedFile(null);
            setUploadedPdfUrl('');
            alert('Please select a PDF file.');
        }
    };

    // Function to toggle page selection
    const handlePageChange = (pageNumber) => {
        setPages(prevPages => {
            const updatedPages = [...prevPages];
            updatedPages[pageNumber - 1] = !updatedPages[pageNumber - 1];
            return updatedPages;
        });
    };

    // Function to create new PDF with selected pages
    const handleCreatePDF = async () => {
        if (!selectedFile) {
            alert('Please select a PDF file.');
            return;
        }

        try {
            // Prepare data for PDF creation
            const formData = new FormData();
            formData.append('pdf', selectedFile);
            formData.append('pages', pages
                .map((isChecked, index) => isChecked ? index + 1 : null)
                .filter(pageNumber => pageNumber !== null)
                .join(','));

            // Send request to create PDF
            const response = await fetch('http://localhost:5000/api/create-pdf', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const { filePath } = await response.json();
                const newPdfUrl = `http://localhost:5000/api/get-new-pdf?filePath=${encodeURIComponent(filePath)}`;
                setNewPdfUrl(newPdfUrl);
            } else {
                alert('Failed to create PDF.');
            }
        } catch (error) {
            console.error(error);
            alert('Error creating PDF.');
        }
    };

    // Render the UI
    return (
        <div className="container mt-5">
            <h1 className="mb-4">PDF Page Extractor</h1>
            {selectedFile && (
                <div className="mb-3">
                    <h2>Uploaded PDF</h2>
                    <iframe src={uploadedPdfUrl} width="800" height="500" title="Uploaded PDF"></iframe>
                </div>
            )}
            <div className="mb-3">
                <input
                    type="file"
                    className="form-control"
                    accept=".pdf"
                    onChange={handleFileChange}
                />
            </div>
            {selectedFile && (
                <div className="mb-3">
                    <h2>Pages:</h2>
                    {Array.from({ length: numPages }, (_, i) => (
                        <div key={i} className="form-check">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                id={`page-${i + 1}`}
                                checked={pages[i]}
                                onChange={() => handlePageChange(i + 1)}
                            />
                            <label className="form-check-label" htmlFor={`page-${i + 1}`}>
                                Page {i + 1}
                            </label>
                        </div>
                    ))}
                </div>
            )}
            {selectedFile && (
                <button className="btn btn-primary" onClick={handleCreatePDF}>
                    Create PDF
                </button>
            )}
            {newPdfUrl && (
                <div className="mb-3">
                    <h2>New PDF</h2>
                    <iframe src={newPdfUrl} width="800" height="500" title="New PDF"></iframe>
                </div>
            )}
        </div>
    );
}

export default App;
