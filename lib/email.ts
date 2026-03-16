import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || "PulsePy <onboarding@resend.dev>";

/**
 * Send a 6-digit OTP verification email.
 */
export async function sendOtpEmail(to: string, otp: string, name?: string) {
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `${otp} is your PulsePy verification code`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #0a0a1a; color: #e0e0f0; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: linear-gradient(135deg, #a855f7, #ec4899); border-radius: 12px; margin-bottom: 16px;">
            <span style="font-size: 24px; color: white;">⚡</span>
          </div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">PulsePy</h1>
        </div>
        
        <p style="color: #a0a0c0; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          Hey${name ? ` ${name}` : ""}! Use this code to verify your email address:
        </p>
        
        <div style="text-align: center; padding: 24px; background: linear-gradient(135deg, rgba(168,85,247,0.15), rgba(236,72,153,0.1)); border: 1px solid rgba(168,85,247,0.3); border-radius: 12px; margin-bottom: 24px;">
          <div style="font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #ffffff; font-family: 'Courier New', monospace;">
            ${otp}
          </div>
        </div>
        
        <p style="color: #707090; font-size: 13px; line-height: 1.5; margin: 0 0 8px;">
          This code expires in <strong style="color: #a855f7;">10 minutes</strong>.
        </p>
        <p style="color: #707090; font-size: 13px; line-height: 1.5; margin: 0;">
          If you didn't request this code, you can safely ignore this email.
        </p>
        
        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 32px 0 16px;" />
        <p style="color: #505070; font-size: 11px; text-align: center; margin: 0;">
          PulsePy — AI-Powered Python Learning Platform
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("Failed to send OTP email:", error);
    throw new Error("Failed to send verification email. Please try again.");
  }
}

/**
 * Send a welcome email after successful verification.
 */
export async function sendWelcomeEmail(to: string, name: string) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Welcome to PulsePy! 🎉",
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #0a0a1a; color: #e0e0f0; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: linear-gradient(135deg, #a855f7, #ec4899); border-radius: 12px; margin-bottom: 16px;">
            <span style="font-size: 24px; color: white;">⚡</span>
          </div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">Welcome, ${name}! 🎉</h1>
        </div>
        
        <p style="color: #a0a0c0; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
          Your email is verified and your account is ready. Here's what you can do:
        </p>
        
        <ul style="color: #c0c0e0; font-size: 14px; line-height: 2; padding-left: 20px; margin: 0 0 24px;">
          <li>🖥️ Code in the <strong>Browser-Based IDE</strong></li>
          <li>🏆 Complete <strong>Coding Challenges</strong></li>
          <li>🎮 Play <strong>5 Python Games</strong> to earn XP</li>
          <li>📊 Climb the <strong>Leaderboard</strong></li>
        </ul>
        
        <div style="text-align: center; margin-top: 24px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}" 
             style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #a855f7, #ec4899); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 14px;">
            Start Learning →
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 32px 0 16px;" />
        <p style="color: #505070; font-size: 11px; text-align: center; margin: 0;">
          PulsePy — AI-Powered Python Learning Platform
        </p>
      </div>
    `,
  }).catch(() => {}); // Non-critical, don't break signup flow
}

/**
 * Send OTP for password reset.
 */
export async function sendPasswordResetOtp(to: string, otp: string) {
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `${otp} — Reset your PulsePy password`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #0a0a1a; color: #e0e0f0; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: linear-gradient(135deg, #a855f7, #ec4899); border-radius: 12px; margin-bottom: 16px;">
            <span style="font-size: 24px; color: white;">🔑</span>
          </div>
          <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">Password Reset</h1>
        </div>
        
        <p style="color: #a0a0c0; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          Use this code to reset your password:
        </p>
        
        <div style="text-align: center; padding: 24px; background: linear-gradient(135deg, rgba(168,85,247,0.15), rgba(236,72,153,0.1)); border: 1px solid rgba(168,85,247,0.3); border-radius: 12px; margin-bottom: 24px;">
          <div style="font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #ffffff; font-family: 'Courier New', monospace;">
            ${otp}
          </div>
        </div>
        
        <p style="color: #707090; font-size: 13px; line-height: 1.5; margin: 0 0 8px;">
          This code expires in <strong style="color: #a855f7;">10 minutes</strong>.
        </p>
        <p style="color: #707090; font-size: 13px; line-height: 1.5; margin: 0;">
          If you didn't request a password reset, you can safely ignore this email.
        </p>
        
        <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 32px 0 16px;" />
        <p style="color: #505070; font-size: 11px; text-align: center; margin: 0;">
          PulsePy — AI-Powered Python Learning Platform
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("Failed to send password reset email:", error);
    throw new Error("Failed to send reset email. Please try again.");
  }
}
