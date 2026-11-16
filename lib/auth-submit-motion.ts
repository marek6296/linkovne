/** Wait for the actual fill animation, rather than delaying an auth response. */
export async function submitAfterFill<T>(
  fill: HTMLElement | null,
  reducedMotion: boolean,
  submit: () => Promise<T>,
): Promise<T | undefined> {
  if (fill?.animate && !reducedMotion) {
    const animation = fill.animate(
      [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }],
      { duration: 480, easing: "cubic-bezier(0.22, 0.68, 0.24, 1)" },
    );
    try {
      await animation.finished;
    } catch {
      // The form unmounted while filling: don't start an obsolete auth request.
      return undefined;
    }
  }
  return submit();
}
