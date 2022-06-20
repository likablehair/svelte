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

export const dayNames: string[] = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat"
]

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

  Array.from({ length: startIndex }).forEach((_, i) => {
    rows[i] = (daysOfPreviousMonth - startIndex) + i + 1
  })

  if(lastIndex !== 6) {
    Array.from({ length: (6 - lastIndex)}).forEach((_, i) => {
      rows[startIndex + days + i] = i + 1
    })
  }

  return rows.filter(el => !Array.isArray(el))
};

export type DateStat = {
  dayOfMonth: number,
  dayOfWeek: number,
  month: number,
  year: number
}

export const getDateRowsStats: (monthIndex: number, year: number) => DateStat[] = (monthIndex, year) => {
  let results = []
  const days = getDateRows(monthIndex, year)
  for(let i = 0; i < days.length; i += 1) {
    let dateStat: DateStat = {
      dayOfMonth: days[i],
      dayOfWeek: i % 7,
      month: monthIndex,
      year: year
    }

    if(days[i] >= 20 && Math.floor(i / 7) == 0) {
      if(monthIndex === 0) {
        dateStat.month = 11
        dateStat.year = year - 1
      } else {
        dateStat.month = monthIndex - 1
      }
    } else if (days[i] < 10 && Math.floor(i / 7) > 2) {
      if(monthIndex === 11) {
        dateStat.month = 0
        dateStat.year = year + 1
      } else {
        dateStat.month = monthIndex + 1
      }
    }

    results.push(dateStat)
  }

  return results
}

type dateFormat = 'extended' | 'extendedMonthAndYear'
const dateToExtendedString: (date: Date) => string = (date) => {
  const day = date.getDate()
  const month = getMonthName(date.getMonth())
  const year = date.getFullYear()

  return `${day} ${month} ${year}`
}

const dateToExtendedMonthAndYearString: (date: Date) => string = (date) => {
  const month = getMonthName(date.getMonth())
  const year = date.getFullYear()

  return `${month} ${year}`
}

export const dateToString: (date: Date, format?: dateFormat) => string = (date, format='extended') => {
  if(format == 'extended') {
    return dateToExtendedString(date)
  } else if (format == 'extendedMonthAndYear') {
    return dateToExtendedMonthAndYearString(date)
  }
}