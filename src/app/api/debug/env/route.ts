import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const envVars = {
      SMTP_HOST: process.env.SMTP_HOST ? '***' : 'NOT_SET',
      SMTP_PORT: process.env.SMTP_PORT ? '***' : 'NOT_SET',
      SMTP_USER: process.env.SMTP_USER ? '***' : 'NOT_SET',
      SMTP_PASSWORD: process.env.SMTP_PASSWORD ? '***' : 'NOT_SET',
      ADMIN_EMAIL: process.env.ADMIN_EMAIL ? '***' : 'NOT_SET',
      EMAIL_NOTIFICATIONS_ENABLED: process.env.EMAIL_NOTIFICATIONS_ENABLED ? '***' : 'NOT_SET',
    };

    return NextResponse.json({
      success: true,
      environment: process.env.NODE_ENV,
      envVars
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
