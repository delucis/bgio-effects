/**
 * Get an error message for when a hook has been used outside a provider.
 * @param hook - The name of the hook that errored.
 * @return - Error message string.
 */
export const hookErrorMessage = (hook: string) =>
  hook +
  ' must be called inside the effects context provider.\n' +
  'Make sure your board component has been correctly wrapped using EffectsBoardWrapper.';
