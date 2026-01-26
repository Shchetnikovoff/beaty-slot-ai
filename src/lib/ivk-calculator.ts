/**
 * ИВК (Индекс Важности Клиента) Calculator
 *
 * Умная система расчёта на основе RFM-анализа + дополнительных факторов
 *
 * RFM = Recency (давность) + Frequency (частота) + Monetary (ценность)
 *
 * Формула ИВК:
 * - Recency Score (0-25): насколько недавно был визит
 * - Frequency Score (0-25): регулярность визитов
 * - Monetary Score (0-25): денежная ценность
 * - Loyalty Score (0-25): срок "жизни" клиента
 *
 * Итого: 0-100 баллов
 */

import type { YclientsClient } from './yclients';

// Конфигурация весов для расчёта ИВК
const IVK_CONFIG = {
  // Веса компонентов (сумма = 100)
  weights: {
    recency: 25,    // Давность последнего визита
    frequency: 25,  // Частота визитов
    monetary: 25,   // Денежная ценность
    loyalty: 25,    // Лояльность (срок жизни)
  },

  // Пороги для Recency (дни с последнего визита)
  recency: {
    excellent: 14,  // < 14 дней = 100%
    good: 30,       // < 30 дней = 75%
    medium: 60,     // < 60 дней = 50%
    poor: 90,       // < 90 дней = 25%
    // > 90 дней = 0%
  },

  // Пороги для Frequency (визитов в месяц, нормализованных)
  frequency: {
    excellent: 2.0,  // >= 2 визита/месяц = 100%
    good: 1.0,       // >= 1 визит/месяц = 75%
    medium: 0.5,     // >= 0.5 визита/месяц = 50%
    poor: 0.25,      // >= 0.25 визита/месяц = 25%
  },

  // Пороги для Monetary (общая сумма потраченного)
  monetary: {
    excellent: 100000, // >= 100k = 100%
    good: 50000,       // >= 50k = 75%
    medium: 20000,     // >= 20k = 50%
    poor: 5000,        // >= 5k = 25%
  },

  // Пороги для Loyalty (месяцев с первого визита)
  loyalty: {
    excellent: 24,  // >= 24 месяца = 100%
    good: 12,       // >= 12 месяцев = 75%
    medium: 6,      // >= 6 месяцев = 50%
    poor: 3,        // >= 3 месяца = 25%
  },
};

/**
 * Вспомогательные функции
 */
function daysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

function monthsBetween(date1: Date, date2: Date): number {
  const months = (date2.getFullYear() - date1.getFullYear()) * 12;
  return months + date2.getMonth() - date1.getMonth();
}

/**
 * Рассчитать процент на основе пороговых значений
 * Использует линейную интерполяцию между порогами
 */
function calculatePercentage(
  value: number,
  thresholds: { excellent: number; good: number; medium: number; poor: number },
  isLowerBetter: boolean = false
): number {
  // Защита от NaN, undefined, Infinity
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  if (isLowerBetter) {
    // Для Recency: чем меньше дней, тем лучше
    if (value <= thresholds.excellent) return 100;
    if (value <= thresholds.good) {
      // Интерполяция между excellent и good
      const range = thresholds.good - thresholds.excellent;
      const position = value - thresholds.excellent;
      return 100 - (position / range) * 25;
    }
    if (value <= thresholds.medium) {
      const range = thresholds.medium - thresholds.good;
      const position = value - thresholds.good;
      return 75 - (position / range) * 25;
    }
    if (value <= thresholds.poor) {
      const range = thresholds.poor - thresholds.medium;
      const position = value - thresholds.medium;
      return 50 - (position / range) * 25;
    }
    // Плавное затухание после poor
    const overPoor = value - thresholds.poor;
    return Math.max(0, 25 - (overPoor / thresholds.poor) * 25);
  } else {
    // Для остальных: чем больше, тем лучше
    if (value >= thresholds.excellent) return 100;
    if (value >= thresholds.good) {
      const range = thresholds.excellent - thresholds.good;
      const position = value - thresholds.good;
      return 75 + (position / range) * 25;
    }
    if (value >= thresholds.medium) {
      const range = thresholds.good - thresholds.medium;
      const position = value - thresholds.medium;
      return 50 + (position / range) * 25;
    }
    if (value >= thresholds.poor) {
      const range = thresholds.medium - thresholds.poor;
      const position = value - thresholds.poor;
      return 25 + (position / range) * 25;
    }
    // Ниже poor - пропорционально
    return (value / thresholds.poor) * 25;
  }
}

