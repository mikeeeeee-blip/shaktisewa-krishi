/**
 * Serviceable Pin Codes
 * List of pin codes where delivery is available
 */

export const SERVICEABLE_PIN_CODES = [
  '452010',
  '452001',
] as const;

export type ServiceablePincode = typeof SERVICEABLE_PIN_CODES[number];

/**
 * Check if a pin code is serviceable
 * @param pincode - The pin code to check
 * @returns true if the pin code is serviceable, false otherwise
 */
export function isServiceablePincode(pincode: string): boolean {
  if (!pincode || typeof pincode !== 'string') {
    return false;
  }
  
  // Normalize pin code (remove spaces, ensure 6 digits)
  const normalizedPincode = pincode.trim().replace(/\s+/g, '');
  
  // Check if it's in the serviceable list
  return SERVICEABLE_PIN_CODES.includes(normalizedPincode as ServiceablePincode);
}

/**
 * Get all serviceable pin codes
 * @returns Array of serviceable pin codes
 */
export function getServiceablePincodes(): readonly string[] {
  return SERVICEABLE_PIN_CODES;
}



























