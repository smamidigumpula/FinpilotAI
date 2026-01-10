import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import type { User } from '@/lib/types';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const db = await getDb();
    const usersCollection = db.collection<User>('users');

    // Find or create user
    let user = await usersCollection.findOne({ email });

    if (!user) {
      // Create demo household
      const householdsCollection = db.collection('households');
      const householdResult = await householdsCollection.insertOne({
        name: `${email.split('@')[0]}'s Household`,
        currency: 'USD',
        members: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create user
      const userResult = await usersCollection.insertOne({
        email,
        householdId: householdResult.insertedId.toString(),
        riskProfile: 'moderate',
        preferences: { noAds: false },
        createdAt: new Date(),
      });

      user = await usersCollection.findOne({ _id: userResult.insertedId });
    }

    if (!user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, householdId: user.householdId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        householdId: user.householdId,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}