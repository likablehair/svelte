<script lang="ts">
  import Button from "$lib/components/simple/buttons/Button.svelte";
  import Dialog from "$lib/components/simple/dialogs/Dialog.svelte";
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import EventsViewer from "../../EventsViewer.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
  import Menu from "$lib/components/simple/common/Menu.svelte";
  import DatePickerTextField from "$lib/components/composed/forms/DatePickerTextField.svelte";
  import type { ComponentProps } from "svelte";

  let dialogOpened = false

  let menuOpened = false
  let activator: HTMLElement

  function handleButtonClick(e: Parameters<NonNullable<ComponentProps<typeof Button>['onclick']>>[0]) {
    e.detail.nativeEvent.stopPropagation()
    menuOpened = !menuOpened
  }

  let secondActivators: Record<string, HTMLElement> = {}
  let secondMenuOpened: Record<string, boolean> = {
    'this': false,
    'is': false,
    'a': false,
    'menu': false,
    '!': false,
  }

  function handleListClick(menuLabel: string) {
    secondMenuOpened[menuLabel] = true
    thirdMenuOpened = {}
  }

  let thirdActivators: Record<string, HTMLElement> = {}
  let thirdMenuOpened: Record<string, boolean> = {}

  function handleSubMenuClick(menuLabel: string) {
    thirdMenuOpened[menuLabel] = true
  }
</script>

<h1>Dialog</h1>
<ComponentSubtitle>A dialog for peace.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <Button
    onclick={() => { dialogOpened = !dialogOpened }}
  >
    Click me
  </Button>
</div>

<Dialog
  bind:open={dialogOpened}
  transition="scale"
>
  <div class="card">
    <div class="card-header">Peace</div>
    <div class="card-body">
      <span>"Peace begins with a smile"</span>
      <DatePickerTextField></DatePickerTextField>
      <div style:width="fit-content" bind:this={activator}>
        <Button
          onclick={(e) => handleButtonClick(e)}
        >
          Click me
        </Button>
      </div>
    </div>
    <div class="card-footer">
      <span>Mother Teresa</span>
    </div>

    <Menu
      _width="160px"
      activator={activator}
      bind:open={menuOpened}
      anchor="bottom-center"
      _borderRadius="10px"
      _boxShadow="rgba(149, 157, 165, 0.2) 0px 8px 24px"
      closeOnClickOutside
    >
      <div class="menu-content">
        <div class="list-container">
          <ul>
            {#each ['this', 'is', 'a', 'menu', '!'] as menuLabel}
              <li
                role="presentation"
                bind:this={secondActivators[menuLabel]} 
                onclick={() => handleListClick(menuLabel)}
                onkeypress={() => handleListClick(menuLabel)}
              >{menuLabel}</li>
            {/each}
          </ul>
        </div>
      </div>
    </Menu>

    {#each ['this', 'is', 'a', 'menu', '!'] as menuLabel}
      <Menu
        _width="160px"
        activator={secondActivators[menuLabel]}
        bind:open={secondMenuOpened[menuLabel]}
        anchor="right-center"
        _borderRadius="10px"
        _boxShadow="rgba(149, 157, 165, 0.2) 0px 8px 24px"
        closeOnClickOutside
        openingId="second-menu"
        flipOnOverflow
      >
        <div 
          role="presentation"
          style:height="100px"
          bind:this={thirdActivators[menuLabel]}
          onclick={() => handleSubMenuClick(menuLabel)}
          onkeypress={() => handleSubMenuClick(menuLabel)}
        >
          {menuLabel}
        </div>
      </Menu>
    {/each}
  </div>
</Dialog>
<h2>Props</h2>
<PropsViewer
  props={[
    { name: 'open', type: 'boolean', description: 'Controls the visibility of the dialog.', default: 'false' }, 
    { name: 'transition', type: "fly-down | fly-up | fly-horizontal | scale | fade", description: 'Defines the transition effect when opening/closing the dialog.', default: "'fly-up'" }, 
    { name: '_overlayOpacity', type: 'string', description: 'The opacity of the overlay.', default: '"30%"' }, 
    { name: '_overlayColor', type: 'string', description: 'The background color of the overlay.', default: '"#282828"' }, 
    { name: '_overlayBackdropFilter', type: 'string', description: 'CSS filter applied to the backdrop of the overlay.', default: 'undefined' }, 
    { name: '_transitionTimingFunction', type: 'string', description: 'The timing function for the transition.', default: '"cubic-bezier(0.075, 0.82, 0.165, 1)"' }, 
    { name: '_transitionDuration', type: 'string', description: 'The duration of the transition.', default: '"0.5s"' }
  ]}
  styleProps={[
    { name: '--dialog-overlay-opacity', type: 'opacity', description: 'Opacity of the overlay.', default: '30%' },
    { name: '--dialog-transition-timing-function', type: 'timing-function', description: 'Timing function for the dialog transition.', default: '"cubic-bezier(0.075, 0.82, 0.165, 1)"' },
    { name: '--dialog-transition-duration', type: 'duration', description: 'Duration of the dialog transition.', default: '"0.5s"' },
    { name: '--dialog-z-index', type: 'z-index', description: 'Z-index of the dialog.', default: '50' }
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
  slots={[
    { name: 'topRightSnippet', description: 'Custom content rendered in the top-right area of the dialog.' },
    { name: 'centerLeftSnippet', description: 'Custom content rendered in the center-left area of the dialog.' },
    { name: 'centerRightSnippet', description: 'Custom content rendered in the center-right area of the dialog.' },
    { name: 'children', description: 'Custom content rendered within the dialog.' }
  ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
  events={[
  ]}
></EventsViewer>

<style>
  .card {
    background-color: rgb(var(--global-color-background-200));
    padding: 16px;
    border-radius: 4px;
  }

  .example {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .card-header {
    font-size: 1.8rem;
    margin-bottom: 25px;
    font-weight: 600;
    /* color: var(--example-card-header-color); */
  }

  .card-body {
    margin-bottom: 15px;
  }

  .card-footer {
    display: flex;
    flex-direction: row-reverse;
  }

  ul {
    list-style: none;
    padding: 0;
  }

  li {
    padding: 5px 0px 5px 0px;
    display: flex;
    justify-content: center;
  }

  li:nth-child(even) {
    background-color: rgb(var(--global-color-background-300));
  }

  .menu-content {
    background-color: transparent;
  }
</style>