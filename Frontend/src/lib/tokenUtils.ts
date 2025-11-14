/**
 * Token Utility Functions
 * 
 * Helper functions for JWT token validation and management
 */

/**
 * Check if a JWT token is expired
 * @param token JWT token string
 * @returns true if token is expired, false otherwise
 */
export function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return true // Invalid token format
    }

    const payload = JSON.parse(atob(parts[1]))
    const expiryTime = payload.exp * 1000 // Convert to milliseconds
    
    return Date.now() >= expiryTime
  } catch (e) {
    console.error('Error checking token expiry:', e)
    return true // Assume expired if parsing fails
  }
}

/**
 * Get token expiry date
 * @param token JWT token string
 * @returns Date object or null if invalid
 */
export function getTokenExpiryDate(token: string): Date | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    const payload = JSON.parse(atob(parts[1]))
    return new Date(payload.exp * 1000)
  } catch (e) {
    console.error('Error getting token expiry date:', e)
    return null
  }
}

/**
 * Get token payload
 * @param token JWT token string
 * @returns Decoded payload or null if invalid
 */
export function getTokenPayload(token: string): any | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    return JSON.parse(atob(parts[1]))
  } catch (e) {
    console.error('Error decoding token payload:', e)
    return null
  }
}

/**
 * Clear all authentication tokens from storage
 */
export function clearAuthTokens(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }
}
