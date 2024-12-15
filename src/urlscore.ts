import type { Locator } from "playwright";
import { globalConfig } from "./index.ts";

/*
    Requirements:
        - "a" tag
        - In HTML body
        - 
*/

// TODO: Parent?

const negativeParentTags = [
    'ul',
    'li',
    'h1',
    'head'
];

export class URLScore {
    readonly originalURL: string;
    readonly url: URL;
    locator: Locator;
    score: number = 0;

    constructor(selector: Locator, href: string) {
        this.locator = selector;
        this.originalURL = href;


        try {
            if (this.originalURL.startsWith("/")) {
                this.url = new URL("https://relative.com" + this.originalURL);
            } else {
                this.url = new URL(this.originalURL);
            }
        } catch {
            this.url = new URL("https://relative.com/1234");
        }
    }

    public async getScore(): Promise<number> {
        this.score = 0;

        const parent = this.locator.locator('..');

        const locatorPromise = this.locator.getAttribute("style");
        const innerTextPromise = this.locator.innerText();
        const parentPromise = parent.evaluate(node => node.tagName.toLowerCase());

        await Promise.all([
            locatorPromise,
            innerTextPromise,
            parentPromise
        ]);

        // TEXT DECORATIONS
        const locatorStyle = await locatorPromise;
        
        if (locatorStyle && locatorStyle.includes("text-decoration")) {
            this.score -= 2;
        }

        // https

        // https://twitter.com/gdead/status/1863274478815289509
        // supposedly, you can auto-upgrade???

        if (this.url.protocol === "http:") {
            this.score += 5;
        } else {
            this.score -= 5;
        }

        // relative URLs
        if (this.url.hostname === 'relative.com') {
            this.score -= 40;
        } else {
            this.score += 40;
        }

        // empty text
        if ((await innerTextPromise).length < 3) {
            this.score -= 20;
        } else {
            this.score += 20;
        }

        // parent
        const parentTagName = await parentPromise;
        
        if (parentTagName === 'p') {
            this.score += 10;
        } else if (parentTagName === 'body') {
            this.score += 2;
        } else if (negativeParentTags.includes(parentTagName)) {
            this.score -= 10;
        }

        // less reputable scores in dev mode
        if (!globalConfig.devMode && this.url.hostname !== 'tix.shmoocon.org') {
            this.score -= 20;
        }

        if (this.url.pathname.toLowerCase().includes("form_")) {
            this.score += 50;
        } else {
            this.score -= 50;
        }

        if (!globalConfig.devMode && this.url.pathname.toLowerCase().includes(".html")) {
            this.score += 25
        } else if (!globalConfig.devMode) {
            this.score -= 25;
        }

        return this.score;
    }
}
