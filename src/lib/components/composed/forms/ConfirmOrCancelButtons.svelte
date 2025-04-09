<script lang="ts">
  import type { ComponentProps, Snippet } from 'svelte';
  import '../../../css/main.css'
  import Button from '../../simple/buttons/Button.svelte'

  interface Props {
    loading?: boolean;
    marginTop?: string;
    cancelText?: string;
    confirmText?: string;
    confirmDisable?: boolean;
    cancelDisable?: boolean;
    onconfirmClick?: (event: {
      detail: {
        nativeEvent: MouseEvent
      }
    }) => void
    oncancelClick?: (event: {
      detail: {
        nativeEvent: MouseEvent | KeyboardEvent
      }
    }) => void
    cancelButtonSnippet?: Snippet<[{
      loading: boolean
      handleCancel: typeof handleCancel
      cancelText: string
    }]>
    confirmButtonSnippet?: Snippet<[{
      loading: boolean
      handleConfirm: typeof handleConfirm
      confirmText: string
      confirmDisable: boolean
    }]>
  }

  let {
    loading = false,
    marginTop = "20px",
    cancelText = "Annulla",
    confirmText = "Salva",
    confirmDisable = false,
    cancelDisable = false,
    oncancelClick,
    onconfirmClick,
    cancelButtonSnippet,
    confirmButtonSnippet,
  }: Props = $props();

  function handleConfirm(event: Parameters<NonNullable<ComponentProps<typeof Button>['onclick']>>[0]) {
    if(!confirmDisable && onconfirmClick) {
      onconfirmClick({
        detail: {
          nativeEvent: event.detail.nativeEvent
        }
      })
    }
  }

  function handleCancel(nativeEvent: MouseEvent | KeyboardEvent) {
    if(!cancelDisable && oncancelClick) {
      oncancelClick({
        detail: {
          nativeEvent
        }
      })
    }
  }
</script>

<div
  style:margin-top={marginTop}
  class="button-container"
>
  <div
    class="link-button-container"
  >
    <div></div>
    {#if cancelButtonSnippet}
      {@render cancelButtonSnippet({ loading, handleCancel, cancelText })}
    {:else}
      <button
        class="text-button"
        onclick={handleCancel}
      >{cancelText}</button>
    {/if}
  </div>
  {#if confirmButtonSnippet}
    {@render confirmButtonSnippet({ loading, handleConfirm, confirmDisable, confirmText })}
  {:else}
    <Button
      loading={loading}
      onclick={handleConfirm}
      disabled={confirmDisable}
    >{confirmText}</Button>
  {/if}
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
    border: none;
  }

  .text-button:hover {
    cursor: pointer;
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