/**
 * Детальный результат расчёта ИВК
 */
export interface IVKResult {
  score: number;              // Итоговый ИВК (0-100)
  components: {
    recency: number;          // Балл за давность (0-25)
    frequency: number;        // Балл за частоту (0-25)
    monetary: number;         // Балл за ценность (0-25)
    loyalty: number;          // Балл за лояльность (0-25)
  };
  percentages: {
    recency: number;          // Процент по давности (0-100)
    frequency: number;        // Процент по частоте (0-100)
    monetary: number;         // Процент по ценности (0-100)
    loyalty: number;          // Процент по лояльности (0-100)
  };
  metrics: {
    daysSinceLastVisit: number | null;
    monthsAsClient: number | null;
    visitsPerMonth: number | null;
    totalSpent: number;
    avgCheck: number;
  };
  tier: 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE' | 'NEW';
}

/**
 * Определить уровень клиента на основе ИВК
 */
function determineTier(score: number, monthsAsClient: number | null): IVKResult['tier'] {
  // Новый клиент (< 1 месяца)
  if (monthsAsClient !== null && monthsAsClient < 1) {
    return 'NEW';
  }

  if (score >= 85) return 'PLATINUM';
  if (score >= 70) return 'GOLD';
  if (score >= 50) return 'SILVER';
  return 'BRONZE';
}

/**
 * Главная функция расчёта ИВК
 */
export function calculateIVK(client: YclientsClient): IVKResult {
  const now = new Date();

  // === RECENCY: дни с последнего визита ===
  let daysSinceLastVisit: number | null = null;
  let recencyPercentage = 0;

  if (client.last_visit_date) {
    const lastVisit = new Date(client.last_visit_date);
    daysSinceLastVisit = daysBetween(lastVisit, now);
    recencyPercentage = calculatePercentage(
      daysSinceLastVisit,
      IVK_CONFIG.recency,
      true // lower is better
    );
  }

  // === FREQUENCY: визитов в месяц ===
  let monthsAsClient: number | null = null;
  let visitsPerMonth: number | null = null;
  let frequencyPercentage = 0;

  // Безопасное получение visit_count (защита от undefined)
  const visitCount = client.visit_count ?? 0;

  if (client.first_visit_date) {
    const firstVisit = new Date(client.first_visit_date);
    monthsAsClient = Math.max(1, monthsBetween(firstVisit, now)); // минимум 1 месяц
    visitsPerMonth = visitCount / monthsAsClient;
    frequencyPercentage = calculatePercentage(
      visitsPerMonth,
      IVK_CONFIG.frequency,
      false
    );
  } else if (visitCount > 0) {
    // Если нет first_visit_date, но есть визиты - предполагаем 6 месяцев
    monthsAsClient = 6;
    visitsPerMonth = visitCount / monthsAsClient;
    frequencyPercentage = calculatePercentage(
      visitsPerMonth,
      IVK_CONFIG.frequency,
      false
    );
  }

  // === MONETARY: общая сумма потраченного ===
  const totalSpent = client.spent || 0;
  const monetaryPercentage = calculatePercentage(
    totalSpent,
    IVK_CONFIG.monetary,
    false
  );

  // === LOYALTY: срок жизни клиента ===
  let loyaltyPercentage = 0;

  if (monthsAsClient !== null) {
    loyaltyPercentage = calculatePercentage(
      monthsAsClient,
      IVK_CONFIG.loyalty,
      false
    );
  }

  // === Расчёт компонентов (с весами) ===
  // Используем || 0 для защиты от NaN
  const components = {
    recency: Math.round((recencyPercentage / 100) * IVK_CONFIG.weights.recency) || 0,
    frequency: Math.round((frequencyPercentage / 100) * IVK_CONFIG.weights.frequency) || 0,
    monetary: Math.round((monetaryPercentage / 100) * IVK_CONFIG.weights.monetary) || 0,
    loyalty: Math.round((loyaltyPercentage / 100) * IVK_CONFIG.weights.loyalty) || 0,
  };

  // === Итоговый ИВК ===
  const rawScore = components.recency + components.frequency + components.monetary + components.loyalty;
  const score = Math.min(100, Math.max(0, rawScore || 0));

  return {
    score,
    components,
    percentages: {
      recency: Math.round(recencyPercentage),
      frequency: Math.round(frequencyPercentage),
      monetary: Math.round(monetaryPercentage),
      loyalty: Math.round(loyaltyPercentage),
    },
    metrics: {
      daysSinceLastVisit,
      monthsAsClient,
      visitsPerMonth: visitsPerMonth !== null ? Math.round(visitsPerMonth * 100) / 100 : null,
      totalSpent,
      avgCheck: client.avg_sum || 0,
    },
    tier: determineTier(score, monthsAsClient),
  };
}

