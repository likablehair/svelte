import Builder from "./builder"

export const StringModes = ['equal', 'like', 'ilike'] as const
export type StringMode = typeof StringModes[number]

export const DateModes = ['equal', 'greater', 'lower', 'between'] as const
export type DateMode = typeof DateModes[number]

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

export type Filter = {
  name: string,
  active?: boolean,
  hidden?: boolean,
  label: string,
  advanced?: boolean
} & (StringFilter | MultiStringFilter | ChoiceFilter | DateFilter)


export default class Converter {
  constructor() {

  }

  public createBuilder(params: {
    filters: Filter[]
  }): Builder {
    let builder = new Builder()

    for(let i = 0; i < params.filters.length; i += 1) {
      const filter = params.filters[i]

      if(filter.type == 'string') {
        this.applyStringFilter({ builder, filter })
      } else if(filter.type == 'date') {
        this.applyDateFilter({ builder, filter })
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
}