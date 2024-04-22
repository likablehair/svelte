export type JoinModifierOnClause = {
  from: string
  operator: string
  to: string
  logicalOperator?: 'and' | 'or'
}

type RightJoinModifier = {
  method: 'join',
  kind: 'right',
  table: string,
  on: JoinModifierOnClause[]
}

type InnerJoinModifier = {
  method: 'join',
  kind: 'inner',
  table: string,
  on: JoinModifierOnClause[]
}

type LeftJoinModifier = {
  method: 'join'
  kind: 'left'
  table: string
  on: JoinModifierOnClause[]
}

export type JoinModifier = LeftJoinModifier | InnerJoinModifier | RightJoinModifier