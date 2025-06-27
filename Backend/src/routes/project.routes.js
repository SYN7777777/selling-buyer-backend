import express from 'express';
import { acceptBid, assignSeller, createProject, getAllProjects, getMyProjects, getSellerProjects, getSingleProject, markProjectComplete, selectSeller } from '../controllers/project.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();



router.get('/seller', verifyToken, getSellerProjects )

router.post('/',verifyToken, createProject);
router.get('/projects/my', verifyToken, getMyProjects);
router.get('/',verifyToken,getAllProjects);
router.get('/:id',verifyToken, getSingleProject);
router.put('/:id/select-seller',verifyToken, selectSeller);
router.put('/:id/mark-complete',verifyToken, markProjectComplete);
router.post('/accept-bid', verifyToken, acceptBid);

router.post('/assign', assignSeller); // 


export default router;
