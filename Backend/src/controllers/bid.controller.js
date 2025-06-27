import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

export const placeBid = async (req, res) => {
  const { projectId, amount, etaDays, message } = req.body;
  const sellerId = req.user.userId; // ✅ from token

  if (!projectId || !amount || !etaDays || !message) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const bid = await prisma.bid.create({
      data: {
        amount: +amount,
        etaDays: +etaDays,
        message,
        sellerId,
        projectId: +projectId,
      },
    });

    res.status(201).json(bid);
  } catch (err) {
    console.log('[placeBid error]', err);
    res.status(500).json({ message: 'Could not place bid' });
  }
};


export const getBidsByProject = async (req, res) => {
  const { id } = req.params;

  try {
    const bids = await prisma.bid.findMany({
      where: { projectId: parseInt(id) },
      include: {
        seller: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(bids);
  } catch (err) {
    console.error('[getBidsByProject error]', err);
    res.status(500).json({ message: 'Failed to fetch bids for project' });
  }
};

// src/controllers/project.controller.js
export const acceptBid = async (req, res) => {
  const { projectId, sellerId } = req.body;

  try {
    const updatedProject = await prisma.project.update({
      where: { id: Number(projectId) },
      data: {
        sellerId: Number(sellerId), // ✅ seller should be assigned here
        status: 'IN_PROGRESS',      // ✅ status must be updated
      },
    });

    // ... send email etc
    res.json(updatedProject);
  } catch (err) {
    console.error('[acceptBid error]', err);
    res.status(500).json({ message: 'Failed to accept bid' });
  }
};
