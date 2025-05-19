// Auth0 credentials from existing Door App
export const AUTH0_DOMAIN = '3p-logistics.eu.auth0.com';
export const AUTH0_CLIENT_ID = 'Hn8W3PEXMzgaMPNXywgnkbg4SrngbtzY';

// Auth0 configuration
export const auth0Config = {
  domain: AUTH0_DOMAIN,
  clientId: AUTH0_CLIENT_ID,
  // Use the correct API audience from the existing app
  audience: 'https://warehouse-api',
};

// Auth scopes
export const SCOPES = {
  // Standard OIDC scopes
  OPENID: 'openid',
  PROFILE: 'profile',
  EMAIL: 'email',
  // Optional scopes
  OFFLINE_ACCESS: 'offline_access',
};

// The combined default scopes for most requests
export const DEFAULT_SCOPES = `${SCOPES.OPENID} ${SCOPES.PROFILE} ${SCOPES.EMAIL}`;

// For refresh tokens, include offline access
export const REFRESH_TOKEN_SCOPES = `${DEFAULT_SCOPES} ${SCOPES.OFFLINE_ACCESS}`;

// Auth0 callback URLs for different platforms
export const AUTH0_CALLBACK_URL = {
  ANDROID: `com.threepl.doorapp://${AUTH0_DOMAIN}/android/com.threepl.doorapp/callback`,
  IOS: `com.threepl.doorapp://${AUTH0_DOMAIN}/ios/com.threepl.doorapp/callback`,
  // For dev web environment
  WEB: 'http://localhost:8081',
};