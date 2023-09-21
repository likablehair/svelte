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
  values: Record<string, string | number | Date>
}

type SimpleWhere = {
  method: 'where',
  kind: 'simple',
  logicalOperator?: 'and' | 'or' | 'andNot' | 'orNot',
  key: string,
  operator?: string,
  value: string | number | Date | boolean
}

type InWhere = {
  method: 'where',
  kind: 'in',
  logicalOperator?: 'and' | 'or' | 'andNot' | 'orNot',
  key: string,
  value: (string | number | Date)[]
}

export type WhereModifier = SimpleWhere | ObjectWhere | GroupedWhere | InWhere