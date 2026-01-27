import { NextRequest, NextResponse } from 'next/server';
import {
  getBroadcastById,
  updateBroadcast,
  deleteBroadcast,
} from '@/lib/telegram-store';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/admin/broadcasts/[id]
 * Получить рассылку по ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const broadcastId = parseInt(id, 10);

    if (isNaN(broadcastId)) {
      return NextResponse.json(
        { error: 'Invalid broadcast ID' },
        { status: 400 }
      );
    }

    const broadcast = getBroadcastById(broadcastId);

    if (!broadcast) {
      return NextResponse.json(
        { error: 'Broadcast not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(broadcast);
  } catch (error) {
    console.error('Error getting broadcast:', error);
    return NextResponse.json(
      { error: 'Failed to get broadcast' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/admin/broadcasts/[id]
 * Обновить рассылку
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const broadcastId = parseInt(id, 10);

    if (isNaN(broadcastId)) {
      return NextResponse.json(
        { error: 'Invalid broadcast ID' },
        { status: 400 }
      );
    }

    const broadcast = getBroadcastById(broadcastId);

    if (!broadcast) {
      return NextResponse.json(
        { error: 'Broadcast not found' },
        { status: 404 }
      );
    }

    // Нельзя редактировать уже отправленную рассылку
    if (broadcast.status === 'SENT') {
      return NextResponse.json(
        { error: 'Cannot edit sent broadcast' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { title, message, target_audience, scheduled_at, status } = body;

    const updatedBroadcast = updateBroadcast(broadcastId, {
      ...(title && { title }),
      ...(message && { message }),
      ...(target_audience && { target_audience }),
      ...(scheduled_at && { scheduled_at }),
      ...(status && { status }),
    });

    return NextResponse.json(updatedBroadcast);
  } catch (error) {
    console.error('Error updating broadcast:', error);
    return NextResponse.json(
      { error: 'Failed to update broadcast' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/admin/broadcasts/[id]
 * Удалить рассылку
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const broadcastId = parseInt(id, 10);

    if (isNaN(broadcastId)) {
      return NextResponse.json(
        { error: 'Invalid broadcast ID' },
        { status: 400 }
      );
    }

    const broadcast = getBroadcastById(broadcastId);

    if (!broadcast) {
      return NextResponse.json(
        { error: 'Broadcast not found' },
        { status: 404 }
      );
    }

    // Нельзя удалять отправляющуюся рассылку
    if (broadcast.status === 'SCHEDULED') {
      return NextResponse.json(
        { error: 'Cannot delete scheduled broadcast. Cancel it first.' },
        { status: 400 }
      );
    }

    deleteBroadcast(broadcastId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting broadcast:', error);
    return NextResponse.json(
      { error: 'Failed to delete broadcast' },
      { status: 500 }
    );
  }
}
