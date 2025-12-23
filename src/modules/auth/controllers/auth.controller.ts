import { Body, Controller, Post, Get, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { ExchangeTokenDto } from '../dto/exchange-token.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { ResponseMessage } from '@app/core/decorators/response-message.decorator';
import { AuthGuard } from '../guards';
import { CurrentUser, AuthenticatedUser, Public } from '../decorators';
import {
  ApiRegister,
  ApiLogin,
  ApiExchangeToken,
  ApiGetMe,
  ApiRefreshToken,
  ApiGoogleAuth,
  ApiSwitchTenant,
} from '../docs';

import { SendVerificationDto } from '../dto/send-verification.dto';
import { VerifyEmailDto } from '../dto/verify-email.dto';
import { GoogleAuthDto } from '../dto/google-auth.dto';
import { SwitchTenantDto } from '../dto/switch-tenant.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-verification-code')
  @Public()
  @ResponseMessage({ message: 'Verification code sent successfully' })
  async sendVerificationCode(@Body() dto: SendVerificationDto) {
    return this.authService.sendVerificationCode(dto);
  }

  @Post('verify-email')
  @Public()
  @ResponseMessage({ message: 'Email verified successfully' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.email, dto.code);
  }

  @Post('register')
  @ApiRegister()
  @ResponseMessage({
    message: 'Account created successfully',
    successCode: 201,
  })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiLogin()
  @ResponseMessage({ message: 'Login successful' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('exchange-token')
  @Public()
  @ApiExchangeToken()
  @ResponseMessage({ message: 'Token exchanged successfully' })
  async exchangeToken(@Body() dto: ExchangeTokenDto) {
    return this.authService.exchangeCustomToken(
      dto.custom_token,
      dto.tenant_slug,
    );
  }

  @Post('refresh-token')
  @Public()
  @ApiRefreshToken()
  @ResponseMessage({ message: 'Token refreshed successfully' })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refresh_token, dto.tenant_slug);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiGetMe()
  @ResponseMessage({ message: 'User retrieved successfully' })
  async getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getMe(user.firebase_uid);
  }

  @Post('google')
  @Public()
  @ApiGoogleAuth()
  @ResponseMessage({ message: 'Google authentication successful' })
  async googleAuth(@Body() dto: GoogleAuthDto) {
    return this.authService.googleAuth(
      dto.idToken,
      dto.organisationSubdomain,
      dto.organisationName,
    );
  }

  @Post('switch-tenant')
  @UseGuards(AuthGuard)
  @ApiSwitchTenant()
  @ResponseMessage({ message: 'Tenant switched successfully' })
  async switchTenant(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SwitchTenantDto,
  ) {
    // Use the authenticated user's email for tenant switch validation
    return this.authService.switchTenant(user.email, dto.tenantSlug);
  }
}
