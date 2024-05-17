import type { JoinModifier } from "./modifiers/join"
import type { WhereModifier, WhereFilterValue } from "./modifiers/where"
import type { SelectModifier } from "./modifiers/select"
import type { FromModifier } from "./modifiers/from"
import type { OrderByModifier } from "./modifiers/orderBy"

export type Modifier = WhereModifier | JoinModifier | SelectModifier | FromModifier | OrderByModifier

export type JsonQuery = {
  modifiers: Modifier[]
}

export default class Builder {
  private modifiers: Modifier[] = []

  constructor() {
    this.modifiers = []
  }

  public where(callback: (builder: Builder) => void): Builder
  public where(key: Record<string, WhereFilterValue>): Builder
  public where(key: string, value: WhereFilterValue): Builder
  public where(key: string, operator: string, value: WhereFilterValue | boolean): Builder
  public where(
    first: string | Record<string, WhereFilterValue> | ((builder: Builder) => void),
    second?: WhereFilterValue,
    third?: WhereFilterValue | boolean
  ): Builder {
    return this.applyWhereClause('and', first, second, third)
  }

  public whereNot(callback: (builder: Builder) => void): Builder
  public whereNot(key: Record<string, WhereFilterValue>): Builder
  public whereNot(key: string, value: WhereFilterValue): Builder
  public whereNot(key: string, operator: string, value: WhereFilterValue): Builder
  public whereNot(
    first: string | Record<string, WhereFilterValue> | ((builder: Builder) => void),
    second?: WhereFilterValue,
    third?: WhereFilterValue
  ): Builder {
    return this.applyWhereClause('andNot', first, second, third)
  }

  public orWhere(callback: (builder: Builder) => void): Builder
  public orWhere(key: Record<string, WhereFilterValue>): Builder
  public orWhere(key: string, value: WhereFilterValue): Builder
  public orWhere(key: string, operator: string, value: WhereFilterValue): Builder
  public orWhere(
    first: string | Record<string, WhereFilterValue> | ((builder: Builder) => void),
    second?: WhereFilterValue,
    third?: WhereFilterValue
  ): Builder {
    return this.applyWhereClause('or', first, second, third)
  }

  public orWhereNot(callback: (builder: Builder) => void): Builder
  public orWhereNot(key: Record<string, WhereFilterValue>): Builder
  public orWhereNot(key: string, value: WhereFilterValue): Builder
  public orWhereNot(key: string, operator: string, value: WhereFilterValue): Builder
  public orWhereNot(
    first: string | Record<string, WhereFilterValue> | ((builder: Builder) => void),
    second?: WhereFilterValue,
    third?: WhereFilterValue
  ): Builder {
    return this.applyWhereClause('orNot', first, second, third)
  }

  public whereColumn(key: string, compareColumn: string): Builder
  public whereColumn(key: string, operator: string, compareColumn: string): Builder
  public whereColumn(
    first: string,
    second: string,
    third?: string
  ): Builder {
    return this.applyWhereColumnClause('and', first, second, third)
  }

  public orWhereColumn(key: string, compareColumn: string): Builder
  public orWhereColumn(key: string, operator: string, compareColumn: string): Builder
  public orWhereColumn(
    first: string,
    second: string,
    third?: string
  ): Builder {
    return this.applyWhereColumnClause('or', first, second, third)
  }

  public whereJsonSuperset(key: string, object: Object): Builder
  public whereJsonSuperset(
    first: string,
    second: Object,
  ): Builder {
    return this.applyWhereJsonSupersetClause('and', first, second)
  }

  public orWhereJsonSuperset(key: string, object: Object): Builder
  public orWhereJsonSuperset(
    first: string,
    second: Object
  ): Builder {
    return this.applyWhereJsonSupersetClause('or', first, second)
  }

  public whereIn(key: string, callback: (builder: Builder) => void): Builder
  public whereIn(key: string, values: WhereFilterValue[]): Builder 
  public whereIn(
    key: string, 
    second: ((builder: Builder) => void) | WhereFilterValue[]
  ): Builder {
    return this.applyWhereInClause('and', key, second)
  }

  public orWhereIn(key: string, callback: (builder: Builder) => void): Builder
  public orWhereIn(key: string, values: WhereFilterValue[]): Builder 
  public orWhereIn(
    key: string, 
    second: ((builder: Builder) => void) | WhereFilterValue[]
  ): Builder {
    return this.applyWhereInClause('or', key, second)
  }

  public notWhereIn(key: string, callback: (builder: Builder) => void): Builder
  public notWhereIn(key: string, values: WhereFilterValue[]): Builder 
  public notWhereIn(
    key: string, 
    second: ((builder: Builder) => void) | WhereFilterValue[]
  ): Builder {
    return this.applyWhereInClause('andNot', key, second)
  }

  public orNotWhereIn(key: string, callback: (builder: Builder) => void): Builder
  public orNotWhereIn(key: string, values: WhereFilterValue[]): Builder 
  public orNotWhereIn(
    key: string, 
    second: ((builder: Builder) => void) | WhereFilterValue[]
  ): Builder {
    return this.applyWhereInClause('orNot', key, second)
  }

  private applyWhereInClause(
    logicalOperator: 'and' | 'or' | 'andNot' | 'orNot',
    key: string,
    second: WhereFilterValue[] | ((builder: Builder) => void)
  ): Builder {
    if(typeof second == 'function') {
      let inBuilder = new Builder()
      second(inBuilder)

      this.modifiers.push({
        method: 'where',
        kind: 'inBuilder',
        logicalOperator: logicalOperator,
        key: key,
        children: inBuilder.modifiers.filter((el) => el.method == 'where' || el.method == 'select') as (WhereModifier | SelectModifier)[]
      })
    } else {
      this.modifiers.push({
        method: 'where',
        kind: 'in',
        logicalOperator: logicalOperator,
        key: key,
        value: second
      })
    }

    return this
  }
  
