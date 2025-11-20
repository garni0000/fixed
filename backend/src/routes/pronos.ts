import { Router } from 'express';
import { authenticateToken, getUserFromDB } from '../middleware/auth.js';
import { prisma } from '../server.js';

const router = Router();

// Get pronos by date
router.get('/', authenticateToken, getUserFromDB, async (req, res) => {
  try {
    const { date, limit = '10', offset = '0' } = req.query;

    let whereClause: any = {
      isPublished: true
    };

    if (date) {
      const targetDate = new Date(date as string);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      whereClause.date = {
        gte: targetDate,
        lt: nextDay
      };
    }

    const pronos = await prisma.prono.findMany({
      where: whereClause,
      orderBy: { date: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    const total = await prisma.prono.count({ where: whereClause });

    res.json({
      pronos,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });
  } catch (error) {
    console.error('Get pronos error:', error);
    res.status(500).json({ error: 'Failed to get pronos' });
  }
});

// Get prono by ID
router.get('/:id', authenticateToken, getUserFromDB, async (req, res) => {
  try {
    const { id } = req.params;

    const prono = await prisma.prono.findUnique({
      where: { id }
    });

    if (!prono) {
      return res.status(404).json({ error: 'Prono not found' });
    }

    // Check if user has active subscription for premium content
    const hasActiveSubscription = await prisma.subscription.findFirst({
      where: {
        userId: req.dbUser.id,
        status: 'active',
        endDate: { gte: new Date() }
      }
    });

    // If prono is premium and user doesn't have subscription, return limited data
    if (!hasActiveSubscription && prono.prediction.includes('VIP')) {
      return res.json({
        prono: {
          ...prono,
          analysis: 'Contenu VIP - Abonnement requis',
          prediction: 'Contenu VIP - Abonnement requis'
        }
      });
    }

    res.json({ prono });
  } catch (error) {
    console.error('Get prono error:', error);
    res.status(500).json({ error: 'Failed to get prono' });
  }
});

// Get today's pronos
router.get('/date/today', authenticateToken, getUserFromDB, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const pronos = await prisma.prono.findMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow
        },
        isPublished: true
      },
      orderBy: { date: 'desc' }
    });

    res.json({ pronos });
  } catch (error) {
    console.error('Get today pronos error:', error);
    res.status(500).json({ error: 'Failed to get today pronos' });
  }
});

// Get yesterday's pronos
router.get('/date/yesterday', authenticateToken, getUserFromDB, async (req, res) => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const today = new Date(yesterday);
    today.setDate(today.getDate() + 1);

    const pronos = await prisma.prono.findMany({
      where: {
        date: {
          gte: yesterday,
          lt: today
        },
        isPublished: true
      },
      orderBy: { date: 'desc' }
    });

    res.json({ pronos });
  } catch (error) {
    console.error('Get yesterday pronos error:', error);
    res.status(500).json({ error: 'Failed to get yesterday pronos' });
  }
});

// Get before yesterday's pronos
router.get('/date/before-yesterday', authenticateToken, getUserFromDB, async (req, res) => {
  try {
    const beforeYesterday = new Date();
    beforeYesterday.setDate(beforeYesterday.getDate() - 2);
    beforeYesterday.setHours(0, 0, 0, 0);
    const yesterday = new Date(beforeYesterday);
    yesterday.setDate(yesterday.getDate() + 1);

    const pronos = await prisma.prono.findMany({
      where: {
        date: {
          gte: beforeYesterday,
          lt: yesterday
        },
        isPublished: true
      },
      orderBy: { date: 'desc' }
    });

    res.json({ pronos });
  } catch (error) {
    console.error('Get before yesterday pronos error:', error);
    res.status(500).json({ error: 'Failed to get before yesterday pronos' });
  }
});

export { router as pronosRouter };
