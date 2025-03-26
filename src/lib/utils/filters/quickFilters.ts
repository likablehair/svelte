import type { FilterBuilder } from "$lib";

type Item = {
  value: string;
  label?: string;
  data?: any;
}

type StringQuickFilter = {
  key: "string";
  value?: string;
  mode?: "equal" | "like" | "ilike" | "contains";
  missingValue?: boolean;
  missingLabel?: string;
  modify?: (params: {
    builder: FilterBuilder;
    value?: { value?: string; missingValue?: boolean };
  }) => FilterBuilder;
};

type NumberQuickFilter = {
  key: "number";
  value?: number;
  missingValue?: boolean;
  missingLabel?: string;
  modify?: (params: {
    builder: FilterBuilder;
    value?: { value?: number; missingValue?: boolean };
  }) => FilterBuilder;
};

type DateQuickFilter = {
  key: "date";
  from?: Date;
  to?: Date;
  modify?: (params: {
    builder: FilterBuilder;
    value?: { from?: Date; to?: Date };
  }) => FilterBuilder;
};

type BooleanQuickFilter = {
  key: "boolean";
  params?: {
    labelTrue: string;
    labelFalse: string;
  };
  value?: boolean;
  modify?: (params: {
    builder: FilterBuilder;
    value?: boolean;
  }) => FilterBuilder;
};

type CountryQuickFilter = {
  key: "country";
  selected?: Item[];
  missingValue?: boolean;
  missingLabel?: string;
  countriesOptions?: Item[];
  modify?: (params: {
    builder: FilterBuilder;
    value?: { values?: string[]; missingValue?: boolean };
  }) => FilterBuilder;
};

type MultiSelectQuickFilter = {
  key: "multi-select";
  items: Item[];
  values: Item[];
  missingValue?: boolean;
  missingLabel?: string;
  countriesAlpha2?: Item[];
  modify?: (params: {
    builder: FilterBuilder;
    value?: { values?: string[]; missingValue?: boolean };
  }) => FilterBuilder;
};

type CustomQuickFilter = {
  key: 'custom'
  value?: any
  missingValue?: boolean;
  modify: (params: {
    builder: FilterBuilder
    value?: { value?: any; missingValue?: boolean }
  }) => FilterBuilder
}

type QuickFilterType =
  | StringQuickFilter
  | NumberQuickFilter
  | DateQuickFilter
  | BooleanQuickFilter
  | CountryQuickFilter
  | MultiSelectQuickFilter
  | CustomQuickFilter

export type QuickFilter = {
  title: string;
  icon: string;
  description?: string;
  type: QuickFilterType;
  column?: string;
  info?: string;
  active?: boolean;
};