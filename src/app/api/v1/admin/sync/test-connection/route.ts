import { NextResponse } from 'next/server';

// Тест подключения к YClients API
// В продакшене здесь будет реальный запрос к YClients

export async function GET() {
  const startTime = Date.now();

  try {
    // Симуляция запроса к YClients API
    await new Promise((resolve) => setTimeout(resolve, 100 + Math.random() * 200));

    const latency = Date.now() - startTime;

    // В 95% случаев успех, в 5% ошибка (для демонстрации)
    if (Math.random() > 0.05) {
      return NextResponse.json({
        success: true,
        message: 'YClients API доступен',
        latency_ms: latency,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Таймаут подключения',
        latency_ms: latency,
      });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Ошибка подключения к YClients',
    });
  }
}
