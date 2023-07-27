<script lang="ts">
  import '../../../css/main.css'
  import { createEventDispatcher } from "svelte";

  export let loading: boolean = false,
    marginTop: string = "20px",
    cancelText: string = "Annulla",
    confirmText: string = "Salva",
    confirmDisable: boolean = false,
    cancelDisable: boolean = false

  let dispatch = createEventDispatcher<{
    "confirm-click": {
      nativeEvent: MouseEvent
    },
    "cancel-click": {
      nativeEvent: MouseEvent | KeyboardEvent
    },
  }>()

  function handleConfirm(event: any) {
    if(!confirmDisable) {
      dispatch('confirm-click', {
        nativeEvent: event.detail.nativeEvent
      })
    }
  }

  function handleCancel(nativeEvent: MouseEvent | KeyboardEvent) {
    if(!cancelDisable) {
      dispatch('cancel-click', {
        nativeEvent
      })
    }
  }

  import Button from '../../simple/buttons/Button.svelte'
</script>

<div
  style:margin-top={marginTop}
  class="button-container"
>
  <div
    class="link-button-container"
  >
    <div></div>
    <slot name="cancel-button" {loading} {handleCancel} {cancelText}>
      <button
        class="text-button"
        on:click={handleCancel}
      >{cancelText}</button>
    </slot>
  </div>
  <slot name="confirm-button" {loading} {handleConfirm} {confirmDisable} {confirmText}>
    <Button
      loading={loading}
      on:click={handleConfirm}
      disabled={confirmDisable}
    >{confirmText}</Button>
  </slot>
</div>


<style>
  @media (max-width: 768px){
  	.button-container {
      flex-direction: column-reverse;
    }
  }

  @media (min-width: 769px){
    .button-container {
      justify-content: end;
      align-items: center;
      gap: 15px;
    }
  }

  .text-button {
    font-family: inherit;
    font-size: 100%;
    font-weight: inherit;
    line-height: inherit;
    color: inherit;
    margin: 0;
    padding: 0;
    background-color: transparent;
    background-image: none;
  }

  .button-container {
    display: flex;
  }

  .link-button-container {
    height: 45px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>