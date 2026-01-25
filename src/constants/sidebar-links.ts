import {
  IconCalendar,
  IconChartBar,
  IconChartInfographic,
  IconFileInvoice,
  IconPackages,
  IconUserCircle,
  IconUsers,
  IconUsersGroup,
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
      { label: 'Команда', icon: IconUsersGroup, link: PATH_APPS.team },
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
      { label: 'Рассылки', icon: IconSend, link: PATH_APPS.broadcasts },
    ],
  },
  {
    title: 'Настройки',
    links: [
      { label: 'Профиль', icon: IconUserCircle, link: PATH_APPS.profile },
      { label: 'Настройки', icon: IconSettings, link: PATH_APPS.settings },
      { label: 'Документы', icon: IconFileText, link: PATH_APPS.documents },
    ],
  },
  {
    title: 'Суперадмин',
    links: [
      { label: 'Салоны', icon: IconBuilding, link: PATH_APPS.superadmin.salons, badge: 'СА' },
      { label: 'Статистика', icon: IconChartPie, link: PATH_APPS.superadmin.stats, badge: 'СА' },
    ],
  },
];
