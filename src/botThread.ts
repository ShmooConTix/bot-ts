import type { User } from "./types";
import { logger } from "./logger";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { updateStatus } from "./bot";
import { styleText } from "util"
import { RefreshStage } from "./stages/refreshStage";
import { FormStage } from "./stages/formStage";
import { ReservationStage } from "./stages/reservationStage";
import { SuccessStage } from "./stages/successStage";

const HEADLESS = false;

export class BotThread {
    user: User;
    uid: string;
    checkedOut = false;
    browser: Browser | null = null;
    context: BrowserContext | null = null;
    page: Page | null = null;
    // timing
    startTime: number = performance.now();
    checkoutTime: number = 0;
    
    constructor(u: User) {
        this.user = u;
        this.uid = u.email.split("@")[0];
    }

    async startTask(): Promise<void> {
        this.logMessage(`starting task...`, 'info');
        await this.createBrowser();
        updateStatus(`refreshing...`);

        const stages = [
            new RefreshStage(this),
            new FormStage(this),
            new ReservationStage(this),
            new SuccessStage(this),
        ];

        for (const stage of stages) {
            await stage.start();
        }
    }

    async createBrowser() {
        this.logMessage(`starting browser...`, 'info');

        this.browser = await chromium.launch({
            headless: HEADLESS,
            timeout: 0,
        });

        this.context = await this.browser.newContext();

        this.context.on('page', async (newPage) => {
            this.page = newPage;
            await newPage.waitForLoadState();
        });

        this.page = await this.context.newPage();

        this.logMessage(`successfully started browser`, 'info');
    }

    logMessage(message: string, level: 'info' | 'error' | 'warn' | 'debug') {
        logger.log(level, `${styleText('gray', `[${this.uid}]`)} ${message}`);
    }
}