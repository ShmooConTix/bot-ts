import type { BotThread } from "../botThread";

export abstract class PurchasingStage {
    thread: BotThread | null = null;
    constructor(thread: BotThread) {
        this.thread = thread;
    }

    abstract start(): Promise<void>;
}