  public whereNull(
    key: string
  ): Builder {
    return this.applyWhereNullClause('and', key)
  }

  public orWhereNull(
    key: string
  ): Builder {
    return this.applyWhereNullClause('or', key)
  }

  public notWhereNull(
    key: string
  ): Builder {
    return this.applyWhereNullClause('andNot', key)
  }

  public orNotWhereNull(
    key: string
  ): Builder {
    return this.applyWhereNullClause('orNot', key)
  }

  private applyWhereNullClause(
    logicalOperator: 'and' | 'or' | 'andNot' | 'orNot',
    key: string
  ): Builder {
    this.modifiers.push({
      method: 'where',
      kind: 'null',
      logicalOperator: logicalOperator,
      key: key
    })
    return this
  }


  private applyWhereClause(
    logicalOperator: 'and' | 'or' | 'andNot' | 'orNot',
    first: string | Record<string, WhereFilterValue> | ((builder: Builder) => void),
    second?: WhereFilterValue,
    third?: WhereFilterValue | boolean,
  ): Builder {

    if (third !== undefined) {
      if (!!second && typeof first == 'string' && typeof second == 'string') {
        this.modifiers.push({
          method: 'where',
          kind: 'simple',
          key: first,
          operator: second,
          value: third,
          logicalOperator: logicalOperator
        })
      } else if (typeof first == 'object') {
        this.modifiers.push({
          method: 'where',
          kind: 'object',
          values: first,
          logicalOperator
        })
      }
    } else if (typeof first == 'string' && second !== undefined ) {      
      this.modifiers.push({
        method: 'where',
        kind: 'simple',
        key: first,
        value: second,
        logicalOperator
      })
    } else if (typeof first == 'function') {
      let builder = new Builder()
      first(builder)
      if (!builder.modifiers.every(el => el.method == 'where')) throw new Error('inconsistent json query from where callback')

      this.modifiers.push({
        method: 'where',
        kind: 'grouped',
        logicalOperator,
        children: builder.modifiers.filter((el) => el.method == 'where') as WhereModifier[]
      })
    }
    return this
  }

  private applyWhereColumnClause(
    logicalOperator: 'and' | 'or',
    first: string,
    second: string,
    third?: string,
  ): Builder {

    if (third !== undefined) {
      this.modifiers.push({
        method: 'where',
        kind: 'column',
        key: first,
        operator: second,
        column: third,
        logicalOperator: logicalOperator
      })
    } else {
      this.modifiers.push({
        method: 'where',
        kind: 'column',
        key: first,
        column: second,
        logicalOperator: logicalOperator
      })
    }
    return this
  }

  private applyWhereJsonSupersetClause(
    logicalOperator: 'and' | 'or',
    first: string,
    second: Object,
  ): Builder {
    this.modifiers.push({
      method: 'where',
      kind: 'jsonSuperset',
      key: first,
      value: second,
      logicalOperator: logicalOperator
    })
    return this
  }

  public join(table: string, onCallback: (onBuilder: OnClauseBuilder) => void) {
    let onBuilder = new OnClauseBuilder()
    onCallback(onBuilder)

    this.applyJoinClause('inner', table, onBuilder.json)
    return this
  }

  public leftJoin(table: string, onCallback: (onBuilder: OnClauseBuilder) => void) {
    let onBuilder = new OnClauseBuilder()
    onCallback(onBuilder)

    this.applyJoinClause('left', table, onBuilder.json)
    return this
  }

  public rightJoin(table: string, onCallback: (onBuilder: OnClauseBuilder) => void) {
    let onBuilder = new OnClauseBuilder()
    onCallback(onBuilder)

    this.applyJoinClause('right', table, onBuilder.json)
    return this
  }

  private applyJoinClause(kind: 'right' | 'left' | 'inner', table: string, on: JoinModifierOnClause[]) {
    this.modifiers.push({
      method: 'join',
      kind: kind,
      on: on,
      table: table
    })
    return this
  }

  public toJson(): JsonQuery {
    return {
      modifiers: this.modifiers
    }
  }

  public select(fields: string | string[]) {
    this.modifiers.push({
      method: 'select',
      fields: fields
    })
    return this
  }

  public from(from: string) {
    this.modifiers.push({
      method: 'from',
      from: from
    })
    return this
  }
  
  public orderBy(sortBy: string, sortDirection: "asc" | "desc") {
    this.modifiers.push({
      method: 'orderBy',
      sortBy: sortBy,
      sortDirection: sortDirection
    })
    return this
  }
  
}

import type { JoinModifierOnClause } from "./modifiers/join"

class OnClauseBuilder {
  private onClauses: JoinModifierOnClause[]

  constructor() {
    this.onClauses = []
  }

  get json(): JoinModifierOnClause[] {
    return this.onClauses
  }

  public on(from: string, to: string): void
  public on(from: string, operator: string, to: string): void
  public on(first: string, second: string, third?: string): void {
    if (!third) {
      this.onClauses.push({
        from: first,
        operator: '=',
        to: second
      })
    } else {
      this.onClauses.push({
        from: first,
        operator: second,
        to: third
      })
    }
  }

  public orOn(from: string, to: string): void
  public orOn(from: string, operator: string, to: string): void
  public orOn(first: string, second: string, third?: string): void {
    if (!third) {
      this.onClauses.push({
        from: first,
        operator: '=',
        to: second,
        logicalOperator: 'or'
      })
    } else {
      this.onClauses.push({
        from: first,
        operator: second,
        to: third,
        logicalOperator: 'or'
      })
    }
  }
}