import { Router } from 'express';
import { authenticateToken, getUserFromDB, requireAdmin } from '../middleware/auth.js';
import { prisma } from '../server.js';
import multer from 'multer';
import path from 'path';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_PATH || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Submit payment request (crypto or mobile money)
router.post('/submit', authenticateToken, getUserFromDB, upload.single('proof'), async (req, res) => {
  try {
    const {
      amount,
      method,
      cryptoAddress,
      cryptoTxHash,
      mobileNumber,
      mobileProvider,
      notes
    } = req.body;

    if (!amount || !method) {
      return res.status(400).json({ error: 'Amount and method are required' });
    }

    if (method === 'crypto' && !cryptoAddress) {
      return res.status(400).json({ error: 'Crypto address is required for crypto payments' });
    }

    if (method === 'mobile_money' && (!mobileNumber || !mobileProvider)) {
      return res.status(400).json({ error: 'Mobile number and provider are required for mobile money payments' });
    }

    const proofImageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const payment = await prisma.payment.create({
      data: {
        userId: req.dbUser.id,
        amount: parseFloat(amount),
        method,
        cryptoAddress,
        cryptoTxHash,
        mobileNumber,
        mobileProvider,
        proofImageUrl,
        notes,
        status: 'pending'
      }
    });

    res.status(201).json({
      payment,
      message: 'Payment request submitted successfully. It will be reviewed by our team.'
    });
  } catch (error) {
    console.error('Submit payment error:', error);
    res.status(500).json({ error: 'Failed to submit payment request' });
  }
});

// Get user's payment history
router.get('/history', authenticateToken, getUserFromDB, async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId: req.dbUser.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ payments });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ error: 'Failed to get payment history' });
  }
});

// Admin: Get all payments
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, page = '1', limit = '10' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const whereClause: any = {};
    if (status) {
      whereClause.status = status;
    }

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, displayName: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit as string)
    });

    const total = await prisma.payment.count({ where: whereClause });

    res.json({
      payments,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({ error: 'Failed to get payments' });
  }
});

// Admin: Process payment (approve/reject)
router.put('/admin/:id/process', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['completed', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be completed or rejected' });
    }

    const payment = await prisma.payment.update({
      where: { id },
      data: {
        status,
        notes,
        processedBy: req.user!.email,
        processedAt: new Date()
      },
      include: {
        user: {
          select: { id: true, displayName: true, email: true }
        }
      }
    });

    // If payment is completed, create/update subscription
    if (status === 'completed') {
      // Determine subscription plan based on amount
      let plan = 'basic';
      let durationDays = 30;

      if (payment.amount >= 100) {
        plan = 'vip';
        durationDays = 90;
      } else if (payment.amount >= 50) {
        plan = 'premium';
        durationDays = 60;
      }

      // Check if user already has an active subscription
      const existingSubscription = await prisma.subscription.findFirst({
        where: {
          userId: payment.userId,
          status: 'active',
          endDate: { gte: new Date() }
        }
      });

      if (existingSubscription) {
        // Extend existing subscription
        await prisma.subscription.update({
          where: { id: existingSubscription.id },
          data: {
            endDate: new Date(existingSubscription.endDate.getTime() + durationDays * 24 * 60 * 60 * 1000)
          }
        });
      } else {
        // Create new subscription
        await prisma.subscription.create({
          data: {
            userId: payment.userId,
            plan,
            status: 'active',
            startDate: new Date(),
            endDate: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
          }
        });
      }
    }

    res.json({ payment });
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

export { router as paymentRouter };
