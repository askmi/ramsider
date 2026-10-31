/** Rollback: change this single default to 'native', or open ?iphonePlayer=native.
 * Only presentation changes; the video, HLS engine and current time are retained. */
export const iphonePlayerDefault: 'window' | 'native' = 'window';

export function isIPhone() {
  return /iPhone|iPod/i.test(navigator.userAgent);
}

export function iphonePlayerMode(): 'window' | 'native' {
  const override = new URLSearchParams(window.location.search).get('iphonePlayer');
  return override === 'native' || override === 'window' ? override : iphonePlayerDefault;
}
