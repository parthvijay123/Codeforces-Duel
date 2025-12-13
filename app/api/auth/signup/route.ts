import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';
import { sendOTPEmail } from '@/lib/mail';

export async function POST(req: NextRequest) {
    await dbConnect();

    try {
        const { username, email, password } = await req.json();

        if (!username || !email || !password) {
            return NextResponse.json(
                { message: 'Please provide all fields' },
                { status: 400 }
            );
        }

        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        let user;

        if (existingUser) {
            if (existingUser.isVerified) {
                return NextResponse.json(
                    { message: 'User with this email or username already exists' },
                    { status: 400 }
                );
            } else {
                // User exists but is not verified. Overwrite/Update data and resend OTP.
                existingUser.username = username;
                existingUser.email = email;
                existingUser.password = hashedPassword;
                existingUser.otp = otp;
                existingUser.otpExpiry = otpExpiry;
                await existingUser.save();
                user = existingUser;
            }
        } else {
            // New user
            user = await User.create({
                username,
                email,
                password: hashedPassword,
                otp,
                otpExpiry,
                isVerified: false
            });
        }

        // Send OTP Email
        await sendOTPEmail(email, otp);

        // We do NOT log them in yet. They must verify first.
        return NextResponse.json(
            {
                message: 'Signup successful. Please verify your email.',
                userId: user._id,
                requireVerification: true,
                email: user.email
            },
            { status: 201 }
        );


    } catch (error: any) {
        return NextResponse.json(
            { message: error.message || 'Something went wrong' },
            { status: 500 }
        );
    }
}
