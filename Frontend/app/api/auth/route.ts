// app/api/auth/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PublicClientApplication } from '@azure/msal-node';

const msalConfig = {
  auth: {
    clientId: process.env.CLIENT_ID || '',
    authority: process.env.AUTHORITY || '',
    redirectUri: process.env.REDIRECT_URI || '',
  },
};

const msalInstance = new PublicClientApplication(msalConfig);

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const action = url.searchParams.get('action');

  if (action === 'login') {
    const authUrl = await msalInstance.getAuthCodeUrl({ scopes: ['user.read'] });
    return NextResponse.redirect(authUrl);
  }

  if (action === 'logout') {
    return new NextResponse('Logged out', { status: 200 });
  }

  return new NextResponse('Method not allowed', { status: 405 });
}
