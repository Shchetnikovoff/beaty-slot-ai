'use client';

import {
  Badge,
  Box,
  Button,
  Group,
  Image,
  Paper,
  PaperProps,
  Text,
  Title,
} from '@mantine/core';
import { IconCheck, IconShoppingCartPlus } from '@tabler/icons-react';

import { useCartStore } from '@/lib/cart-store';
import type { IProduct } from '@/types/products';

interface ShopProductCardProps extends Omit<PaperProps, 'children'> {
  product: IProduct;
}

export function ShopProductCard({ product, ...props }: ShopProductCardProps) {
  const { addToCart, getItemQuantity, openCart } = useCartStore();
  const quantityInCart = getItemQuantity(product.id);

  const handleAddToCart = () => {
    addToCart(product);
    openCart();
  };

  const isInCart = quantityInCart > 0;

  return (
    <Paper
      p="sm"
      radius="md"
      withBorder
      {...props}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 340,
        ...props.style,
      }}
    >
      {/* Image - always shown */}
      <Image
        src={product.imageUrl}
        alt={product.title}
        h={140}
        radius="sm"
        fit="cover"
        fallbackSrc="https://placehold.co/400x300?text=No+Image"
        mb="xs"
      />

      {/* Category Badge */}
      <Badge variant="light" color="blue" size="xs" mb={4}>
        {product.categoryName || product.category?.title || 'Без категории'}
      </Badge>

      {/* Title & Description */}
      <Title order={6} lineClamp={1} mb={2}>
        {product.title}
      </Title>
      <Text size="xs" c="dimmed" lineClamp={2} mb="xs" style={{ minHeight: 32 }}>
        {product.description}
      </Text>

      {/* Spacer */}
      <Box style={{ flex: 1 }} />

      {/* Price */}
      <Text size="lg" fw={700} c="blue" mb="xs">
        {product.price.toLocaleString('ru-RU')} ₽
      </Text>

      {/* Add to Cart Button - always at bottom */}
      <Button
        fullWidth
        size="sm"
        variant={isInCart ? 'light' : 'filled'}
        color={isInCart ? 'green' : 'blue'}
        leftSection={isInCart ? <IconCheck size={16} /> : <IconShoppingCartPlus size={16} />}
        onClick={handleAddToCart}
        disabled={!product.isActive}
      >
        {isInCart ? `В корзине (${quantityInCart})` : 'В корзину'}
      </Button>
    </Paper>
  );
}

export default ShopProductCard;
