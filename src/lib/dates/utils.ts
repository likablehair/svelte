export const monthNames: string[] = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

export const monthDays: number[] = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export const isLeapYear: (year: number) => boolean = year => year % 4 === 0;

export const getEmptyRows: () => any[] = () => {
  return Array.from({ length: 42 }).map(() => []);
};

export const getMonthDays: (index: number, year: number) => number = (index, year) => {
  return index !== 1 ? monthDays[index] : isLeapYear(year) ? 29 : 28;
};

export const getMonthName: (index: number) => string = index => monthNames[index];

export type MonthStats = {
  name: string;
  days: number;
}
const getMonthStats: (monthIndex: number, year: number) => MonthStats = (monthIndex, year) => {
  const today = new Date(year, monthIndex, 1);
  const index = today.getMonth();
  return {
    name: index[index],
    days: getMonthDays(index, year)
  };
};


export const getDateRows: (monthIndex: number, year: number) => number[] = (monthIndex, year) => {
  const { days } = getMonthStats(monthIndex, year);
  const { days: daysOfPreviousMonth } = getMonthStats(monthIndex - 1, year);

  const rows = getEmptyRows();
  let startIndex = new Date(year, monthIndex, 1).getDay();
  if(startIndex === 0) startIndex = 6
  else startIndex -= 1

  let lastIndex = new Date(year, monthIndex + 1, 0).getDay()
  if (lastIndex === 0) lastIndex = 6
  else lastIndex -= 1

  Array.from({ length: days }).forEach((_, i) => {
    const index = startIndex + i;
    rows[index] = i + 1;
  });

  Array.from({length: startIndex}).forEach((_, i) => {
    rows[i] = (daysOfPreviousMonth - startIndex) + i + 1
  })

  if(lastIndex !== 6) {
    Array.from({ length: (6 - lastIndex)}).forEach((_, i) => {
      rows[startIndex + days + i] = i + 1
    })
  }

  return rows.filter(el => !Array.isArray(el))
};

type dateFormat = 'extended'
export const dateToString: (date: Date, format?: dateFormat) => string = (date, format='extended') => {
  let stringDate = ""
  if(format == 'extended') {
    const day = date.getDate()
    const month = getMonthName(date.getMonth())
    const year = date.getFullYear()

    stringDate = `${day} ${month} ${year}`
  }

  return stringDate
}