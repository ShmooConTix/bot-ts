import { PurchasingStage } from "./purchasingStage";
import { sendWebsocketData, waitForWebsocketMessageType } from "../bot";
import { globalConfig } from "..";
import { sleep } from "bun";

const blockedText = [
  "ShmooCon Ticket Reservations",
  "Tickets!! We like tickets!",
  "Ticket Time!",
  "Hello! Welcome to the ticket round. To weed out bots...you gotta play a little game.",
];

export class FormStage extends PurchasingStage {
  async start() {
    if (!this.thread || !this.thread.page) return;

    this.thread.logMessage(
      `form stage started, current url: ${this.thread.page.url()}`,
      "info"
    );
    // attempt to parse the riddle
    // current thinking: list of selectors, go through each, first one to resolve properly wins!
    // fetch ALL text on page and replace from banned list
    // but im still pretty sure its just multiple p's (it's not just one. we have to combine using \n)

    if (!globalConfig.devMode) {
      const h = new URL("http://tix.shmoocon.org").hostname;

      await this.thread.page.waitForURL((u: URL) => {
        return u.hostname.includes(h);
      });
    } else {
      await this.thread.page.waitForURL((u: URL) => {
        return u.pathname.includes("form_");
      });
    }

    this.thread.startTime = performance.now();

    const elements = await this.thread.page.$$("body *");

    let pageText = "";

    for (const element of elements) {
      let text = (await element.innerText()).trim();

      if (!text || text.length === 0) continue;

      blockedText.forEach((block) => {
        text = text.replaceAll(new RegExp(block, "gi"), "");
      });

      pageText += text + "\n\n";
    }

    pageText = pageText.trim();

    sendWebsocketData("riddle", { question: pageText });

    this.thread.logMessage(`riddle question:\n${pageText}`, "info");

    const riddleData = await waitForWebsocketMessageType(
      "riddleAnswer",
      3 * 60000
    );
    if (riddleData.type !== "riddleAnswer") return;

    this.thread.logMessage(
      `riddle answer received: ${riddleData.data}`,
      "info"
    );

    const inputs = await this.thread.page.$$(
      'body form input:not([type="submit"]):not([type="button"]), body form textarea'
    );

    if (inputs.length === 0) {
      this.thread.logMessage("No input fields found in the form.", "error");
      return;
    }

    await inputs[0].fill(riddleData.data.toLowerCase().trim());

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
      `form stage ending, current url: ${this.thread.page.url()}`,
      "info"
    );

    this.thread.logMessage(
      `current time elapsed: ${
        performance.now() - this.thread.startTime
      }ms, going into wait mode`,
      "info"
    );

    const currentTime = performance.now() - this.thread.startTime;

    const WAIT_TIME = 3000; // ms

    // wait
    if (currentTime < WAIT_TIME) await sleep(WAIT_TIME - currentTime);

    await submitButton.click();

    this.thread.checkoutTime = performance.now() - this.thread.startTime;

    this.thread.logMessage(`total checkout time ${this.thread.checkoutTime}`, 'info');
  }
}
