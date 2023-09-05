import Builder from "./builder"

type MultiStringFilter = {
  type: 'multiString',
  columns: string[],
  operator?: 'or' | 'and'
}

type StringFilter = {
  type: 'string',
  column: string,
  value?: string,
  mode?: 'equal' | 'like' | 'ilike'
}

export type Filter = {
  name: string,
  active: boolean,
  hidden?: boolean,
  label: string
} & (StringFilter | MultiStringFilter)


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
}