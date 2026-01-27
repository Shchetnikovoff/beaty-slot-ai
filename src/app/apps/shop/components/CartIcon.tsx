'use client';

import { ActionIcon, Indicator } from '@mantine/core';
import { IconShoppingCart } from '@tabler/icons-react';

import { useCartStore } from '@/lib/cart-store';

interface CartIconProps {
  onClick?: () => void;
}

export function CartIcon({ onClick }: CartIconProps) {
  const { items, toggleCart } = useCartStore();
  const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      toggleCart();
    }
  };

  return (
    <Indicator
      label={itemsCount}
      size={18}
      disabled={itemsCount === 0}
      color="red"
      offset={4}
    >
      <ActionIcon
        variant="light"
        size="lg"
        radius="md"
        onClick={handleClick}
        aria-label="Корзина"
      >
        <IconShoppingCart size={20} />
      </ActionIcon>
    </Indicator>
  );
}

export default CartIcon;
