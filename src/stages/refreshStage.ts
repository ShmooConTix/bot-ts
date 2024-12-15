import { sleep } from "bun";
import { globalConfig } from "..";
import { PurchasingStage } from "./purchasingStage";
import { URLScore } from "../urlscore";

const REFRESH_DELAY = 300;

export class RefreshStage extends PurchasingStage {
  async start() {
    if (!this.thread || !this.thread.page) return;

    this.thread.logMessage(
      `navigated to ${globalConfig.landingServer}`,
      "info"
    );

    await this.thread.page.goto(globalConfig.landingServer);

    this.thread.logMessage(`starting refresh stage`, "info");

    let isFormLinkFulfilled = false;

    let pTextBefore = (
      await this.thread.page.$$eval("body p", (ps) =>
        ps
          .filter((p): p is HTMLElement => p instanceof HTMLElement)
          .map((p) => p.innerText.trim().replace(/\n/g, " "))
      )
    ).join(" ");

    pTextBefore = pTextBefore.replace(
      "If you're looking for all ShmoOCon archives, we've got that online too.",
      ""
    );

    pTextBefore = pTextBefore.replace(
      "If you're looking for all ShmooCon archives, we've got that online too.",
      ""
    );

    this.thread.logMessage(`pTextBefore: ${pTextBefore}`, "info");

    if (!globalConfig.devMode) {
      const now = new Date();
      const estNow = new Date(
        now.toLocaleString("en-US", { timeZone: "America/New_York" })
      );
      const targetTime = new Date(estNow);
      if (
        estNow.getHours() > 11 ||
        (estNow.getHours() === 11 && estNow.getMinutes() >= 59)
      ) {
        targetTime.setDate(targetTime.getDate() + 1);
      }
      targetTime.setHours(11, 59, 0, 0);
      const msToWait = targetTime.getTime() - estNow.getTime();

      this.thread.logMessage(
        `waiting time until 11:59 am, ${msToWait}ms, ${Date.now() + msToWait}`,
        "info"
      );

      await sleep(msToWait);
    }

    // get current paragraph information
    this.thread.startTime = performance.now();
    await this.thread.page.reload();

    let pText = (
      await this.thread.page.$$eval("body p", (ps) =>
        ps
          .filter((p): p is HTMLElement => p instanceof HTMLElement)
          .map((p) => p.innerText.trim().replace(/\n/g, " "))
      )
    ).join(" ");

    // remove text at bottom
    pText = pText.replace(
      "If you're looking for all ShmoOCon archives, we've got that online too.",
      ""
    );

    pText = pText.replace(
      "If you're looking for all ShmooCon archives, we've got that online too.",
      ""
    );

    this.thread.logMessage(
      `done waiting, here is current pText: ${pText}`,
      "info"
    );

    // ensure data is always up to date
    while (!isFormLinkFulfilled) {
      await sleep(
        REFRESH_DELAY + (Math.floor(Math.random() * (125 - 50 + 1)) + 50)
      );

      const msTillNoon =
        ((noon) =>
          noon.setHours(12, 0, 0, 0) > Date.now()
            ? noon
            : new Date(noon.setDate(noon.getDate() + 1)))(
          new Date()
        ).getTime() - Date.now();

      if (!globalConfig.devMode && (msTillNoon > 10000)) {
        await sleep(
          (REFRESH_DELAY * 4) + (Math.floor(Math.random() * (200 - 50 + 1)) + 50)
        );
      } else if (!globalConfig.devMode && msTillNoon > 5000) {
        await sleep(
          (REFRESH_DELAY * 2) + (Math.floor(Math.random() * (200 - 50 + 1)) + 50)
        );
      }

      const now = new Date().toLocaleString("en-US", {
        timeZone: "America/New_York",
      });
      const currentTime = new Date(now);
      if (
        globalConfig.devMode ||
        (currentTime.getHours() === 12 && currentTime.getMinutes() === 0)
      ) {
        let newPText = (
          await this.thread.page.$$eval("body p", (ps) =>
            ps
              .filter((p): p is HTMLElement => p instanceof HTMLElement)
              .map((p) => p.innerText.trim().replace(/\n/g, " "))
          )
        ).join(" ");

        newPText = newPText.replace(
          "If you're looking for all ShmoOCon archives, we've got that online too.",
          ""
        );

        newPText = newPText.replace(
          "If you're looking for all ShmooCon archives, we've got that online too.",
          ""
        );

        const pDiff = getPercentageDifference(pText, newPText);

        if (pDiff >= 50) {
          const links = await this.thread.page.locator("body a").all();
          let highestScore = 0;
          let bestHref = null;

          const scores = await Promise.all(
            links.map(async (link) => {
              const href = await link.getAttribute("href");
              const urlScore = new URLScore(link, href ?? "");
              const score = await urlScore.getScore();
              return { href, score };
            })
          );

          for (const { href, score } of scores) {
            if (score > highestScore) {
              highestScore = score;
              bestHref = href;
            }
          }

          if (bestHref) {
            this.thread.logMessage(
              `Highest scoring URL: ${bestHref} with score ${highestScore}`,
              "info"
            );

            const currentTime = performance.now() - this.thread.startTime;

            const time = 1320;

            if (currentTime < time) await sleep(time - currentTime);

            await this.thread.page.goto(bestHref);
          } else {
            this.thread.logMessage(`No links found`, "info");
          }

          isFormLinkFulfilled = true;
        } else {
          await this.thread.page.reload();
          this.thread.startTime = performance.now();
        }
      } else {
        this.thread.startTime = performance.now();
        await this.thread.page.reload();
      }
    }
  }
}

function getPercentageDifference(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 0;
  const distance = levenshteinDistance(str1, str2);
  return (distance / maxLen) * 100;
}

function levenshteinDistance(a: string, b: string): number {
  const dp: number[][] = Array(a.length + 1)
    .fill(null)
    .map(() => Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // Deletion
        dp[i][j - 1] + 1, // Insertion
        dp[i - 1][j - 1] + cost // Substitution
      );
    }
  }

  return dp[a.length][b.length];
}

// READING TIME DATA