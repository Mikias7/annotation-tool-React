const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/imageUploads', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB'));

// Define Image schema
const imageSchema = new mongoose.Schema({
  filename: String,
  contentType: String,
  imageData: Buffer,
});

const Image = mongoose.model('Image', imageSchema);

// Use multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload route for multiple files
app.post('/upload', upload.array('images'), async (req, res) => {
  try {
    const savedImages = await Promise.all(
      req.files.map((file) => {
        const newImage = new Image({
          filename: file.originalname,
          contentType: file.mimetype,
          imageData: file.buffer,
        });
        return newImage.save();
      })
    );
    res.json({ message: 'Images uploaded and stored in MongoDB', files: savedImages });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to upload images' });
  }
});

//
// server/index.js - add this route
app.get('/images', async (req, res) => {
    try {
      const images = await Image.find();
      const imageList = images.map(img => ({
        _id: img._id,
        filename: img.filename,
        dataUrl: `data:${img.contentType};base64,${img.imageData.toString('base64')}`,
      }));
      res.json(imageList);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch images' });
    }
  });

app.delete('/images/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Image.findByIdAndDelete(id);
        if (!deleted) {
        return res.status(404).json({ error: 'Image not found' });
        }
        res.json({ message: 'Image deleted successfully' });
    } catch (err) {
        console.error('Error deleting image:', err);
        res.status(500).json({ error: 'Failed to delete image' });
    }
});
  

// Endpoint to receive and return annotations
app.post('/save-annotations', (req, res) => {
  try {
    const annotations = req.body.annotations;

    if (!annotations || typeof annotations !== 'object') {
      console.error('Invalid or missing annotations in request body:', req.body);
      return res.status(400).send('Invalid or missing annotations in request body');
    }

    const filePath = path.join(__dirname, 'annotations.json');

    fs.writeFile(filePath, JSON.stringify(annotations, null, 2), (err) => {
      if (err) {
        console.error('Error writing file:', err);
        return res.status(500).send('Failed to save annotations');
      }

      res.download(filePath, 'annotations.json', (err) => {
        if (err) {
          console.error('Error sending file:', err);
          res.status(500).send('Failed to send file');
        }
      });
    });
  } catch (error) {
    console.error('Unexpected error in /save-annotations:', error);
    res.status(500).send('Server error');
  }
});
///////////
  

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
