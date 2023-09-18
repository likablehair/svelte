import type { Filter } from "./filters";

export default class Validator {
  static isValid(filter?: Filter): boolean {
    if(!filter) return false
    else if(filter.type == 'string') return !!filter.value
    else if(filter.type == 'date') {
      if(filter.mode == 'between') return !!filter.from && !!filter.to
      else return !!filter.value
    } else if(filter.type == 'multiString') return !!filter.value
    else if(filter.type == 'number') {
      if(filter.mode == 'between') return filter.from != undefined && filter.to != undefined
      else return filter.value != undefined
    }
    else return false
  }
}