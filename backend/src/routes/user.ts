import { Router } from 'express';
import { authenticateToken, getUserFromDB } from '../middleware/auth.js';
import { prisma } from '../server.js';

const router = Router();

// Get user profile with subscription info
router.get('/profile', authenticateToken, getUserFromDB, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { firebaseId: req.user!.uid },
      include: {
        subscriptions: {
          where: {
            OR: [
              { status: 'active' },
              { endDate: { gte: new Date() } }
            ]
          },
          orderBy: { createdAt: 'desc' }
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            referrals: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate referral earnings (simplified)
    const referralEarnings = user._count.referrals * 30; // 30% commission

    res.json({
      user: {
        ...user,
        referralEarnings
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Get user subscription status
router.get('/subscription/status', authenticateToken, getUserFromDB, async (req, res) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: req.dbUser.id,
        status: 'active',
        endDate: { gte: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    const hasActiveSubscription = !!subscription;

    res.json({
      hasActiveSubscription,
      subscription,
      canAccessVIP: hasActiveSubscription
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

// Get user referral info
router.get('/referral', authenticateToken, getUserFromDB, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { firebaseId: req.user!.uid },
      include: {
        referrals: {
          select: {
            id: true,
            displayName: true,
            email: true,
            createdAt: true,
            subscriptions: {
              where: { status: 'active' },
              select: { plan: true }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate earnings from referrals
    const totalReferrals = user.referrals.length;
    const activeReferrals = user.referrals.filter(r => r.subscriptions.length > 0).length;
    const earnings = activeReferrals * 30; // 30% commission per referral

    res.json({
      referralCode: user.referralCode,
      totalReferrals,
      activeReferrals,
      earnings,
      referrals: user.referrals
    });
  } catch (error) {
    console.error('Get referral error:', error);
    res.status(500).json({ error: 'Failed to get referral info' });
  }
});

export { router as userRouter };
