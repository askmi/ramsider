/** Retryable optional UI chunk. Media startup never awaits this promise. */
let loading: Promise<typeof import('@/components/FilmControls')> | undefined;
export function loadFilmControls() {
  return loading ??= import('@/components/FilmControls').catch(error => {
    loading = undefined;
    throw error;
  });
}
