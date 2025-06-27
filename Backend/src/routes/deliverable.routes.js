import express from 'express';
import { getProjectDeliverables, uploadDeliverable } from '../controllers/deliverable.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// 🔧 Multer config
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `deliverable-${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

router.post('/upload', verifyToken, uploadDeliverable);// 🛡️ Route
router.post('/', verifyToken, upload.single('file'), uploadDeliverable);
router.get('/project/:projectId', verifyToken, getProjectDeliverables);


export default router;
