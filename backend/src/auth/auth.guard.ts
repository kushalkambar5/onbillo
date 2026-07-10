import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { verifyToken } from '@clerk/backend';
import { DbService } from '../db/db.service';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private dbService: DbService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid token');
    }

    const token = authHeader.split(' ')[1];

    try {
      // Verify the token with Clerk
      const verifiedToken = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      const clerkId = verifiedToken.sub;

      // Lookup internal user in the database
      const [user] = await this.dbService.db
        .select()
        .from(users)
        .where(eq(users.clerkId, clerkId))
        .limit(1);

      if (!user) {
        throw new UnauthorizedException('User not found in database');
      }

      // Attach the internal user object to the request
      request.user = user;
      request.clerkId = clerkId;

      // Allow fetching profile details even if not premium or banned
      const urlPath = request.url.split('?')[0];
      const isGetMe = (urlPath === '/api/users/me' || urlPath === '/api/users/me/') && request.method === 'GET';

      if (user.isBanned && !isGetMe) {
        throw new ForbiddenException('Your account has been banned. Please contact support.');
      }

      if (!user.isPremium && !isGetMe) {
        throw new ForbiddenException('Premium subscription required. Please contact +919035035884');
      }

      return true;
    } catch (error) {
      console.error('AuthGuard error:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
