import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { AblyService } from './ably.service';

@Controller('realtime')
export class RealtimeController {
    constructor(private readonly ablyService: AblyService) { }

    @Get('ably-token')
    async getAblyToken(@Query('roomCode') roomCode: string) {
        const code = (roomCode ?? '').trim();
        if (!/^\d{6}$/.test(code)) {
            throw new BadRequestException('roomCode phải là 6 chữ số');
        }

        const data = await this.ablyService.getAblyTokenRequest(code);
        return {
            message: 'Lấy token Ably thành công',
            data,
        };
    }
}

