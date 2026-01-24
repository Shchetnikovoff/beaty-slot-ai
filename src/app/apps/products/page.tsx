'use client';

import { useCallback, useState } from 'react';

import {
  Anchor,
  Button,
  Paper,
  PaperProps,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useDisclosure, useFetch } from '@mantine/hooks';
import { IconMoodEmpty, IconPlus } from '@tabler/icons-react';

import EditProductDrawer from '@/app/apps/products/components/EditProductDrawer';
import NewProductDrawer from '@/app/apps/products/components/NewProductDrawer';
import ProductsCard from '@/app/apps/products/components/ProductCard/ProductsCard';
import { ErrorAlert, PageHeader, Surface } from '@/components';
import { PATH_DASHBOARD } from '@/routes';
import { IApiResponse } from '@/types/api-response';
import { IProduct } from '@/types/products';

const items = [
  { title: 'Дашборд', href: PATH_DASHBOARD.default },
  { title: 'Приложения', href: '#' },
  { title: 'Тарифы', href: '#' },
].map((item, index) => (
  <Anchor href={item.href} key={index}>
    {item.title}
  </Anchor>
));

const CARD_PROPS: Omit<PaperProps, 'children'> = {
  p: 'md',
  shadow: 'md',
  radius: 'md',
};

function Products() {
  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);

  const {
    data: productsData,
    loading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useFetch<IApiResponse<IProduct[]>>('/api/products');

  const [newDrawerOpened, { open: newProductOpen, close: newProductClose }] =
    useDisclosure(false);

  const [editDrawerOpened, { open: editProductOpen, close: editProductClose }] =
    useDisclosure(false);

  const handleProductCreated = useCallback(() => {
    refetchProducts();
  }, [refetchProducts]);

  const handleProductUpdated = useCallback(() => {
    refetchProducts();
  }, [refetchProducts]);

  const handleEditProduct = (product: IProduct) => {
    setSelectedProduct(product);
    editProductOpen();
  };

  const projectItems = productsData?.data?.map((p: IProduct) => (
    <ProductsCard
      key={p.id}
      data={p}
      onEdit={handleEditProduct}
      {...CARD_PROPS}
    />
  ));

  const renderContent = () => {
    if (productsLoading) {
      return (
        <SimpleGrid
          cols={{ base: 1, sm: 2, lg: 3, xl: 4 }}
          spacing={{ base: 10, sm: 'xl' }}
          verticalSpacing={{ base: 'md', sm: 'xl' }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={`product-loading-${i}`}
              visible={true}
              height={300}
            />
          ))}
        </SimpleGrid>
      );
    }

    if (productsError || !productsData?.succeeded) {
      return (
        <ErrorAlert
          title="Ошибка загрузки тарифов"
          message={productsData?.errors?.join(',')}
        />
      );
    }

    if (!productsData?.data?.length) {
      return (
        <Surface p="md">
          <Stack align="center">
            <IconMoodEmpty size={24} />
            <Title order={4}>Тарифы не найдены</Title>
            <Text>
              У вас пока нет тарифов. Создайте первый.
            </Text>
            <Button
              leftSection={<IconPlus size={18} />}
              onClick={newProductOpen}
            >
              Новый тариф
            </Button>
          </Stack>
        </Surface>
      );
    }

    return (
      <SimpleGrid
        cols={{ base: 1, sm: 2, lg: 3, xl: 4 }}
        spacing={{ base: 10, sm: 'xl' }}
        verticalSpacing={{ base: 'md', sm: 'xl' }}
      >
        {projectItems}
      </SimpleGrid>
    );
  };

  return (
    <>
      <>
        <title>Тарифы | Beauty Slot</title>
        <meta
          name="description"
          content="Управление тарифами салона красоты Beauty Slot"
        />
      </>
      <PageHeader
        title="Тарифы"
        breadcrumbItems={items}
        actionButton={
          productsData?.data?.length && (
            <Button
              leftSection={<IconPlus size={18} />}
              onClick={newProductOpen}
            >
              Новый тариф
            </Button>
          )
        }
      />

      {renderContent()}

      <NewProductDrawer
        opened={newDrawerOpened}
        onClose={newProductClose}
        position="right"
        onProductCreated={handleProductCreated}
      />

      <EditProductDrawer
        opened={editDrawerOpened}
        onClose={editProductClose}
        position="right"
        product={selectedProduct}
        onProductUpdated={handleProductUpdated}
      />
    </>
  );
}

export default Products;
