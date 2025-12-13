import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { serialize } from 'cookie';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
    await dbConnect();

    try {
        const { userId, otp } = await req.json();

        if (!userId || !otp) {
            return NextResponse.json(
                { message: 'User ID and OTP are required' },
                { status: 400 }
            );
        }

        const user = await User.findById(userId).select('+otp +otpExpiry');

        if (!user) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        if (user.isVerified) {
            return NextResponse.json(
                { message: 'User is already verified' },
                { status: 400 }
            );
        }

        // Check if OTP matches and has not expired
        if (user.otp !== otp) {
            return NextResponse.json(
                { message: 'Invalid OTP' },
                { status: 400 }
            );
        }

        if (user.otpExpiry < new Date()) {
            return NextResponse.json(
                { message: 'OTP has expired' },
                { status: 400 }
            );
        }

        // Verify user
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        // Generate JWT Token
        const token = jwt.sign(
            { userId: user._id, username: user.username, email: user.email },
            process.env.JWT_SECRET || 'fallback_secret',
            { expiresIn: '7d' }
        );

        // Set Cookie
        const serialized = serialize('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        const response = NextResponse.json(
            {
                message: 'Email verified successfully',
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    isVerified: true
                }
            },
            { status: 200 }
        );

        response.headers.set('Set-Cookie', serialized);

        return response;

    } catch (error: any) {
        console.error('Verification error:', error);
        return NextResponse.json(
            { message: error.message || 'Verification failed' },
            { status: 500 }
        );
    }
}
