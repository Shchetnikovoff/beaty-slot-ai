import {
  IconCalendar,
  IconChartBar,
  IconChartInfographic,
  IconFileInvoice,
  IconPackages,
  IconUserCircle,
  IconUsers,
  IconBell,
  IconCreditCard,
  IconSettings,
  IconBuilding,
  IconSend,
  IconFileText,
  IconChartPie,
} from '@tabler/icons-react';

import { PATH_APPS, PATH_DASHBOARD } from '@/routes';

export const SIDEBAR_LINKS = [
  {
    title: 'Дашборд',
    links: [
      { label: 'Главная', icon: IconChartBar, link: PATH_DASHBOARD.default },
      {
        label: 'Аналитика',
        icon: IconChartInfographic,
        link: PATH_DASHBOARD.analytics,
      },
    ],
  },
  {
    title: 'Клиенты',
    links: [
      { label: 'Все клиенты', icon: IconUsers, link: PATH_APPS.customers },
      { label: 'Подписки', icon: IconCreditCard, link: PATH_APPS.orders },
      { label: 'Платежи', icon: IconFileInvoice, link: PATH_APPS.invoices.root },
    ],
  },
  {
    title: 'Услуги',
    links: [
      { label: 'Календарь записей', icon: IconCalendar, link: PATH_APPS.calendar },
      {
        label: 'Тарифы',
        icon: IconPackages,
        links: [
          { label: 'Список', link: PATH_APPS.products.root },
          { label: 'Категории', link: PATH_APPS.products.categories },
        ],
      },
    ],
  },
  {
    title: 'Коммуникации',
    links: [
      { label: 'Уведомления', icon: IconBell, link: PATH_APPS.notifications },
      { label: 'Рассылки', icon: IconSend, link: '/apps/broadcasts', badge: 'NEW' },
    ],
  },
  {
    title: 'Настройки',
    links: [
      { label: 'Профиль', icon: IconUserCircle, link: PATH_APPS.profile },
      { label: 'Настройки', icon: IconSettings, link: PATH_APPS.settings },
      { label: 'Документы', icon: IconFileText, link: '/apps/documents', badge: 'NEW' },
    ],
  },
  {
    title: 'Superadmin',
    links: [
      { label: 'Салоны', icon: IconBuilding, link: '/apps/superadmin/salons', badge: 'SA' },
      { label: 'Статистика', icon: IconChartPie, link: '/apps/superadmin/stats', badge: 'SA' },
    ],
  },
];
