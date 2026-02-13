
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminService } from './admin.service';

// Basic admin check - in production you'd use a dedicated RolesGuard
@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('dashboard')
    getDashboard() {
        return this.adminService.getDashboardStats();
    }

    @Get('users')
    getUsers(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
        return this.adminService.getAllUsers(page, limit);
    }

    @Put('users/:id/ban')
    banUser(@Param('id') userId: string) {
        return this.adminService.banUser(userId);
    }

    @Put('users/:id/unban')
    unbanUser(@Param('id') userId: string) {
        return this.adminService.unbanUser(userId);
    }

    @Get('posts')
    getPosts(@Query('page') page: number = 1, @Query('limit') limit: number = 10) {
        return this.adminService.getAllPosts(page, limit);
    }

    @Delete('posts/:id')
    deletePost(@Param('id') postId: string) {
        return this.adminService.deletePost(postId);
    }
}
