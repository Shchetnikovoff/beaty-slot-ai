import {
  IconBook2,
  IconBrandAuth0,
  IconBriefcase,
  IconCalendar,
  IconChartArcs3,
  IconChartBar,
  IconChartInfographic,
  IconExclamationCircle,
  IconFileInvoice,
  IconFiles,
  IconLayersSubtract,
  IconLifebuoy,
  IconList,
  IconListDetails,
  IconLogin2,
  IconMessages,
  IconPackages,
  IconReceipt2,
  IconRotateRectangle,
  IconUserCircle,
  IconUserCode,
  IconUserPlus,
  IconUserShield,
  IconShoppingCart,
  IconUsers,
  IconCoin,
  IconSpeakerphone,
  IconStethoscope,
  IconSchool,
  IconTruckDelivery,
  IconUserCog,
  IconBuilding,
  IconRobot,
  IconBell,
} from '@tabler/icons-react';

import { PATH_ABOUT, PATH_APPS, PATH_AUTH, PATH_DASHBOARD, PATH_DOCS, PATH_PAGES } from '@/routes';

export const SIDEBAR_LINKS = [
  {
    title: 'Панель управления',
    links: [
      { label: 'Основной', icon: IconChartBar, link: PATH_DASHBOARD.default },
      {
        label: 'Аналитика',
        icon: IconChartInfographic,
        link: PATH_DASHBOARD.analytics,
      },
      { label: 'SaaS', icon: IconChartArcs3, link: PATH_DASHBOARD.saas },
      { label: 'Интернет-магазин', icon: IconShoppingCart, link: PATH_DASHBOARD.ecommerce },
      { label: 'CRM', icon: IconUsers, link: PATH_DASHBOARD.crm },
      { label: 'Финансы', icon: IconCoin, link: PATH_DASHBOARD.finance },
      { label: 'Маркетинг', icon: IconSpeakerphone, link: PATH_DASHBOARD.marketing, badge: 'NEW' },
      { label: 'Медицина', icon: IconStethoscope, link: PATH_DASHBOARD.healthcare, badge: 'NEW' },
      { label: 'Образование', icon: IconSchool, link: PATH_DASHBOARD.education, badge: 'NEW' },
      { label: 'Логистика', icon: IconTruckDelivery, link: PATH_DASHBOARD.logistics, badge: 'NEW' },
      { label: 'HR', icon: IconUserCog, link: PATH_DASHBOARD.hr, badge: 'NEW' },
      { label: 'Недвижимость', icon: IconBuilding, link: PATH_DASHBOARD.realEstate, badge: 'NEW' },
      { label: 'LLM/AI', icon: IconRobot, link: PATH_DASHBOARD.llm, badge: 'NEW' },
    ],
  },
  {
    title: 'Приложения',
    links: [
      { label: 'Профиль', icon: IconUserCircle, link: PATH_APPS.profile },
      { label: 'Настройки', icon: IconUserCode, link: PATH_APPS.settings },
      { label: 'Чат', icon: IconMessages, link: PATH_APPS.chat },
      { label: 'Проекты', icon: IconBriefcase, link: PATH_APPS.projects },
      { label: 'Заказы', icon: IconListDetails, link: PATH_APPS.orders },
      { label: 'Клиенты', icon: IconUsers, link: PATH_APPS.customers, badge: 'NEW' },
      { label: 'Почта', icon: IconMessages, link: PATH_APPS.email, badge: 'NEW' },
      { label: 'Уведомления', icon: IconBell, link: PATH_APPS.notifications, badge: 'NEW' },
      {
        label: 'Счета',
        icon: IconFileInvoice,
        links: [
          {
            label: 'Список',
            link: PATH_APPS.invoices.root,
          },
          {
            label: 'Детали',
            link: PATH_APPS.invoices.sample,
          },
        ],
      },
      { label: 'Задачи', icon: IconListDetails, link: PATH_APPS.tasks },
      { label: 'Календарь', icon: IconCalendar, link: PATH_APPS.calendar },
      {
        label: 'Файлы',
        icon: IconFiles,
        link: PATH_APPS.fileManager.root,
      },
      {
        label: 'Товары',
        icon: IconPackages,
        links: [
          { label: 'Список', link: PATH_APPS.products.root },
          { label: 'Категории', link: PATH_APPS.products.categories },
        ],
      },
    ],
  },
  {
    title: 'Авторизация',
    links: [
      { label: 'Войти', icon: IconLogin2, link: PATH_AUTH.signin },
      { label: 'Регистрация', icon: IconUserPlus, link: PATH_AUTH.signup },
      {
        label: 'Сброс пароля',
        icon: IconRotateRectangle,
        link: PATH_AUTH.passwordReset,
      },
      { label: 'Clerk', icon: IconUserShield, link: PATH_AUTH.clerk },
      { label: 'Auth0', icon: IconBrandAuth0, link: PATH_AUTH.auth0 },
    ],
  },
  {
    title: 'Страницы',
    links: [
      { label: 'Тарифы', icon: IconReceipt2, link: PATH_PAGES.pricing },
      { label: 'Пустая страница', icon: IconLayersSubtract, link: PATH_PAGES.blank },
    ],
  },
  {
    title: 'Документация',
    links: [
      {
        label: 'О проекте',
        icon: IconExclamationCircle,
        link: PATH_ABOUT.root,
      },
      {
        label: 'Начало работы',
        icon: IconLifebuoy,
        link: PATH_DOCS.root,
      },
      {
        label: 'Документация',
        icon: IconBook2,
        link: PATH_DOCS.root,
      },
      { label: 'История изменений', icon: IconList },
    ],
  },
];
