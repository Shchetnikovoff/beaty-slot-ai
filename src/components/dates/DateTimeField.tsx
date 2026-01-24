import { DateTimePicker, DateTimePickerProps } from '@mantine/dates';

type DateTimeFieldProps = DateTimePickerProps;

/**
 * For more docs see - https://mantine.dev/dates/date-time-picker/
 * @param others
 * @constructor
 */
const DateTimeField = ({ ...others }: DateTimeFieldProps) => {
  return (
    <DateTimePicker
      label="Выберите дату и время"
      placeholder="Выберите дату и время"
      {...others}
    />
  );
};

export default DateTimeField;
