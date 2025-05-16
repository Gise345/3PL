// Get Auth0 credentials from environment or use fallbacks
export const AUTH0_DOMAIN = '3p-logistics.eu.auth0.com'; // Replace with actual domain from existing app
export const AUTH0_CLIENT_ID = 'Hn8W3PEXMzgaMPNXywgnkbg4SrngbtzY'; // Replace with actual client ID from existing app

// Auth0 configuration
export const auth0Config = {
  domain: AUTH0_DOMAIN,
  clientId: AUTH0_CLIENT_ID,

  audience: 'https://api.3p-logistics.co.uk', // Replace with the actual API identifier
  scope: 'openid profile email offline_access',
};

// Redirect URL (needs to match what's configured in Auth0 dashboard)
export const redirectUri = 'com.3p-logistics.3pldoorapp://3p-logistics.auth0.com/android/com.3p-logistics.3pldoorapp/callback';