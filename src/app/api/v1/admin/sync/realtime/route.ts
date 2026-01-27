import { NextRequest } from 'next/server';

// SSE endpoint для real-time синхронизации с YClients
// В продакшене здесь будет подключение к YClients Webhooks

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Симуляция событий для демонстрации
const eventTypes = [
  'client_created',
  'client_updated',
  'appointment_created',
  'appointment_updated',
  'payment_received',
] as const;

const clientNames = [
  'Анна Иванова',
  'Мария Петрова',
  'Елена Сидорова',
  'Ольга Козлова',
  'Наталья Новикова',
  'Татьяна Морозова',
  'Светлана Волкова',
  'Ирина Лебедева',
];

const serviceNames = [
  'Маникюр',
  'Педикюр',
  'Стрижка',
  'Окрашивание',
  'Укладка',
  'Массаж лица',
  'Чистка лица',
  'Брови и ресницы',
];

function generateRandomEvent() {
  const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  const id = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const baseEvent = {
    id,
    type,
    timestamp: new Date().toISOString(),
    data: {} as Record<string, unknown>,
  };

  switch (type) {
    case 'client_created':
    case 'client_updated':
      baseEvent.data = {
        client_id: Math.floor(Math.random() * 10000),
        client_name: clientNames[Math.floor(Math.random() * clientNames.length)],
      };
      break;
    case 'appointment_created':
    case 'appointment_updated':
      baseEvent.data = {
        appointment_id: Math.floor(Math.random() * 10000),
        client_name: clientNames[Math.floor(Math.random() * clientNames.length)],
        service_name: serviceNames[Math.floor(Math.random() * serviceNames.length)],
      };
      break;
    case 'payment_received':
      baseEvent.data = {
        client_name: clientNames[Math.floor(Math.random() * clientNames.length)],
        amount: Math.floor(Math.random() * 5000) + 500,
      };
      break;
  }

  return baseEvent;
}

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Отправляем событие подключения
      const connectionEvent = {
        id: `conn_${Date.now()}`,
        type: 'connection_status',
        timestamp: new Date().toISOString(),
        data: { message: 'Подключено к YClients', status: 'connected' },
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(connectionEvent)}\n\n`));

      // Симуляция событий каждые 5-15 секунд
      const sendEvent = () => {
        const event = generateRandomEvent();
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      // Первое событие через 2-5 секунд
      const firstTimeout = setTimeout(sendEvent, 2000 + Math.random() * 3000);

      // Последующие события с рандомным интервалом
      const interval = setInterval(() => {
        sendEvent();
      }, 5000 + Math.random() * 10000);

      // Heartbeat каждые 30 секунд чтобы соединение не закрывалось
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(': heartbeat\n\n'));
      }, 30000);

      // Cleanup при закрытии соединения
      request.signal.addEventListener('abort', () => {
        clearTimeout(firstTimeout);
        clearInterval(interval);
        clearInterval(heartbeat);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
