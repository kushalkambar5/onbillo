import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { verifyToken, createClerkClient } from '@clerk/backend';
import { DbService } from '../db/db.service';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class AuthGuard implements CanActivate {
  private clerkClient: ReturnType<typeof createClerkClient> | null = null;
  private secretKey: string;

  constructor(private dbService: DbService) {
    this.secretKey = (process.env.CLERK_SECRET_KEY || '')
      .trim()
      .replace(/^["']|["']$/g, '');
    if (this.secretKey) {
      this.clerkClient = createClerkClient({
        secretKey: this.secretKey,
      });
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];

    try {
      // Verify the token with Clerk
      const verifiedToken = await verifyToken(token, {
        secretKey: this.secretKey,
      });

      const clerkId = verifiedToken.sub;

      // Lookup internal user in the database
      let [user] = await this.dbService.db
        .select()
        .from(users)
        .where(eq(users.clerkId, clerkId))
        .limit(1);

      // Fallback JIT provisioning if user isn't in DB yet (e.g. before webhook or sync lag)
      if (!user && this.clerkClient) {
        try {
          const clerkUser = await this.clerkClient.users.getUser(clerkId);
          if (clerkUser) {
            const email =
              clerkUser.emailAddresses?.find(
                (e: any) => e.id === clerkUser.primaryEmailAddressId,
              )?.emailAddress ??
              clerkUser.emailAddresses?.[0]?.emailAddress ??
              `no-email-${clerkId}@placeholder.local`;

            const name =
              `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() ||
              clerkUser.username ||
              'No Name';

            const phone = clerkUser.phoneNumbers?.[0]?.phoneNumber || null;
            const role =
              (clerkUser.publicMetadata as any)?.role === 'app_admin'
                ? ('app_admin' as const)
                : null;

            const [created] = await this.dbService.db
              .insert(users)
              .values({
                clerkId,
                email,
                name,
                phone,
                role,
              })
              .onConflictDoUpdate({
                target: users.clerkId,
                set: {
                  email,
                  name,
                  phone,
                  updatedAt: new Date(),
                  ...(role === 'app_admin' ? { role } : {}),
                },
              })
              .returning();

            user = created;
          }
        } catch (jitErr) {
          console.error('JIT user provisioning fallback error:', jitErr);
        }
      }

      if (!user) {
        throw new UnauthorizedException('User not found in database');
      }

      // Attach the internal user object to the request
      request.user = user;
      request.clerkId = clerkId;

      // Allow fetching profile details even if not premium or banned
      const rawUrl = request.originalUrl || request.url || '';
      const urlPath = rawUrl.split('?')[0];
      const isGetMe =
        (urlPath === '/api/users/me' ||
          urlPath === '/api/users/me/' ||
          urlPath.endsWith('/users/me')) &&
        request.method === 'GET';

      if (user.isBanned && !isGetMe) {
        throw new ForbiddenException('Your account has been banned. Please contact support.');
      }

      if (!user.isPremium && !isGetMe) {
        throw new ForbiddenException('Premium subscription required. Please contact +919035035884');
      }

      return true;
    } catch (error: any) {
      // Preserve specific HTTP errors (e.g. 'User not found in database',
      // premium/banned rejections) so the client sees the real cause.
      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      console.error('AuthGuard error:', error?.message || error);
      throw new UnauthorizedException(
        error?.message ? `Invalid token: ${error.message}` : 'Invalid token',
      );
    }
  }
}
