import { NextRequest, NextResponse } from 'next/server';
import { CoordinatorAgent } from '@/lib/agents/coordinatorAgent';
import { getDb } from '@/lib/mongodb';
import type { ChatMessage } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { householdId, query, conversationHistory = [] } = await request.json();

    if (!householdId || !query) {
      return NextResponse.json(
        { error: 'Missing required fields: householdId, query' },
        { status: 400 }
      );
    }

    const coordinator = new CoordinatorAgent();
    const result = await coordinator.handleQuery(householdId, query, conversationHistory);

    // Save assistant message to conversation history
    await coordinator.chatAgent.saveAssistantMessage(householdId, result.response);

    return NextResponse.json({
      message: result.response.message,
      uiComponents: result.response.uiComponents,
      data: result.response.data,
      actions: result.response.actions,
      uiSpec: result.uiSpec,
      agentTrace: result.agentTrace,
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process chat message' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const householdId = searchParams.get('householdId');

    if (!householdId) {
      return NextResponse.json(
        { error: 'householdId is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const chatCollection = db.collection<ChatMessage>('chat_messages');

    const messages = await chatCollection
      .find({ householdId })
      .sort({ createdAt: 1 })
      .limit(50)
      .toArray();

    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error('Chat history error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch chat history' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const householdId = searchParams.get('householdId');

    if (!householdId) {
      return NextResponse.json(
        { error: 'householdId is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const chatCollection = db.collection<ChatMessage>('chat_messages');

    await chatCollection.deleteMany({ householdId });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Chat delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to clear chat history' },
      { status: 500 }
    );
  }
}
