import { Router } from 'express';
import { authenticateToken, getUserFromDB } from '../middleware/auth.js';
import { prisma } from '../server.js';

const router = Router();

// Register/Login user
router.post('/register', authenticateToken, async (req, res) => {
  try {
    const { referralCode } = req.body;

    const firebaseUser = req.user;
    if (!firebaseUser || !firebaseUser.email) {
      return res.status(400).json({ error: 'Firebase user email is required' });
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { firebaseId: firebaseUser.uid }
    });

    if (user) {
      return res.json({ user, message: 'User already exists' });
    }

    // Handle referral
    let referredBy: string | null = null;
    if (referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode }
      });
      if (referrer) {
        referredBy = referrer.id;
      }
    }

    const displayName = firebaseUser.name || firebaseUser.email.split('@')[0];

    // Create new user
    user = await prisma.user.create({
      data: {
        firebaseId: firebaseUser.uid,
        email: firebaseUser.email,
        displayName,
        photoURL: firebaseUser.picture,
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
