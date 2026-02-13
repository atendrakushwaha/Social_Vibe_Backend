import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, Request } from '@nestjs/common';
import { CallsService } from './calls.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InitiateCallDto, UpdateCallStatusDto, AnswerCallDto } from './dto/call.dto';

@Controller('calls')
@UseGuards(JwtAuthGuard)
export class CallsController {
    constructor(private readonly callsService: CallsService) { }

    /**
     * Initiate a new call (audio or video)
     * POST /calls/initiate
     */
    @Post('initiate')
    async initiateCall(@Request() req, @Body() dto: InitiateCallDto) {
        const call = await this.callsService.createCall(
            req.user.sub,
            dto.receiverId,
            dto.callType,
            dto.conversationId,
        );
        return {
            message: 'Call initiated',
            call,
        };
    }

    /**
     * Answer a call
     * PATCH /calls/:id/answer
     */
    @Patch(':id/answer')
    async answerCall(
        @Request() req,
        @Param('id') callId: string,
        @Body() dto: AnswerCallDto,
    ) {
        const status = dto.accept ? 'answered' : 'rejected';
        const call = await this.callsService.updateCallStatus(callId, status as any);
        return {
            message: `Call ${status}`,
            call,
        };
    }

    /**
     * End a call
     * PATCH /calls/:id/end
     */
    @Patch(':id/end')
    async endCall(@Param('id') callId: string) {
        const call = await this.callsService.updateCallStatus(callId, 'ended' as any);
        return {
            message: 'Call ended',
            call,
        };
    }

    /**
     * Update call status (generic)
     * PATCH /calls/:id/status
     */
    @Patch(':id/status')
    async updateCallStatus(
        @Param('id') callId: string,
        @Body() dto: UpdateCallStatusDto,
    ) {
        const call = await this.callsService.updateCallStatus(callId, dto.status);
        return {
            message: 'Call status updated',
            call,
        };
    }

    /**
     * Get call history
     * GET /calls/history
     */
    @Get('history')
    async getCallHistory(
        @Request() req,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.callsService.getCallHistory(req.user.sub, page, limit);
    }

    /**
     * Get a specific call
     * GET /calls/:id
     */
    @Get(':id')
    async getCall(@Param('id') callId: string) {
        return this.callsService.getCall(callId);
    }

    /**
     * Get missed calls count
     * GET /calls/missed/count
     */
    @Get('missed/count')
    async getMissedCallsCount(@Request() req) {
        const count = await this.callsService.getMissedCallsCount(req.user.sub);
        return { count };
    }

    /**
     * Get call statistics
     * GET /calls/stats
     */
    @Get('stats/summary')
    async getCallStats(@Request() req) {
        return this.callsService.getCallStats(req.user.sub);
    }

    /**
     * Delete a call from history
     * DELETE /calls/:id
     */
    @Delete(':id')
    async deleteCall(@Request() req, @Param('id') callId: string) {
        await this.callsService.deleteCall(req.user.sub, callId);
        return { message: 'Call deleted from history' };
    }
}
