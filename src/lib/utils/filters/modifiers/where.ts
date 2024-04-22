import type { Modifier } from "../builder"

export type WhereFilterValue = string | number | Date | boolean

type GroupedWhere = {
  method: 'where',
  kind: 'grouped',
  logicalOperator?: 'and' | 'or' | 'andNot' | 'orNot',
  children: (ObjectWhere | SimpleWhere | GroupedWhere | InWhere | ColumnWhere | JsonSupersetWhere | InBuilderWhere | NullWhere)[]
}

type ObjectWhere = {
  method: 'where',
  kind: 'object',
  logicalOperator?: 'and' | 'or' | 'andNot' | 'orNot',
  values: Record<string, WhereFilterValue>
}

type SimpleWhere = {
  method: 'where',
  kind: 'simple',
  logicalOperator?: 'and' | 'or' | 'andNot' | 'orNot',
  key: string,
  operator?: string,
  value: WhereFilterValue
}

type ColumnWhere = {
  method: 'where',
  kind: 'column',
  logicalOperator?: 'and' | 'or',
  key: string,
  operator?: string,
  column: string
}

type InWhere = {
  method: 'where',
  kind: 'in',
  logicalOperator?: 'and' | 'or' | 'andNot' | 'orNot',
  key: string,
  value: (WhereFilterValue)[]
}

type InBuilderWhere = {
  method: 'where',
  kind: 'inBuilder',
  logicalOperator?: 'and' | 'or' | 'andNot' | 'orNot',
  key: string,
  modifiers: Modifier[]
}

type JsonSupersetWhere = {
  method: 'where',
  kind: 'jsonSuperset',
  logicalOperator?: 'and' | 'or' | 'andNot' | 'orNot',
  key: string,
  value: Object
}

type NullWhere = {
  method: 'where',
  kind: 'null',
  logicalOperator?: 'and' | 'or' | 'andNot' | 'orNot',
  key: string
}

export type WhereModifier = SimpleWhere | ObjectWhere | GroupedWhere | InWhere | ColumnWhere | JsonSupersetWhere | InBuilderWhere | NullWhere