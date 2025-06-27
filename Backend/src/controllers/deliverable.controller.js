import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Ensure upload folder exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Setup multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `deliverable-${Date.now()}${ext}`;
    cb(null, filename);
  },
});
const upload = multer({ storage }).single('file');

// Controller function
export const uploadDeliverable = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('❌ Multer error:', err);
      return res.status(500).json({ message: 'Upload failed', error: err.message });
    }

    const { projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({ message: 'Missing project ID' });
    }

    try {
      const saved = await prisma.deliverable.create({
        data: {
          projectId: parseInt(projectId),
          fileUrl: `/uploads/${req.file.filename}`,
        },
      });

      res.status(200).json({ message: 'Deliverable uploaded', deliverable: saved });
    } catch (error) {
      console.error('❌ DB error:', error);
      res.status(500).json({ message: 'Database error while saving deliverable' });
    }
  });
};
export const getProjectDeliverables = async (req, res) => {
  const projectId = parseInt(req.params.projectId);

  if (isNaN(projectId)) {
    return res.status(400).json({ message: 'Invalid project ID' });
  }

  try {
    const deliverables = await prisma.deliverable.findMany({
      where: { projectId },
    });

    res.json(deliverables);
  } catch (err) {
    console.error('Get deliverables error:', err);
    res.status(500).json({ message: 'Failed to fetch deliverables' });
  }
};