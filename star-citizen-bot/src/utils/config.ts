/**
 * Validates if a configuration value (usually from environment variables)
 * is set and is not a default dummy placeholder.
 *
 * @param value The configuration value to check.
 * @returns True if the value is valid, false otherwise.
 */
export function isValidConfigValue(value: string | undefined): value is string {
  if (!value) {
    return false;
  }

  // Check if the value matches the pattern "your_..._here"
  const dummyPattern = /^your_.*_here$/;
  if (dummyPattern.test(value)) {
    return false;
  }

  return true;
}
