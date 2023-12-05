export type WhereFilterValue = string | number | Date | boolean

type GroupedWhere = {
  method: 'where',
  kind: 'grouped',
  logicalOperator?: 'and' | 'or' | 'andNot' | 'orNot',
  children: (ObjectWhere | SimpleWhere | GroupedWhere | InWhere)[]
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
  value: WhereFilterValue | boolean
}

type InWhere = {
  method: 'where',
  kind: 'in',
  logicalOperator?: 'and' | 'or' | 'andNot' | 'orNot',
  key: string,
  value: (WhereFilterValue)[]
}

export type WhereModifier = SimpleWhere | ObjectWhere | GroupedWhere | InWhere