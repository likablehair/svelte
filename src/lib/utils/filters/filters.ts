import Builder from "./builder"

export const STRING_MODES = ['equal', 'like', 'ilike', 'contains'] as const
export type StringMode = typeof STRING_MODES[number]
export function isStringMode(mode: any): mode is StringMode { 
  return STRING_MODES.includes(mode)
}

export const GENERIC_MODES = ['equal', 'greater', 'lower', 'between'] as const
export type DateMode = typeof GENERIC_MODES[number]
export function isDateMode(mode: any): mode is DateMode { 
  return GENERIC_MODES.includes(mode)
}

export type NumberMode = typeof GENERIC_MODES[number]
export function isNumberMode(mode: any): mode is NumberMode { 
  return GENERIC_MODES.includes(mode)
}

export const SELECT_MODES = ['equal', 'different'] as const
export type SelectMode = typeof SELECT_MODES[number]
export function isSelectMode(mode: any): mode is SelectMode { 
  return SELECT_MODES.includes(mode)
}

type MultiStringFilter = {
  type: 'multiString',
  modify?: (params: {
    builder: Builder,
    value?: string
  }) => Builder,
  columns: string[],
  operator?: 'or' | 'and',
  value?: string
}


type ChoiceFilter = {
  type: 'choice',
  modify?: (params: {
    builder: Builder,
    value?: string
  }) => Builder,
  column: string,
  value?: string,
  operator?: 'or' | 'and'
  options: any[]
}

type StringFilter = {
  type: 'string',
  modify?: (params: {
    builder: Builder,
    value?: string
  }) => Builder,
  column: string,
  value?: string,
  mode?: StringMode
}

type DateFilter = {
  type: 'date',
  column: string,
} & (
  {
    mode: 'between',
    modify?: (params: {
      builder: Builder,
      value: { from?: Date, to?: Date }
    }) => Builder,
    from?: Date,
    to?: Date
  } | {
    mode: 'equal' | 'greater' | 'lower',
    modify?: (params: {
      builder: Builder,
      value?: Date
    }) => Builder,
    value?: Date,
  }
)

type NumberFilter = {
  type: 'number',
  column: string
} & (
  {
    mode: 'between',
    modify?: (params: {
      builder: Builder,
      value: { from?: number, to?: number },
      mode: 'between'
    }) => Builder,
    from?: number,
    to?: number
  } | {
    mode: 'equal' | 'greater' | 'lower',
    modify?: (params: {
      builder: Builder,
      value?: number,
      mode: 'equal' | 'greater' | 'lower',
    }) => Builder,
    value?: number,
  }
)

type SelectFilter = {
  type: 'select',
  view?: 'toggle' | 'autocomplete',
  modify?: (params: {
    builder: Builder,
    values?: { value: string | number, label?: string | number }[]
  }) => Builder,
  column: string,
  mode: SelectMode,
  items: { value: string | number, label: string }[]
  values?: { value: string | number, label?: string | number }[]
}

type BoolFilter = {
  type: 'bool',
  modify?: (params: {
    builder: Builder,
    value?: boolean
  }) => Builder,
  column: string,
  mode: 'equal',
  value?: boolean
  advanced?: false
  description: string
}

type CustomFilter = {
  type: 'custom',
  modify: (params: {
    builder: Builder,
    value?: any
  }) => Builder,
  value?: any,
  data?: any
}

export type Filter = {
  name: string,
  active?: boolean,
  hidden?: boolean,
  label: string,
  advanced?: boolean,
} & (StringFilter | MultiStringFilter | ChoiceFilter | DateFilter | NumberFilter | SelectFilter | BoolFilter | CustomFilter )


export default class Converter {
  constructor() {

  }

