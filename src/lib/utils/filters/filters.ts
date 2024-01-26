import Builder from "./builder"

export const StringModes = ['equal', 'like', 'ilike', 'contains'] as const
export type StringMode = typeof StringModes[number]

export const GenericModes = ['equal', 'greater', 'lower', 'between'] as const
export type DateMode = typeof GenericModes[number]

export type NumberMode = typeof GenericModes[number]

export const SelectModes = ['equal', 'different'] as const
export type SelectMode = typeof SelectModes[number]

type MultiStringFilter = {
  type: 'multiString',
  columns: string[],
  operator?: 'or' | 'and',
  value?: string
}


type ChoiceFilter = {
  type: 'choice',
  column: string,
  value?: string,
  operator?: 'or' | 'and'
  options: any[]
}

type StringFilter = {
  type: 'string',
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
    from?: Date,
    to?: Date
  } | {
    mode: 'equal' | 'greater' | 'lower',
    value?: Date,
  }
)

type NumberFilter = {
  type: 'number',
  column: string
} & (
  {
    mode: 'between',
    from?: number,
    to?: number
  } | {
    mode: 'equal' | 'greater' | 'lower',
    value?: number,
  }
)

type SelectFilter = {
  type: 'select',
  column: string,
  mode: SelectMode,
  items: { value: string | number, label: string }[]
  values?: { value: string | number, label?: string | number }[]
}

type BoolFilter = {
  type: 'bool',
  column: string,
  mode: 'equal',
  value?: boolean
  advanced?: false
  description: string
}

type CustomFilter = {
  type: 'custom',
  modify: (params: {
    filter: Omit<Filter, 'modifier'>,
    builder: Builder,
    value: any
  }) => Builder,
  data?: any
}

export type Filter = {
  name: string,
  active?: boolean,
  hidden?: boolean,
  label: string,
  advanced?: boolean,
} & (StringFilter | MultiStringFilter | ChoiceFilter | DateFilter | NumberFilter | SelectFilter | BoolFilter | CustomFilter)


export default class Converter {
  constructor() {

  }

  public createBuilder(params: {
    filters: Filter[],
    customFiltersValues?: {[filterName: string]: any}
  }): Builder {
    let builder = new Builder()

    for(let i = 0; i < params.filters.length; i += 1) {
      const filter = params.filters[i]

      if(!filter.active) continue

      if (filter.type == 'custom' && !!filter.modify && !!params.customFiltersValues && params.customFiltersValues[filter.name] !== undefined) {
        builder = filter.modify({ filter, builder, value: params.customFiltersValues[filter.name] })
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
    } else if (params.filter.mode == 'between' && !!params.filter.from && !!params.filter.to) {
      params.builder.where(params.filter.column, '>', params.filter.from)
      params.builder.where(params.filter.column, '<', params.filter.to)
    }

    return params.builder
  }

  private applyNumberFilter(params: {
    builder: Builder,
    filter: NumberFilter
  }): Builder {
    if(params.filter.mode == 'equal' && !!params.filter.value) {
      params.builder.where(params.filter.column, '=', params.filter.value)
    } else if(params.filter.mode == 'greater' && !!params.filter.value) {
      params.builder.where(params.filter.column, '>', params.filter.value)
    } else if(params.filter.mode == 'lower' && !!params.filter.value) {
      params.builder.where(params.filter.column, '<', params.filter.value)
    } else if(params.filter.mode == 'between' && !!params.filter.from && !!params.filter.to) {
      params.builder.where(params.filter.column, '>', params.filter.from)
      params.builder.where(params.filter.column, '<', params.filter.to)
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