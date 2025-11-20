import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { prisma } from '../server.js';

const router = Router();

// Apply admin middleware to all routes
router.use(authenticateToken, requireAdmin);

// Dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const [totalUsers, totalSubscriptions, totalPayments, pendingPayments] = await Promise.all([
      prisma.user.count(),
      prisma.subscription.count({ where: { status: 'active' } }),
      prisma.payment.count({ where: { status: 'completed' } }),
      prisma.payment.count({ where: { status: 'pending' } })
    ]);

    res.json({
      stats: {
        totalUsers,
        totalSubscriptions,
        totalPayments,
        pendingPayments
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
});

// User management
router.get('/users', async (req, res) => {
  try {
    const { page = '1', limit = '10' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const users = await prisma.user.findMany({
      include: {
        subscriptions: {
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' }
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        _count: {
          select: {
            referrals: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit as string)
    });

    const total = await prisma.user.count();

    res.json({
      users,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Subscription management
router.get('/subscriptions', async (req, res) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      include: {
        user: {
          select: { id: true, displayName: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ subscriptions });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ error: 'Failed to get subscriptions' });
  }
});

// Create/Update subscription manually
router.post('/subscriptions', async (req, res) => {
  try {
    const { userId, plan, startDate, endDate, status = 'active' } = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        plan,
        status,
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      },
      include: {
        user: {
          select: { displayName: true, email: true }
        }
      }
    });

    res.status(201).json({ subscription });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

// Update subscription
router.put('/subscriptions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, endDate } = req.body;

    const subscription = await prisma.subscription.update({
      where: { id },
      data: {
        status,
        endDate: endDate ? new Date(endDate) : undefined
      },
      include: {
        user: {
          select: { displayName: true, email: true }
        }
      }
    });

    res.json({ subscription });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// Prono management
router.get('/pronos', async (req, res) => {
  try {
    const pronos = await prisma.prono.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.json({ pronos });
  } catch (error) {
    console.error('Get pronos error:', error);
    res.status(500).json({ error: 'Failed to get pronos' });
  }
});

// Create prono
router.post('/pronos', async (req, res) => {
  try {
    const {
      title,
      description,
      sport,
      league,
      match,
      prediction,
      odds,
      stake,
      analysis,
      date,
      isPublished = false
    } = req.body;

    const prono = await prisma.prono.create({
      data: {
        title,
        description,
        sport,
        league,
        match,
        prediction,
        odds: parseFloat(odds),
        stake,
        analysis,
        date: new Date(date),
        isPublished
      }
    });

    res.status(201).json({ prono });
  } catch (error) {
    console.error('Create prono error:', error);
    res.status(500).json({ error: 'Failed to create prono' });
  }
});

// Update prono
router.put('/pronos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      sport,
      league,
      match,
      prediction,
      odds,
      stake,
      analysis,
      date,
      isPublished,
      status,
      result
    } = req.body;

    const prono = await prisma.prono.update({
      where: { id },
      data: {
        title,
        description,
        sport,
        league,
        match,
        prediction,
        odds: odds ? parseFloat(odds) : undefined,
        stake,
        analysis,
        date: date ? new Date(date) : undefined,
        isPublished,
        status,
        result
      }
    });

    res.json({ prono });
  } catch (error) {
    console.error('Update prono error:', error);
    res.status(500).json({ error: 'Failed to update prono' });
  }
});

// Delete prono
router.delete('/pronos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.prono.delete({
      where: { id }
    });

    res.json({ message: 'Prono deleted successfully' });
  } catch (error) {
    console.error('Delete prono error:', error);
    res.status(500).json({ error: 'Failed to delete prono' });
  }
});

export { router as adminRouter };
