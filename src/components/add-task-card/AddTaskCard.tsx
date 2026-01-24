'use client';

import { useState } from 'react';

import { Button, Flex, Input, Text } from '@mantine/core';

type AddCardProps = {
  addCard: (title: string) => void;
};

const AddTaskCard = ({ addCard }: AddCardProps) => {
  const [title, setTitle] = useState<string>('');

  return (
    <Flex align="center">
      <Text ta="center">Название карточки</Text>
      <Input
        type="text"
        onChange={(e) => setTitle(e.target.value)}
        value={title}
      />
      <Button
        onClick={() => {
          setTitle('');
          addCard(title);
        }}
      >
        Добавить карточку
      </Button>
    </Flex>
  );
};

export default AddTaskCard;
