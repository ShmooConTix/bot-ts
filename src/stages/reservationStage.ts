import { PurchasingStage } from "./purchasingStage";
import { sleep } from "bun";

export class ReservationStage extends PurchasingStage {
  async start() {
    if (!this.thread || !this.thread.page) return;

    this.thread.logMessage(
      `reservation stage started, current url: ${this.thread.page.url()}`,
      "info"
    );

    await sleep(Math.floor(Math.random() * 10000) + 10000);

    const inputs = await this.thread.page.$$(
      'body form input[type="text"], body form input[type="email"], body form input[type="password"], body form input[type="search"], body form input[type="tel"], body form input[type="url"], body form textarea'
    );

    if (inputs.length === 0) {
      this.thread.logMessage("No input fields found in the form.", "error");
      return;
    }

    this.thread.logMessage(`found input fields`, "info");

    await inputs[0].fill(this.thread.user.email);

    const form = await this.thread.page.$("form");
    if (!form) {
      this.thread.logMessage("no form found on the page", "error");
      return;
    }

    const submitButton = await form.$(
      'input[type="submit"], button[type="submit"]'
    );
    if (!submitButton) {
      this.thread.logMessage("no submit button found in the form", "error");
      return;
    }

    this.thread.logMessage(
      `reservation stage ending, current url: ${this.thread.page.url()}`,
      "info"
    );

    await submitButton.click();
  }
}
