'use client';

import { useState } from 'react';
import {
  Box,
  Container,
  Image,
  Modal,
  ActionIcon,
  Group,
} from '@mantine/core';
import { Carousel } from '@mantine/carousel';
import { IconChevronLeft, IconChevronRight, IconX } from '@tabler/icons-react';
import type { CarouselItem } from '@/types/carousel';

interface HeroCarouselProps {
  items: CarouselItem[];
}

export function HeroCarousel({ items }: HeroCarouselProps) {
  const [selectedItem, setSelectedItem] = useState<CarouselItem | null>(null);
  const [pdfImageIndex, setPdfImageIndex] = useState(0);

  const openDocument = (item: CarouselItem) => {
    setSelectedItem(item);
    setPdfImageIndex(0);
  };

  const closeDocument = () => {
    setSelectedItem(null);
    setPdfImageIndex(0);
  };

  const nextPdfImage = () => {
    if (selectedItem && pdfImageIndex < selectedItem.pdf_images_urls.length - 1) {
      setPdfImageIndex(pdfImageIndex + 1);
    }
  };

  const prevPdfImage = () => {
    if (pdfImageIndex > 0) {
      setPdfImageIndex(pdfImageIndex - 1);
    }
  };

  return (
    <>
      <Box py="xl" style={{ backgroundColor: 'white' }}>
        <Container size="xl">
          <Carousel
            withIndicators
            height={400}
            slideSize={{ base: '100%', sm: '50%', md: '33.333%' }}
            slideGap="md"
            loop
            align="start"
            styles={{
              control: {
                backgroundColor: 'white',
                border: '1px solid var(--mantine-color-gray-3)',
              },
              indicator: {
                backgroundColor: 'var(--mantine-color-gray-4)',
                '&[data-active]': {
                  backgroundColor: 'var(--mantine-color-blue-6)',
                },
              },
            }}
          >
            {items.map((item) => (
              <Carousel.Slide key={item.id}>
                <Box
                  onClick={() => openDocument(item)}
                  style={{
                    cursor: 'pointer',
                    borderRadius: 12,
                    overflow: 'hidden',
                    height: '100%',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'scale(1.02)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                    },
                  }}
                >
                  <Image
                    src={item.image_url}
                    alt={item.title || 'Акция'}
                    h={400}
                    fit="cover"
                    radius="md"
                    style={{
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                    }}
                  />
                </Box>
              </Carousel.Slide>
            ))}
          </Carousel>
        </Container>
      </Box>

      {/* Document Viewer Modal */}
      <Modal
        opened={!!selectedItem}
        onClose={closeDocument}
        size="xl"
        padding={0}
        withCloseButton={false}
        centered
        styles={{
          content: {
            backgroundColor: 'transparent',
            boxShadow: 'none',
          },
          body: {
            padding: 0,
          },
        }}
      >
        {selectedItem && (
          <Box pos="relative">
            {/* Close Button */}
            <ActionIcon
              variant="filled"
              color="dark"
              size="lg"
              radius="xl"
              pos="absolute"
              top={16}
              right={16}
              style={{ zIndex: 10 }}
              onClick={closeDocument}
            >
              <IconX size={20} />
            </ActionIcon>

            {/* PDF Images or Single Image */}
            {selectedItem.pdf_images_urls.length > 0 ? (
              <>
                <Image
                  src={selectedItem.pdf_images_urls[pdfImageIndex]}
                  alt={`${selectedItem.title || 'Документ'} - страница ${pdfImageIndex + 1}`}
                  radius="md"
                  style={{
                    maxHeight: '80vh',
                    width: '100%',
                    objectFit: 'contain',
                  }}
                />

                {/* Navigation */}
                {selectedItem.pdf_images_urls.length > 1 && (
                  <Group justify="center" gap="md" mt="md">
                    <ActionIcon
                      variant="filled"
                      color="dark"
                      size="lg"
                      radius="xl"
                      onClick={prevPdfImage}
                      disabled={pdfImageIndex === 0}
                    >
                      <IconChevronLeft size={20} />
                    </ActionIcon>
                    <Box
                      px="md"
                      py="xs"
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        borderRadius: 20,
                        color: 'white',
                      }}
                    >
                      {pdfImageIndex + 1} / {selectedItem.pdf_images_urls.length}
                    </Box>
                    <ActionIcon
                      variant="filled"
                      color="dark"
                      size="lg"
                      radius="xl"
                      onClick={nextPdfImage}
                      disabled={pdfImageIndex === selectedItem.pdf_images_urls.length - 1}
                    >
                      <IconChevronRight size={20} />
                    </ActionIcon>
                  </Group>
                )}
              </>
            ) : (
              <Image
                src={selectedItem.pdf_url || selectedItem.image_url}
                alt={selectedItem.title || 'Документ'}
                radius="md"
                style={{
                  maxHeight: '80vh',
                  width: '100%',
                  objectFit: 'contain',
                }}
              />
            )}
          </Box>
        )}
      </Modal>
    </>
  );
}
