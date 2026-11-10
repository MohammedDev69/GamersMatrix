import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { SupabaseJwtService } from './supabase-jwt.service';

@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthService, SupabaseJwtService, JwtAuthGuard],
  exports: [AuthService, SupabaseJwtService, JwtAuthGuard],
})
export class AuthModule {}
