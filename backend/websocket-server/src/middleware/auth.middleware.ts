import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export const authMiddleware = (socket: Socket, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      logger.warn(`Connection attempt without token from ${socket.handshake.address}`);
      return next(new Error('Authentication token required'));
    }

    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    // Attach user info to socket
    (socket as any).userId = decoded.sub;
    (socket as any).userEmail = decoded.email;
    (socket as any).userRole = decoded.role;

    logger.info(`User authenticated: ${decoded.email} (ID: ${decoded.sub})`);
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn(`Invalid token from ${socket.handshake.address}: ${error.message}`);
      return next(new Error('Invalid authentication token'));
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn(`Expired token from ${socket.handshake.address}`);
      return next(new Error('Authentication token expired'));
    }

    logger.error('Authentication error:', error);
    return next(new Error('Authentication failed'));
  }
};
