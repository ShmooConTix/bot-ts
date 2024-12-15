import { sleep } from "bun";
import { globalConfig } from ".";
import { logger } from "./logger";
import type { WebsocketMessage } from "./types";
import { BotThread } from "./botThread";

const API_WS_URL = `ws://localhost:2000/client`;
const socket = new WebSocket(API_WS_URL);

export async function initalizeBot() {
    logger.info(`connected to api ws at ${API_WS_URL}`);

    while (socket.readyState === 0) await sleep(200);

    socket.send(JSON.stringify({
        type: 'identify',
        data: {
            clientName: `TypeScript Client (pw, ${globalConfig.devMode ? 'dev' : 'prod'})`,
            clientCodename: `ts`
        }
    }));

    const initalizationData: WebsocketMessage = await waitForWebsocketMessageType('initalize', 3 * 60000);
    if (initalizationData.type !== 'initalize') {
        logger.error(`type of inital websocket message isn't initalize`);
        process.exit(1);
    }

    logger.info(`# of users running = ${initalizationData.data.users.length}`);

    globalConfig.landingServer = initalizationData.data.landingURL;
    globalConfig.ticketServer = initalizationData.data.baseURL;

    const allThreadPromises: Promise<void>[] = [];

    for (const user of initalizationData.data.users) {
        const t = new BotThread(user);
        allThreadPromises.push(t.startTask());
    }

    // should, in theory, stop when all checkouts have completed
    await Promise.all(allThreadPromises);
}

// global ws, will send multiple
export function sendWebsocketData(type: string, data: any) {
    socket.send(JSON.stringify({
        type,
        data,
    }));
}

export function updateStatus(status: string) {
    if (globalConfig.currentStatus === status) return;

    globalConfig.currentStatus = status;

    socket.send(JSON.stringify({
        type: 'status',
        data: {
            status: status
        }
    }));
}

export function waitForWebsocketMessageType(messageType: string, timeout: number): Promise<WebsocketMessage> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            socket.removeEventListener('message', messageHandler);
            reject(new Error(`timeout waiting for message type: ${messageType}`));
        }, timeout);

        const messageHandler = (message: MessageEvent) => {
            const data = JSON.parse(message.data) as WebsocketMessage;
            if (data.type === messageType) {
                clearTimeout(timer);
                socket.removeEventListener('message', messageHandler);
                resolve(data);
            }
        };

        socket.addEventListener('message', messageHandler);
    });
}