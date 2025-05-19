// Define the UserInfo type to match Auth0's user profile
export interface UserInfo {
    email?: string;
    email_verified?: boolean;
    name?: string;
    nickname?: string;
    sub: string;
    updated_at?: string;
    [key: string]: any; // Allow additional properties
  }
  
  // Define Auth0Credentials type
  export interface Auth0Credentials {
    accessToken: string;
    idToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    expiresAt?: number;
    tokenType?: string;
    scope?: string;
  }