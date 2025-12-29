import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtRefreshAuthGuard } from './guards/jwt-refresh-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản mới' })
  @ApiBody({ type: RegisterDto })
  @ApiOkResponse({ type: AuthResponseDto })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ type: AuthResponseDto })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshAuthGuard)
  @ApiOperation({ summary: 'Lấy access token mới bằng refresh token' })
  @ApiOkResponse({ type: AuthResponseDto })
  async refresh(@Req() req: any): Promise<AuthResponseDto> {
    return this.authService.refresh(req.user.user_id);
  }

  @Post('logout')
  @UseGuards(JwtRefreshAuthGuard)
  @ApiOperation({ summary: 'Đăng xuất và thu hồi refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiOkResponse({ schema: { example: { message: 'Logged out successfully' } } })
  async logout(@Body() refreshTokenDto: RefreshTokenDto): Promise<{ message: string }> {
    await this.authService.revokeRefreshToken(refreshTokenDto.refresh_token);
    return { message: 'Logged out successfully' };
  }
}
