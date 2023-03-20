import { BROWSER } from 'esm-env';

export type CallbackFunction = (detail: { key: string, ctrl: boolean, meta: boolean }) => void

class Keyboarder {
  private callbacks: CallbackFunction[] = []

  constructor() {
    if(BROWSER) {
      document.addEventListener('keydown', (event) => {
        this.emit({
          meta: event.metaKey,
          ctrl: event.ctrlKey,
          key: event.key
        })
      })
    }
  }

  public on(callback: CallbackFunction) {
    this.callbacks.push(callback)
  }

  public off(callback: CallbackFunction) {
    this.callbacks = this.callbacks.filter((cb) => cb !== callback)
  }

  private emit(params: {
    key: string,
    meta: boolean,
    ctrl: boolean
  }) {

    for(let i = 0; i < this.callbacks.length; i += 1) {
      this.callbacks[i]({
        key: params.key,
        ctrl: params.ctrl,
        meta: params.meta
      })
    }
  }
}

export default new Keyboarder()