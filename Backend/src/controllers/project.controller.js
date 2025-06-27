import { PrismaClient, ProjectStatus } from '@prisma/client';
import { sendMail } from '../lib/mailer.js';

const prisma = new PrismaClient();
console.log('Project controller loaded');

export const createProject = async (req, res) => {
  const { title, description, budgetMin, budgetMax, deadline } = req.body;

  if (!title || !description || !budgetMin || !budgetMax || !deadline) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
   
  const buyerId = req.user?.userId;
  
  if (!buyerId) {
    return res.status(401).json({ message: 'Unauthorized: User not authenticated' });
  }

  try {
    const project = await prisma.project.create({
      data: {
        title,
        description,
        budgetMin: Number(budgetMin),
        budgetMax: Number(budgetMax),
        deadline: new Date(deadline),
        buyerId: Number(buyerId),  // Explicitly setting buyerId
        status: ProjectStatus.OPEN
      },
    });

    res.status(201).json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
};
export const getAllProjects = async (req, res) => {
  const userId = req.user.userId;
  const userRole = req.user.role;

  try {
    let projects;

    if (userRole === 'BUYER') {
      projects = await prisma.project.findMany({
        where: { buyerId: userId },
        orderBy: { createdAt: 'desc' },
        include: {
          buyer: { select: { id: true, name: true, email: true } },
          bids: {
            include: {
              seller: { select: { id: true, name: true, email: true } }
            }
          },
        },
      });
    } else if (userRole === 'SELLER') {
      projects = await prisma.project.findMany({
        where: { 
          OR: [
            { status: 'OPEN' },
            { status: 'PENDING' }
          ],
          sellerId: null
        },
        orderBy: { createdAt: 'desc' },
        include: {
          buyer: { select: { id: true, name: true, email: true } },
          bids: true,
        },
      });
    } else {
      return res.status(403).json({ message: 'Invalid user role' });
    }

    res.status(200).json(projects);
  } catch (err) {
    console.error('[getAllProjects error]', err);
    res.status(500).json({ message: 'Failed to fetch projects' });
  }
};

export const getSingleProject = async (req, res) => {
  const projectId = parseInt(req.params.id); // ✅ Ensure integer

  if (isNaN(projectId)) {
    return res.status(400).json({ message: 'Invalid project ID' });
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        buyer: {
          select: { id: true, name: true, email: true },
        },
        seller: {
          select: { id: true, name: true, email: true },
        },
        deliverables: true, // ✅ Include deliverables
        bids: {
          include: {
            seller: { select: { id: true, name: true, email: true } }
          }
        }
      },
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project);
  } catch (err) {
    console.error('❌ Error in getSingleProject:', err);
    res.status(500).json({ message: 'Failed to fetch project' });
  }
};



export const selectSeller = async (req, res) => {
  const buyerId = req.user.userId; // 🔐 from JWT
  const projectId = Number(req.params.id);
  const { sellerId } = req.body;

  if (!sellerId) {
    return res.status(400).json({ message: 'Seller ID is required' });
  }

  try {
    // 🔍 Make sure the project exists and belongs to the logged-in buyer
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.buyerId !== buyerId) {
      return res.status(403).json({ message: 'You are not authorized to select a seller for this project' });
    }

    // ✅ Update project with seller and status
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        sellerId: Number(sellerId),
        status: 'IN_PROGRESS',
      },
    });

    res.status(200).json(updatedProject);
  } catch (err) {
    console.error('[selectSeller error]', err);
    res.status(500).json({ message: 'Could not select seller' });
  }
};


export const markProjectComplete = async (req, res) => {
  const buyerId = req.user.userId; // from JWT
  const projectId = Number(req.params.id);

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.buyerId !== buyerId) {
      return res.status(403).json({ message: 'You are not authorized to complete this project' });
    }

    if (project.status !== 'IN_PROGRESS') {
      return res.status(400).json({ message: 'Project must be in progress to complete it' });
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: {
        status: 'COMPLETED',
      },
    });

    res.status(200).json({ message: 'Project marked as completed', project: updated });
  } catch (err) {
    console.error('[markProjectComplete error]', err);
    res.status(500).json({ message: 'Could not complete project' });
  }
};
export const getMyProjects = async (req, res) => {
  const buyerId = req.user.userId;

  try {
    const projects = await prisma.project.findMany({
      where: { buyerId },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(projects);
  } catch (err) {
    console.error('[getMyProjects] Error:', err);
    res.status(500).json({ message: 'Failed to fetch your projects' });
  }
};

export const acceptBid = async (req, res) => {
  const { projectId, sellerId } = req.body;

  try {
    // ✅ 1. Update project
    const project = await prisma.project.update({
      where: { id: parseInt(projectId) },
      data: {
        sellerId: parseInt(sellerId),
        status: 'IN_PROGRESS',
      },
      include: {
        seller: true,
        buyer: true,
      },
    });

    // ✅ 2. Send email to selected seller
    await sendMail({
      to: project.seller.email,
      subject: `🎉 You've been awarded the project "${project.title}"`,
      html: `
        <p>Hi <strong>${project.seller.name}</strong>,</p>
        <p>Congratulations! You've been selected by <strong>${project.buyer.name}</strong> for the project:</p>
        <h3>${project.title}</h3>
        <p><strong>Status:</strong> In Progress</p>
        <p>Please begin your work and stay in contact with the buyer.</p>
        <br/>
        <p>Thanks,<br/>Seller-Buyer App</p>
      `,
    });

    res.status(200).json({ message: '✅ Seller selected and notified' });
  } catch (err) {
    console.error('[acceptBid error]', err);
    res.status(500).json({ message: '❌ Failed to accept seller' });
  }
};


export const getSellerProjects = async (req, res) => {


  const sellerId = req.user.userId;
  if (!sellerId) {
    console.log('❌ sellerId is missing');
    return res.status(400).json({ message: 'Invalid seller ID' });
  }

  try {
    const projects = await prisma.project.findMany({
      where: { sellerId },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        deadline: true,
        budgetMin: true,
        budgetMax: true,
      },
    });

    res.json(projects);
  } catch (err) {
    console.error('❌ Error in getSellerProjects:', err);
    res.status(500).json({ message: 'Failed to fetch project' });
  }
};


export const assignSeller = async (req, res) => {
  const { projectId, sellerId } = req.body;

  if (!projectId || !sellerId) {
    return res.status(400).json({ message: 'projectId and sellerId required' });
  }

  try {
    const updated = await prisma.project.update({
      where: { id: Number(projectId) },
      data: { sellerId: Number(sellerId) },
    });

    res.json({ message: 'Seller assigned to project', updated });
  } catch (err) {
    console.error('❌ Error in assignSeller:', err);
    res.status(500).json({ message: 'Failed to assign seller' });
  }
};

// For getting a single project (if needed)