  public createBuilder(params: {
    filters: Filter[]
  }): Builder {
    let builder = new Builder()

    for(let i = 0; i < params.filters.length; i += 1) {
      const filter = params.filters[i]

      if(!filter.active) continue

      if (!!filter.modify) {
        if ('value' in filter && filter.value !== undefined) {
          builder = filter.modify({
            builder,
            value: filter.value,
            mode: filter.type === 'number' ? filter.mode : 'equal'
          })
        } else if ('values' in filter && filter.values !== undefined) {
          builder = filter.modify({ builder, values: filter.values })
        } else if (filter.type === 'date' && ('from' in filter || 'to' in filter)) {
          builder = filter.modify({ builder, value: { from: filter.from, to: filter.to } })
        } else if (filter.type === 'number' && ('from' in filter || 'to' in filter)) {
          builder = filter.modify({ builder, value: { from: filter.from, to: filter.to }, mode: 'between' })
        }
      } else if(filter.type == 'string') {
        this.applyStringFilter({ builder, filter })
      } else if(filter.type == 'date') {
        this.applyDateFilter({ builder, filter })
      } else if(filter.type == 'number') {
        this.applyNumberFilter({ builder, filter })
      } else if(filter.type == 'select') {
        this.applySelectFilter({ builder, filter })
      } else if(filter.type == 'bool') {
        this.applyBooleanFilter({ builder, filter })
      }
    }

    return builder
  }

  private applyStringFilter(params: {
    builder: Builder,
    filter: StringFilter
  }): Builder {
    if(params.filter.value === undefined) return params.builder

    if(params.filter.mode == 'like') {
      params.builder.where(params.filter.column, 'like', params.filter.value)
    } else if (params.filter.mode == 'ilike') {
      params.builder.where(params.filter.column, 'ilike', params.filter.value)
    } else if (params.filter.mode == 'contains') {
      params.builder.where(params.filter.column, 'ilike', `%${params.filter.value}%`)
    } else {
      params.builder.where(params.filter.column, '=', params.filter.value)
    }

    return params.builder
  }

  private applyDateFilter(params: {
    builder: Builder,
    filter: DateFilter
  }): Builder {
    if (params.filter.mode == 'equal' && !!params.filter.value) {
      params.builder.where(params.filter.column, '=', params.filter.value)
    } else if (params.filter.mode == 'greater' && !!params.filter.value) {
      params.builder.where(params.filter.column, '>', params.filter.value)
    } else if (params.filter.mode == 'lower' && !!params.filter.value) {
      params.builder.where(params.filter.column, '<', params.filter.value)
    } else if (params.filter.mode == 'between') {
      if(!!params.filter.from) {
        params.builder.where(params.filter.column, '>=', params.filter.from)
      }
      if(!!params.filter.to) {
        params.builder.where(params.filter.column, '<=', params.filter.to)
      }
    }

    return params.builder
  }

  private applyNumberFilter(params: {
    builder: Builder,
    filter: NumberFilter
  }): Builder {
    if(params.filter.mode == 'equal' && params.filter.value !== undefined) {
      params.builder.where(params.filter.column, '=', params.filter.value)
    } else if(params.filter.mode == 'greater' && params.filter.value !== undefined) {
      params.builder.where(params.filter.column, '>', params.filter.value)
    } else if(params.filter.mode == 'lower' && params.filter.value !== undefined) {
      params.builder.where(params.filter.column, '<', params.filter.value)
    } else if(params.filter.mode == 'between') {
      if(params.filter.from !== undefined) {
        params.builder.where(params.filter.column, '>=', params.filter.from)
      }
      if(params.filter.to !== undefined) {
        params.builder.where(params.filter.column, '<=', params.filter.to)
      }
    }
    return params.builder
  }

  private applySelectFilter(params: {
    builder: Builder,
    filter: SelectFilter
  }): Builder {
    if(!!params.filter.values && params.filter.values.length > 0) {
      if(params.filter.mode == 'equal') {
        params.builder.where(b => {
          b.where(params.filter.column, '=', params.filter.values![0].value)
          for(let i = 1; i < params.filter.values!.length; i += 1) {
            b.orWhere(params.filter.column, '=', params.filter.values![i].value)
          }
        })
      } else {
        params.builder.where(b => {
          for(let i = 0; i < params.filter.values!.length; i += 1) {
            b.whereNot(params.filter.column, '=', params.filter.values![i].value)
          }
        })
      }
    }

    return params.builder
  }

  private applyBooleanFilter(params: {
    builder: Builder,
    filter: BoolFilter
  }): Builder {
    if(params.filter.value !== undefined) {
      params.builder.where(params.filter.column, '=', params.filter.value)
    }

    return params.builder
  }

}