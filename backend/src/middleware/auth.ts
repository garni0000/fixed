import { Request, Response, NextFunction } from 'express';
import { verifyFirebaseToken } from '../config/firebase.js';
import { DecodedIdToken } from 'firebase-admin/auth';
import { prisma } from '../server.js';

declare global {
  namespace Express {
    interface Request {
      user?: DecodedIdToken;
      dbUser?: any;
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decodedToken = await verifyFirebaseToken(token);
    req.user = decodedToken;

    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const requireAuth = [authenticateToken];

export const getUserFromDB = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const dbUser = await prisma.user.findUnique({
      where: { firebaseId: req.user.uid }
    });

    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    req.dbUser = dbUser;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Database error' });
  }
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      return res.status(500).json({ error: 'Admin email not configured' });
    }

    if (!req.user.email || req.user.email !== adminEmail) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    return res.status(500).json({ error: 'Admin verification error' });
  }
};