/**
 * Упрощённая функция - возвращает только score
 */
export function calculateIVKScore(client: YclientsClient): number {
  return calculateIVK(client).score;
}

/**
 * Определить уровень риска на основе ИВК и давности
 */
export function calculateRiskFromIVK(ivkResult: IVKResult): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
  const { daysSinceLastVisit } = ivkResult.metrics;
  const { score } = ivkResult;

  // Критический: ценный клиент (score > 50) давно не был (> 60 дней)
  if (score > 50 && daysSinceLastVisit !== null && daysSinceLastVisit > 60) {
    return 'CRITICAL';
  }

  // Высокий: любой клиент не был > 60 дней
  if (daysSinceLastVisit !== null && daysSinceLastVisit > 60) {
    return 'HIGH';
  }

  // Средний: не был 30-60 дней
  if (daysSinceLastVisit !== null && daysSinceLastVisit > 30) {
    return 'MEDIUM';
  }

  return 'LOW';
}

/**
 * Определить статус клиента на основе ИВК
 */
export function determineClientStatus(
  ivkResult: IVKResult
): 'VIP' | 'REGULAR' | 'PROBLEM' | 'LOST' {
  const { score, tier, metrics } = ivkResult;
  const { daysSinceLastVisit } = metrics;

  // LOST: не был > 90 дней
  if (daysSinceLastVisit !== null && daysSinceLastVisit > 90) {
    return 'LOST';
  }

  // VIP: PLATINUM или GOLD tier + был недавно
  if ((tier === 'PLATINUM' || tier === 'GOLD') &&
      (daysSinceLastVisit === null || daysSinceLastVisit <= 45)) {
    return 'VIP';
  }

  // PROBLEM: низкий score или давно не был
  if (score < 25 || (daysSinceLastVisit !== null && daysSinceLastVisit > 60)) {
    return 'PROBLEM';
  }

  return 'REGULAR';
}

/**
 * Получить рекомендации по работе с клиентом
 */
export function getClientRecommendations(ivkResult: IVKResult): string[] {
  const recommendations: string[] = [];
  const { percentages, metrics, tier } = ivkResult;

  // Рекомендации по давности
  if (percentages.recency < 50) {
    if (metrics.daysSinceLastVisit !== null && metrics.daysSinceLastVisit > 60) {
      recommendations.push('🔴 Срочно: клиент не был более 60 дней. Позвоните или отправьте персональное предложение.');
    } else if (metrics.daysSinceLastVisit !== null && metrics.daysSinceLastVisit > 30) {
      recommendations.push('🟡 Напомните о себе: прошло более 30 дней с последнего визита.');
    }
  }

  // Рекомендации по частоте
  if (percentages.frequency < 50 && metrics.monthsAsClient !== null && metrics.monthsAsClient > 3) {
    recommendations.push('📅 Предложите программу регулярного обслуживания или абонемент.');
  }

  // Рекомендации по среднему чеку
  if (percentages.monetary < 50 && metrics.totalSpent > 0) {
    recommendations.push('💰 Расскажите о дополнительных услугах или комплексных процедурах.');
  }

  // Рекомендации по лояльности
  if (tier === 'PLATINUM' || tier === 'GOLD') {
    recommendations.push('⭐ VIP-клиент: обеспечьте персональный подход и приоритетное обслуживание.');
  }

  if (tier === 'NEW') {
    recommendations.push('👋 Новый клиент: важно произвести отличное первое впечатление!');
  }

  return recommendations;
}

// Export config for potential UI customization
export { IVK_CONFIG };
