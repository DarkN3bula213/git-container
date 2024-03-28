export const getPayId = () => {
  const currentDate = new Date();
  const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
  const currentYear = String(currentDate.getFullYear()).slice(-2);

  return `${currentMonth}${currentYear}`;
};
