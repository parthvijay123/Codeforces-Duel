import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: NextRequest) {
    await dbConnect();

    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json(
                { message: 'Please provide email and password' },
                { status: 400 }
            );
        }

        // Explicitly select password since it's hidden by default in schema
        // Find user by email OR username
        const user = await User.findOne({
            $or: [
                { email: email },
                { username: email } // We accept username in the 'email' field from frontend
            ]
        }).select('+password');

        if (!user) {
            return NextResponse.json(
                { message: 'Invalid credentials' },
                { status: 401 }
            );
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return NextResponse.json(
                { message: 'Invalid credentials' },
                { status: 401 }
            );
        }

        const token = jwt.sign(
            { userId: user._id, username: user.username },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        const cookie = serialize('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        const response = NextResponse.json(
            {
                message: 'Logged in successfully',
                user: {
                    username: user.username,
                    email: user.email,
                    codeforcesHandle: user.codeforcesHandle,
                    isVerified: user.isVerified
                }
            },
            { status: 200 }
        );

        response.headers.set('Set-Cookie', cookie);
        return response;

    } catch (error: any) {
        return NextResponse.json(
            { message: error.message || 'Something went wrong' },
            { status: 500 }
        );
    }
}
