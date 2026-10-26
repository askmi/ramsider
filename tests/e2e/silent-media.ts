import type { BrowserContext, Page } from '@playwright/test';

/** Local QA shares the user's computer; never emit test playback audio. */
export async function silenceTestMedia(scope: Page | BrowserContext) {
  await scope.addInitScript(() => {
    const silence = (media: HTMLMediaElement) => {
      media.defaultMuted = true;
      media.muted = true;
      media.volume = 0;
    };
    // Parser-created media and native controls also need silence before Play;
    // overriding the JavaScript play() method alone does not cover those paths.
    new MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes) {
        if (node instanceof HTMLMediaElement) silence(node);
        if (node instanceof Element) node.querySelectorAll<HTMLMediaElement>('video,audio').forEach(silence);
      }
    }).observe(document, { childList: true, subtree: true });
    document.addEventListener('play', event => { if (event.target instanceof HTMLMediaElement) silence(event.target); }, true);
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      silence(this);
      return play.call(this);
    };
  });
}
