<script lang="ts">
  import '../../../css/main.css'
  import './TimePicker.css'
  import { DateTime } from 'luxon';
  import Icon from '../media/Icon.svelte';

  interface Props {
    selectedTime?: Date | null | undefined;
    locale?: "it-IT" | "en-EN";
    class?: {
      container?: string,
      header?: string,
      selectorRow?: string
    }
  }

  let {
    selectedTime = $bindable(undefined),
    locale = 'it-IT',
    class: clazz = {}
  }: Props = $props();

  let hours = $state('00')
  let buildUpHours: string = '00'
  function handleHoursInput(e: KeyboardEvent) {
    setTimeout(() => {
      let inserted = e.key
  
      if(inserted == 'Backspace') {
        if(Number(buildUpHours) < 10) {
          buildUpHours = '00'
        } else {
          buildUpHours = '0' + (buildUpHours.at(0) || '0')
        }
      }
  
      if(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(inserted)) {
        if(Number(buildUpHours) < 10) {
          buildUpHours = `${Number(buildUpHours)}${inserted}`
        } else {
          buildUpHours = `${buildUpHours.at(1)}${inserted}`
        }
      }

      hours = buildUpHours
    }, 10);
  }
</script>

<div
  class="container {clazz.container || ''}"
>
  <div
    class="header {clazz.header || ''}"
  >
    <h2>
      {#if !!selectedTime}
        {DateTime.fromJSDate(selectedTime).setLocale(locale).toLocaleString(DateTime.TIME_24_SIMPLE)}
      {/if}
    </h2>
  </div>
  <div class="body">
    <div class="time-switch">
      <button 
        class="icon-button"
      >
        <Icon
          name="mdi-chevron-up"
          --icon-size="20pt"
        ></Icon>
      </button>
      <input
        type="text"
        class="transparent-input"
        bind:value={hours}
        onkeydown={handleHoursInput}
      />
      <button 
        class="icon-button"
      >
        <Icon
          name="mdi-chevron-down"
          --icon-size="20pt"
        ></Icon>
      </button>
    </div>
    <div>:</div>
    <input type="text" class="transparent-input" maxlength="2" />
  </div>
</div>

<style>
  .container {
    border-radius: 5px;
    height: var(
      --time-picker-height,
      var(--time-picker-default-height)
    );
    width: var(
      --time-picker-width,
      var(--time-picker-default-width)
    );
    box-shadow: var(
      --time-picker-box-shadow,
      var(--time-picker-default-box-shadow)
    );
    overflow: var(
      --time-picker-overflow,
      var(--time-picker-default-overflow)
    );
    display: flex;
    flex-direction: column;
  }

  .header {
    border-radius: 5px 5px 0 0;
    background-color: var(
      --time-picker-header-background-color,
      var(--time-picker-default-header-background-color)
    );
    height: calc(var(--time-picker-height, var(--time-picker-default-height)) / 4);
    color: var(
      --time-picker-header-color,
      var(--time-picker-default-header-color)
    );
  }

  .header > h2 {
    margin-left: 15px;
    margin-top: 5px;
    transition: 0.1s;
    opacity: 0.8;
  }
  .header > h2:hover {
    opacity: 1;
    cursor: pointer;
  }

  .body {
    flex-grow: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px
  }

  .transparent-input {
    border: 2px solid rgb(var(--global-color-contrast-200));
    border-radius: 5px;
    width: 36px;
    text-align: center;
    outline: none;
    background-color: transparent; 
    padding: 4px 8px;
    color: rgb(var(--global-color-contrast-900));
    transition: all .1s cubic-bezier(0.075, 0.82, 0.165, 1);
    font-size: 24pt;
    caret-color: transparent;
  }

  .transparent-input:hover, .transparent-input:focus {
    border-color: rgb(var(--global-color-primary-500));
  }

  .time-switch {
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
  }

  .icon-button {
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    outline: none;
    color: inherit;
  }

</style>
