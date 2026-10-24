import type { Page } from '@playwright/test';

/** Local QA shares the user's computer; never emit test playback audio. */
export async function silenceTestMedia(page: Page) {
  await page.addInitScript(() => {
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      this.muted = true;
      this.volume = 0;
      return play.call(this);
    };
  });
}
