import {
  IconBell,
  IconBellRinging,
  IconBuildingStore,
  IconCalendar,
  IconChartBar,
  IconChartInfographic,
  IconCreditCard,
  IconFileInvoice,
  IconFileText,
  IconPackages,
  IconReceipt,
  IconRefresh,
  IconSend,
  IconSpeakerphone,
  IconUserPlus,
  IconUsers,
  IconUsersGroup,
  IconWorld,
} from '@tabler/icons-react';

import { PATH_APPS, PATH_DASHBOARD } from '@/routes';

export const SIDEBAR_LINKS = [
  {
    title: 'Управление салоном',
    links: [
      { label: 'Главная', icon: IconChartBar, link: PATH_DASHBOARD.default },
      { label: 'ИИ аналитика', icon: IconChartInfographic, link: PATH_DASHBOARD.analytics },
      { label: 'Клиенты', icon: IconUsers, link: PATH_APPS.customers },
      { label: 'Журнал записей', icon: IconCalendar, link: PATH_APPS.calendar },
      {
        label: 'Команда',
        icon: IconUsersGroup,
        links: [
          { label: 'Команда салона', link: PATH_APPS.team },
          { label: 'Команда управления', link: PATH_APPS.access },
        ],
      },
      { label: 'Платежи', icon: IconFileInvoice, link: PATH_APPS.invoices.root },
      { label: 'Рассылки', icon: IconSend, link: PATH_APPS.broadcasts },
      { label: 'Уведомления клиентам', icon: IconBell, link: PATH_APPS.notifications },
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
    title: 'Продвижение',
    links: [
      { label: 'Привлечение', icon: IconUserPlus, link: PATH_DASHBOARD.acquisition },
      { label: 'Публичная страница', icon: IconWorld, link: PATH_APPS.salonPage },
      { label: 'Баннеры и акции', icon: IconSpeakerphone, link: PATH_APPS.carousel },
      { label: 'Подписка клиентов', icon: IconCreditCard, link: PATH_APPS.orders },
    ],
  },
  {
    title: 'Профиль организации',
    links: [
      { label: 'Данные салона', icon: IconBuildingStore, link: PATH_APPS.settings },
      { label: 'Синхронизация', icon: IconRefresh, link: PATH_APPS.sync },
      { label: 'Документы', icon: IconFileText, link: PATH_APPS.documents },
      { label: 'Подписка салона', icon: IconReceipt, link: PATH_APPS.subscription },
      { label: 'Системные уведомления', icon: IconBellRinging, link: PATH_APPS.systemNotifications },
    ],
  },
];
