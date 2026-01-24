import { Accordion, Box, BoxProps, Title } from '@mantine/core';

import classes from './Faqs.module.css';

const placeholder =
  'It can’t help but hear a pin drop from over half a mile away, so it lives deep in the mountains where there aren’t many people or Pokémon.It was born from sludge on the ocean floor. In a sterile environment, the germs within its body can’t multiply, and it dies.It has no eyeballs, so it can’t see. It checks its surroundings via the ultrasonic waves it emits from its mouth.';

type FaqsProps = BoxProps;

const Faqs = ({ ...others }: FaqsProps) => {
  return (
    <Box {...others}>
      <Title order={3} my="md" ta="center">
        Часто задаваемые вопросы
      </Title>

      <Accordion radius="md" classNames={classes}>
        <Accordion.Item value="reset-password">
          <Accordion.Control>Как сбросить пароль?</Accordion.Control>
          <Accordion.Panel>{placeholder}</Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="another-account">
          <Accordion.Control>
            Могу ли я создать более одного аккаунта?
          </Accordion.Control>
          <Accordion.Panel>{placeholder}</Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="newsletter">
          <Accordion.Control>
            Как подписаться на ежемесячную рассылку?
          </Accordion.Control>
          <Accordion.Panel>{placeholder}</Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="credit-card">
          <Accordion.Control>
            Вы безопасно храните данные кредитных карт?
          </Accordion.Control>
          <Accordion.Panel>{placeholder}</Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="payment">
          <Accordion.Control>
            С какими платёжными системами вы работаете?
          </Accordion.Control>
          <Accordion.Panel>{placeholder}</Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Box>
  );
};

export default Faqs;
