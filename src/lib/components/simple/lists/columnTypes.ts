export type ColumnDateParams = {
  format: string; // a format like yyyy MM dd using luxon placeholders
  locale: string; // a valid locale (read luxon documentation)
};

export type ColumnDate = {
  key: "date";
  params: ColumnDateParams;
};

export type ColumnIcon = {
  key: "icon";
  params: {
    name: string;
    color: string;
    size: string;
  };
};

export type ColumnBoolean = {
  key: "boolean";
  params?: {};
};

export type ColumnString = {
  key: "string";
  params?: {};
};

export type ColumnNumber = {
  key: "number";
  params?: {};
};

export type ColumnCostom = {
  key: "custom";
  params?: {};
};

export type ColumnCheckBox = {
  key: "checkbox";
  params?: {};
};
