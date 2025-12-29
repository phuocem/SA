import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RolesController } from './roles.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { RolesService } from './roles.service';
import { RoleInitializer } from './role-initializer.service';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy, RolesService, RoleInitializer],
  controllers: [AuthController, RolesController],
  exports: [AuthService, JwtModule, PassportModule, RolesService],
})
export class AuthModule {}
