import express from 'express';
import { acceptBid, getBidsByProject, placeBid } from '../controllers/bid.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/',verifyToken, placeBid);

router.get('/project/:id', verifyToken, getBidsByProject); 
router.patch('/:bidId/accept', verifyToken, acceptBid); 


export default router;
