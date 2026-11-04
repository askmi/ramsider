/** iPhone fullscreen. Safari/Chrome on iPhone expose no element Fullscreen API
 * (iPad only) and no way to hide the browser bars; the only true full-screen
 * presentation is Apple's native player via video.webkitEnterFullscreen().
 * 'window' keeps our controls but leaves the browser chrome visible.
 * Rollback: change this single default to 'window', or open ?iphonePlayer=window.
 * Only presentation changes; the video, HLS engine and current time are retained. */
export const iphonePlayerDefault: 'window' | 'native' = 'native';

export function isIPhone() {
  return /iPhone|iPod/i.test(navigator.userAgent);
}

export function iphonePlayerMode(): 'window' | 'native' {
  const override = new URLSearchParams(window.location.search).get('iphonePlayer');
  return override === 'native' || override === 'window' ? override : iphonePlayerDefault;
}
