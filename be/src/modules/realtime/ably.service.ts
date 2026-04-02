import { Injectable, Logger } from '@nestjs/common';
import Ably from 'ably';

@Injectable()
export class AblyService {
    private readonly logger = new Logger(AblyService.name);
    private readonly rest: Ably.Rest;

    constructor() {
        const apiKey = process.env.ABLY_API_KEY;
        if (!apiKey) {
            throw new Error('Thiếu ABLY_API_KEY trong môi trường');
        }

        
        this.rest = new Ably.Rest({ key: apiKey });
    }

    async publishRoomEvent(roomCode: string, eventName: string, payload: unknown) {
        const channelName = `room:${roomCode}`;
        try {
            await this.rest.channels.get(channelName).publish(eventName, payload);
        } catch (err) {
            this.logger.warn(
                `Publish Ably event failed (channel=${channelName}, event=${eventName}): ${String(err)}`,
            );
        }
    }

    async getAblyTokenRequest(roomCode: string) {
        
        const normalizedCode = roomCode.trim();

        const capability = JSON.stringify({
            [`room:${normalizedCode}`]: ['subscribe', 'publish'],
        });

        const tokenDetails = await this.rest.auth.requestToken({
            capability,
        });

        return {
            token: tokenDetails.token,
            expires: tokenDetails.expires,
        };
    }
}

