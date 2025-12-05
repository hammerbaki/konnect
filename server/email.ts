import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {
    apiKey: connectionSettings.settings.api_key, 
    fromEmail: connectionSettings.settings.from_email
  };
}

async function getResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

export async function sendMagicLinkEmail(to: string, magicLink: string): Promise<boolean> {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const { error } = await client.emails.send({
      from: fromEmail || 'Konnect <noreply@resend.dev>',
      to: [to],
      subject: '[Konnect] 로그인 링크',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #191F28; font-size: 24px; margin: 0;">Konnect</h1>
            <p style="color: #8B95A1; font-size: 14px; margin-top: 8px;">AI 진로 가이드 플랫폼</p>
          </div>
          
          <div style="background: #F9FAFB; border-radius: 16px; padding: 32px; text-align: center;">
            <h2 style="color: #191F28; font-size: 20px; margin: 0 0 16px;">로그인 링크</h2>
            <p style="color: #4E5968; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
              아래 버튼을 클릭하여 Konnect에 로그인하세요.<br>
              이 링크는 15분 후에 만료됩니다.
            </p>
            <a href="${magicLink}" style="display: inline-block; background: #3182F6; color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
              로그인하기
            </a>
          </div>
          
          <div style="margin-top: 32px; text-align: center;">
            <p style="color: #8B95A1; font-size: 12px; line-height: 1.6;">
              이 이메일을 요청하지 않으셨다면 무시해 주세요.<br>
              링크를 다른 사람과 공유하지 마세요.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send magic link email:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending magic link email:', error);
    return false;
  }
}

export async function sendWelcomeEmail(to: string, firstName?: string): Promise<boolean> {
  try {
    const { client, fromEmail } = await getResendClient();
    
    const name = firstName || '회원';
    
    const { error } = await client.emails.send({
      from: fromEmail || 'Konnect <noreply@resend.dev>',
      to: [to],
      subject: `[Konnect] ${name}님, 환영합니다!`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #191F28; font-size: 24px; margin: 0;">Konnect</h1>
            <p style="color: #8B95A1; font-size: 14px; margin-top: 8px;">AI 진로 가이드 플랫폼</p>
          </div>
          
          <div style="background: #F9FAFB; border-radius: 16px; padding: 32px;">
            <h2 style="color: #191F28; font-size: 20px; margin: 0 0 16px;">환영합니다, ${name}님! 🎉</h2>
            <p style="color: #4E5968; font-size: 14px; line-height: 1.6; margin: 0 0 16px;">
              Konnect에 가입해 주셔서 감사합니다!<br>
              AI 기반 진로 분석과 목표 관리로 꿈을 향한 여정을 시작하세요.
            </p>
            <ul style="color: #4E5968; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
              <li>✨ 무료 크레딧 10개 제공</li>
              <li>🎯 AI 진로 분석</li>
              <li>📝 자기소개서 생성</li>
              <li>🧭 Kompass 목표 관리</li>
            </ul>
          </div>
          
          <div style="margin-top: 32px; text-align: center;">
            <p style="color: #8B95A1; font-size: 12px;">
              도움이 필요하시면 언제든 문의해 주세요.
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send welcome email:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
}
