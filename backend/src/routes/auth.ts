import { Router } from 'express';
import { authenticateToken, getUserFromDB } from '../middleware/auth.js';
import { prisma } from '../server.js';

const router = Router();

// Register/Login user
router.post('/register', authenticateToken, async (req, res) => {
  try {
    const { referralCode } = req.body;

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { firebaseId: req.user!.uid }
    });

    if (user) {
      return res.json({ user, message: 'User already exists' });
    }

    // Handle referral
    let referredBy = null;
    if (referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode }
      });
      if (referrer) {
        referredBy = referrer.id;
      }
    }

    // Create new user
    user = await prisma.user.create({
      data: {
        firebaseId: req.user!.uid,
        email: req.user!.email,
        displayName: req.user!.name || req.user!.email.split('@')[0],
        photoURL: req.user!.picture,
        referredBy
      }
    });

    res.status(201).json({ user });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Get current user profile
router.get('/me', authenticateToken, getUserFromDB, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { firebaseId: req.user!.uid },
      include: {
        subscriptions: {
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, getUserFromDB, async (req, res) => {
  try {
    const { displayName, photoURL } = req.body;

    const user = await prisma.user.update({
      where: { firebaseId: req.user!.uid },
      data: {
        displayName,
        photoURL
      }
    });

    res.json({ user });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export { router as authRouter };
