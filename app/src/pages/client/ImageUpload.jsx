import React, { useState } from 'react';
import axios from 'axios';

const App = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadLink, setDownloadLink] = useState('');
  const [userId, setUserId] = useState('');
  const [selectedOption, setSelectedOption] = useState('CDC'); // State for the selected option
  const [category, setCategory] = useState('Articles'); // State for category selection
  const [resolution, setResolution] = useState({ nonFeature: 1015, feature: 1270 }); // Default resolutions for CDC Articles

  const handleFileChange = (event) => {
    setSelectedFiles(event.target.files);
  };

  const handleOptionChange = (event) => {
    const selectedValue = event.target.value;
    setSelectedOption(selectedValue);
    updateResolution(selectedValue, category);
  };

  const handleCategoryChange = (event) => {
    const selectedCategory = event.target.value;
    setCategory(selectedCategory);
    updateResolution(selectedOption, selectedCategory);
  };

  const updateResolution = (option, category) => {
    if (option === 'CDC' && category === 'Articles') {
      setResolution({ nonFeature: 1015, feature: 1270 });
    } else if (option === 'TJK' && category === 'Articles') {
      setResolution({ nonFeature: 700, feature: 1920 });
    } else if ((option === 'CDC' || option === 'TJK') && category === 'Webstories') {
      setResolution({ nonFeature: 1080, feature: 1080 });
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setMessage('Please select at least one image.');
      return;
    }

    const formData = new FormData();
    for (const file of selectedFiles) {
      formData.append('images', file);
    }

    setIsProcessing(true); // Start processing

    try {
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        params: { resolution, selectedOption, category },
      });

      const { userId } = response.data; // Extract UUID from response
      localStorage.setItem('userId', userId); // Store in localStorage for later use
      setUserId(userId); // Set the userId state
      setDownloadLink(response.data.downloadLink); // Set the download link
      setMessage('Images uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      setMessage('Error uploading images. Please try again.');
    } finally {
      setIsProcessing(false); // Stop processing
    }
  };

  const handleDownload = () => {
    const storedUserId = localStorage.getItem('userId');
    if (!storedUserId) {
      setMessage('User ID not found. Please upload files again.');
      return;
    }

    setIsProcessing(true); // Start processing

    const downloadUrl = `http://localhost:5000/download/${storedUserId}`;
    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.download = `${storedUserId}.zip`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    setIsProcessing(false); // Stop processing
  };

  return (
    <div className="img-upload">
      <div className="group">
        <div className="form-group">
          <label>Category:</label>
          <select onChange={handleCategoryChange} value={category}>
            <option value="Articles">Articles</option>
            <option value="Webstories">Webstories</option>
          </select>
        </div>

        <div className="form-group">
          <label>Brand:</label>
          <select onChange={handleOptionChange} value={selectedOption}>
            <option value="CDC">CDC</option>
            <option value="TJK">TJK</option>
          </select>
        </div>

        <div className="group-two">
          <input type="file" multiple onChange={handleFileChange} />
          <button
            onClick={handleUpload}
            disabled={isProcessing}
            className="btn btn-primary upload-btn"
          >
            {isProcessing ? (
              'Processing...'
            ) : (
              <>
                Upload Images
              </>
            )}
          </button>
        </div>

        {message && <p className="message">{message}</p>}

        {downloadLink && (
          <button
            onClick={handleDownload}
            disabled={isProcessing}
            className="btn btn-success download-btn"
          >
            {isProcessing ? (
              'Processing...'
            ) : (
              <>
                Download as ZIP
              </>
            )}
          </button>
        )}

        {userId && <p className="text-primary user-id">Your User ID: {userId}</p>}
      </div>
    </div>
  );
};

export default App;
