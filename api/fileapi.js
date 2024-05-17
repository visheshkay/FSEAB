const exp = require('express')
const fileApp = exp.Router();
const mongoose = require('mongoose');
const Grid = require('gridfs-stream')
const multer = require('multer')
const {GridFsStorage} = require('multer-gridfs-storage')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')
const crypto = require('crypto');
const path = require('path');
require('dotenv').config()

// {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// }
fileApp.use(bodyParser.json())
fileApp.use(methodOverride('_method'))
const conn = mongoose.createConnection('mongodb://localhost:27017/fseaFiledb')
let gfs;

conn.once('open', () => {
  // Init stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
});


  const storage = new GridFsStorage({
    url: 'mongodb://localhost:27017/fseaFiledb',
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = file.originalname;
          const fileInfo = {
            filename: filename,
            bucketName: 'uploads'
          };
          resolve(fileInfo);
        });
      });
    }
  });
  const upload = multer({ storage });

  fileApp.post('/upload-certificate', upload.single('file'), (req, res) => {
    res.json({ file: req.file });
  });

  fileApp.get('/get-certificates', async (req, res) => {
      console.log("Started")
      try {
        let files = await gfs.files.find().toArray();
        res.json({files})
    } catch (err) {
        res.json({err})
    }
  });

  fileApp.get('/get-certificate/:filename', async (req, res) => {
    try {
        let file = await gfs.files.findOne({filename : req.params.filename})
        if (!file || file.length === 0) {
            return res.status(404).json({ err: 'No file exists' });
        }
        const readstream = gfs.createReadStream({filename: file.filename});
        readstream.pipe(res);
    } catch (err) {
        console.log(err)
        res.json({error:err})
    }
  });



module.exports = fileApp

