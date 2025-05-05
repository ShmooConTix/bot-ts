import { mkdir } from "fs/promises";
import { PurchasingStage } from "./purchasingStage";
import { sleep } from "bun";
import { WebhookClient } from "discord.js"
import { randomUUID } from "crypto";

// this is NOT a valid webhook (seriously, you can try it)
const w = new WebhookClient({
  url: "https://discord.com/api/webhooks/1179949324214472856/r0hBtjnc-1mYprgJDV5A7sMmcldck-X2050pfpRYs2OyzBftY9s4DweWf3SbF-U6BQrZ"
});

export class SuccessStage extends PurchasingStage {
  async start() {
    if (!this.thread || !this.thread.page) return;

    await sleep(10000);

    this.thread.logMessage(
      `success stage started, current url: ${this.thread.page.url()}`,
      "info"
    );

    await mkdir("./data", { recursive: true });
    const uuid = randomUUID();

    await this.thread.page.screenshot({
      path: `./data/checkout-success-${uuid}.png`,
    });

    const html = await this.thread.page.content();

    await Bun.write(`./data/checkout-success-${uuid}.html`, html);

    this.thread.logMessage(`all data saved, we *should* be good. uuid is ${uuid}`, "info");

    this.thread.logMessage(
      `success stage ending, current url: ${this.thread.page.url()}`,
      "info"
    );

    this.thread.logMessage("SUCCESSFUL CHECKOUT!!! (hopefully) 🎉🎉🎉", "info");

    await sendSuccessWebhook(this.thread.user.email, uuid, this.thread.checkoutTime);
  }
}


export async function sendSuccessWebhook(email: string, uuid: string, time: number) {
  await w.send({
    content: `**SUCCESSFUL CHECKOUT 🥳🥳**\n\n\`Email:\` ${email}\n\`Ticket Count:\` 2\n\`TTC:\` ${time}\n\nLOCKED IN, AS USUAL.`,
    files: [
      `./data/checkout-success-${uuid}.png`,
      `./data/checkout-success-${uuid}.html`
    ]
  })
}