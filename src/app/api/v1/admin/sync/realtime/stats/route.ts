import { NextResponse } from 'next/server';

// В продакшене здесь будет реальная статистика из базы данных
// Пока возвращаем mock данные

let startTime = Date.now();

export async function GET() {
  // Симуляция статистики
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  // Рандомные числа для демонстрации (в реальности из БД)
  const eventsToday = Math.floor(Math.random() * 50) + 10;
  const clientsToday = Math.floor(eventsToday * 0.4);
  const appointmentsToday = Math.floor(eventsToday * 0.5);

  return NextResponse.json({
    events_today: eventsToday,
    clients_synced_today: clientsToday,
    appointments_synced_today: appointmentsToday,
    last_event_at: new Date(Date.now() - Math.random() * 300000).toISOString(),
    uptime_seconds: uptimeSeconds,
  });
}
