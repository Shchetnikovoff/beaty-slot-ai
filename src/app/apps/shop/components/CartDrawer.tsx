'use client';

import {
  ActionIcon,
  Button,
  Divider,
  Drawer,
  Group,
  Image,
  NumberInput,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { IconMinus, IconPlus, IconShoppingCart, IconTrash, IconX } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

import { useCartStore } from '@/lib/cart-store';
import type { CartItem } from '@/types/shop';

function CartItemCard({ item }: { item: CartItem }) {
  const { updateQuantity, removeFromCart } = useCartStore();

  const handleQuantityChange = (value: string | number) => {
    const qty = typeof value === 'string' ? parseInt(value, 10) : value;
    if (!isNaN(qty)) {
      updateQuantity(item.product.id, qty);
    }
  };

  return (
    <Paper p="sm" withBorder radius="sm">
      <Group wrap="nowrap" align="flex-start">
        {/* Image */}
        {item.product.imageUrl && (
          <Image
            src={item.product.imageUrl}
            alt={item.product.title}
            w={60}
            h={60}
            radius="sm"
            fit="cover"
          />
        )}

        {/* Info */}
        <Stack gap={4} style={{ flex: 1 }}>
          <Text size="sm" fw={500} lineClamp={1}>
            {item.product.title}
          </Text>
          <Text size="sm" c="blue" fw={600}>
            {item.product.price.toLocaleString('ru-RU')} ₽
          </Text>

          {/* Quantity Controls */}
          <Group gap="xs">
            <ActionIcon
              size="sm"
              variant="light"
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={item.quantity <= 1}
            >
              <IconMinus size={14} />
            </ActionIcon>

            <NumberInput
              value={item.quantity}
              onChange={handleQuantityChange}
              min={1}
              max={99}
              size="xs"
              w={50}
              hideControls
              styles={{ input: { textAlign: 'center' } }}
            />

            <ActionIcon
              size="sm"
              variant="light"
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={item.quantity >= 99}
            >
              <IconPlus size={14} />
            </ActionIcon>
          </Group>
        </Stack>

        {/* Delete Button */}
        <ActionIcon
          variant="subtle"
          color="red"
          onClick={() => removeFromCart(item.product.id)}
        >
          <IconTrash size={16} />
        </ActionIcon>
      </Group>

      {/* Item Total */}
      <Text size="xs" c="dimmed" ta="right" mt="xs">
        Итого: {(item.product.price * item.quantity).toLocaleString('ru-RU')} ₽
      </Text>
    </Paper>
  );
}

export function CartDrawer() {
  const router = useRouter();
  const { items, isOpen, closeCart, clearCart, getTotal } = useCartStore();

  const handleCheckout = () => {
    closeCart();
    router.push('/apps/shop/checkout');
  };

  const total = getTotal();

  return (
    <Drawer
      opened={isOpen}
      onClose={closeCart}
      title={
        <Group gap="xs">
          <IconShoppingCart size={20} />
          <Title order={4}>Корзина</Title>
        </Group>
      }
      position="right"
      size="md"
      padding="md"
    >
      <Stack h="calc(100vh - 120px)" justify="space-between">
        {/* Cart Items */}
        <Stack gap="sm" style={{ flex: 1, overflowY: 'auto' }}>
          {items.length === 0 ? (
            <Stack align="center" justify="center" h={200}>
              <IconShoppingCart size={48} color="gray" stroke={1.5} />
              <Text c="dimmed">Корзина пуста</Text>
            </Stack>
          ) : (
            <>
              {items.map((item) => (
                <CartItemCard key={item.product.id} item={item} />
              ))}
            </>
          )}
        </Stack>

        {/* Footer */}
        {items.length > 0 && (
          <Stack gap="sm">
            <Divider />

            {/* Total */}
            <Group justify="space-between">
              <Text size="lg" fw={500}>
                Итого:
              </Text>
              <Text size="xl" fw={700} c="blue">
                {total.toLocaleString('ru-RU')} ₽
              </Text>
            </Group>

            {/* Actions */}
            <Group grow>
              <Button
                variant="light"
                color="red"
                leftSection={<IconX size={16} />}
                onClick={clearCart}
              >
                Очистить
              </Button>
              <Button onClick={handleCheckout}>
                Оформить заказ
              </Button>
            </Group>
          </Stack>
        )}
      </Stack>
    </Drawer>
  );
}

export default CartDrawer;
