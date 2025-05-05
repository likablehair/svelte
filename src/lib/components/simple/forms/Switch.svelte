<script lang="ts">
	import './Switch.css'

	interface Props {
		value?: boolean;
		disabled?: boolean;
		onchange?: (event: {
      detail: {
        nativeEvent: Event & {
          currentTarget: EventTarget & HTMLInputElement;
        },
        value: boolean
      }
    }) => void
	}

	let {
		value = $bindable(),
		disabled = false,
		onchange: onchangeInternal,
	}: Props = $props();

  function onchange(event: Event & {
    currentTarget: EventTarget & HTMLInputElement;
  }) {
    if(onchangeInternal) {
      onchangeInternal({
        detail: {
          nativeEvent: event,
          value: event.currentTarget.checked
        }
      })
    }
  }
</script>

<label class="toggle-switch" class:disabled>
  <input type="checkbox" bind:checked={value} {disabled} {onchange}>
  <div class="toggle-switch-background">
    <div class="toggle-switch-handle"></div>
  </div>
</label>

<style>
.toggle-switch {
  position: relative;
  display: inline-block;
  width: var(--switch-width, var(--switch-default-width));
  height: var(--switch-height, var(--switch-default-height));
  cursor: pointer;
}

.toggle-switch.disabled {
	cursor: not-allowed;
}

.toggle-switch input[type="checkbox"] {
  display: none;
}

.toggle-switch-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--switch-inactive-background-color, var(--switch-default-inactive-background-color));
  border-radius: 20px;
  box-shadow: var(--switch-inactive-box-shadow, var(--switch-default-inactive-box-shadow));
  transition: background-color 0.3s ease-in-out;
}

.toggle-switch-handle {
  position: absolute;
  top: 3px;
  left: 3px;
  width: var(--switch-handle-width, var(--switch-default-handle-width));
  height: var(--switch-handle-width, var(--switch-default-handle-width));
  background-color: var(--switch-handle-color, var(--switch-default-handle-color));
  border-radius: 50%;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.4);
  transition: transform 0.3s ease-in-out;
}

.toggle-switch input[type="checkbox"]:disabled + .toggle-switch-background {
  background-color: var(--switch-disabled-inactive-background-color, var(--switch-default-disabled-inactive-background-color));
  box-shadow: var(--switch-disabled-inactive-box-shadow, var(--switch-default-disabled-inactive-box-shadow));
}

.toggle-switch input[type="checkbox"]:disabled + .toggle-switch-background .toggle-switch-handle {
  background-color: var(--switch-disabled-inactive-handle-color, var(--switch-default-disabled-inactive-handle-color));
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.4);
}

.toggle-switch input[type="checkbox"]:checked + .toggle-switch-background {
  background-color: var(--switch-active-background-color, var(--switch-default-active-background-color));
  box-shadow: var(--switch-active-box-shadow, var(--switch-default-active-box-shadow));
}

.toggle-switch input[type="checkbox"]:checked + .toggle-switch-background .toggle-switch-handle {
  transform: translateX(var(--switch-translate-x, var(--switch-default-translate-x)));
}

.toggle-switch input[type="checkbox"]:disabled:checked + .toggle-switch-background {
  background-color: var(--switch-disabled-active-background-color, var(--switch-default-disabled-active-background-color));
  box-shadow: var(--switch-disabled-active-box-shadow, var(--switch-default-disabled-active-box-shadow));
}

.toggle-switch input[type="checkbox"]:disabled:checked + .toggle-switch-background .toggle-switch-handle {
  background-color: var(--switch-disabled-active-handle-color, var(--switch-default-disabled-active-handle-color));
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.4);
}
</style>
