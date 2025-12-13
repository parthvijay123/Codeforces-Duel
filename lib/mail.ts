import nodemailer from 'nodemailer';

export const sendOTPEmail = async (email: string, otp: string) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Verify your email for Codeforces Duel',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #333; text-align: center;">Email Verification</h2>
                    <p style="color: #666; font-size: 16px;">Hello,</p>
                    <p style="color: #666; font-size: 16px;">Thank you for signing up for Codeforces Duel. Please use the following One-Time Password (OTP) to verify your email address:</p>
                    <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
                        <h1 style="color: #333; letter-spacing: 5px; margin: 0;">${otp}</h1>
                    </div>
                    <p style="color: #666; font-size: 16px;">This OTP is valid for 10 minutes.</p>
                    <p style="color: #666; font-size: 16px;">If you didn't request this, please ignore this email.</p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`OTP email sent to ${email}`);
    } catch (error: any) {
        console.error('Error sending email:', error);
        // Throw the specific error so we can see what went wrong (e.g. Invalid login)
        throw new Error(`Failed to send verification email: ${error.message}`);
    }
};
