import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/decorators/current-user.decorator';
import { AdminService } from './admin.service';
import {
  AddKeysDto,
  CreateProductDto,
  UpdateProductDto,
} from './dto/admin-product.dto';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  UpdateOrderStatusDto,
  UpdateSettingsDto,
  UpdateUserRoleDto,
} from './dto/admin-extra.dto';
import { TransitionPublicationDto } from './dto/publication.dto';
import { PublicationStatus, ProductKind } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles(Role.ADMIN, Role.EDITOR)
@RequirePermissions('admin:access')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @RequirePermissions('orders:read')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('categories')
  @RequirePermissions('products:read')
  listCategories() {
    return this.adminService.listCategories();
  }

  @Post('categories')
  @RequirePermissions('categories:write')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.adminService.createCategory(dto);
  }

  @Patch('categories/:id')
  @RequirePermissions('categories:write')
  updateCategory(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.adminService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  @Roles(Role.ADMIN)
  @RequirePermissions('categories:write')
  deleteCategory(@Param('id') id: string) {
    return this.adminService.deleteCategory(id);
  }

  @Get('products')
  @RequirePermissions('products:read')
  listProducts(
    @Query('q') q?: string,
    @Query('categoryId') categoryId?: string,
    @Query('status') status?: PublicationStatus,
    @Query('kind') kind?: ProductKind,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.adminService.listProducts({
      q,
      categoryId,
      status,
      kind,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 20,
    });
  }

  @Get('products/slug-available')
  @RequirePermissions('products:write')
  slugAvailable(
    @Query('slug') slug: string,
    @Query('excludeId') excludeId?: string,
  ) {
    return this.adminService.ensureSlugAvailable(slug, excludeId);
  }

  @Post('products')
  @RequirePermissions('products:write')
  createProduct(@Body() dto: CreateProductDto) {
    return this.adminService.createProduct(dto);
  }

  @Patch('products/:id')
  @RequirePermissions('products:write')
  updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.adminService.updateProduct(id, dto);
  }

  @Post('products/:id/publication')
  @RequirePermissions('products:publish')
  transitionPublication(
    @Param('id') id: string,
    @Body() dto: TransitionPublicationDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.adminService.transitionProductPublication(id, dto, user.id);
  }

  @Delete('products/:id')
  @Roles(Role.ADMIN)
  @RequirePermissions('products:write')
  deleteProduct(@Param('id') id: string) {
    return this.adminService.deleteProduct(id);
  }

  @Post('products/:id/keys')
  @RequirePermissions('keys:write')
  addKeys(@Param('id') id: string, @Body() dto: AddKeysDto) {
    return this.adminService.addKeys(id, dto);
  }

  @Get('products/:id/keys')
  @RequirePermissions('keys:write')
  listKeys(@Param('id') id: string) {
    return this.adminService.listKeys(id);
  }

  @Delete('keys/:id')
  @RequirePermissions('keys:write')
  deleteKey(@Param('id') id: string) {
    return this.adminService.deleteKey(id);
  }

  @Get('orders')
  @RequirePermissions('orders:read')
  listOrders(@Query('q') q?: string) {
    return this.adminService.listOrders(q);
  }

  @Get('customers')
  @RequirePermissions('customers:read')
  listCustomers(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.adminService.listCustomers(
      q,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
    );
  }

  @Get('customers/:id')
  @RequirePermissions('customers:read')
  getCustomer(@Param('id') id: string) {
    return this.adminService.getCustomer(id);
  }

  @Get('users')
  @Roles(Role.ADMIN)
  @RequirePermissions('settings:write')
  listAdminUsers() {
    return this.adminService.listAdminUsers();
  }

  @Patch('users/:id/role')
  @Roles(Role.ADMIN)
  @RequirePermissions('settings:write')
  updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.adminService.updateUserRole(id, dto.role, user.id);
  }

  @Get('orders/:id')
  @RequirePermissions('orders:read')
  getOrder(@Param('id') id: string) {
    return this.adminService.getOrder(id);
  }

  @Patch('orders/:id/status')
  @RequirePermissions('orders:write')
  updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.adminService.updateOrderStatus(id, dto);
  }

  /** Safe retry: fulfill paid orders without charging again. */
  @Post('orders/:id/reconcile-fulfillment')
  @Roles(Role.ADMIN)
  @RequirePermissions('orders:write')
  reconcileFulfillment(@Param('id') id: string) {
    return this.adminService.reconcileFulfillment(id);
  }

  @Get('audit')
  @RequirePermissions('audit:read')
  listAudit(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.adminService.listAuditLogs(
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 30,
    );
  }

  @Get('settings')
  @RequirePermissions('admin:access')
  getSettings() {
    return this.adminService.getStoreSettings();
  }

  @Patch('settings')
  @Roles(Role.ADMIN)
  @RequirePermissions('settings:write')
  updateSettings(
    @Body() dto: UpdateSettingsDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.adminService.updateStoreSettings(dto, user.id);
  }
}
