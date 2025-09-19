<script lang="ts">
  import Button from "$lib/components/simple/buttons/Button.svelte";
  import Menu from "$lib/components/simple/common/Menu.svelte";
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";

  let menuOpened = false
  let activator
  let menuLabels = ['this', 'is', 'a', 'menu', '!']

  function handleButtonClick(e: MouseEvent) {
    e.stopPropagation()
    menuOpened = !menuOpened
  }

  let secondActivators: Record<string, HTMLElement> = {}
  let secondMenuOpened: Record<string, boolean> = {}
  let thirdActivators: Record<string, HTMLElement> = {}
  let thirdMenuOpened: Record<string, boolean> = {}

  menuLabels.forEach(label => {
    secondMenuOpened[label] = false
    thirdMenuOpened[label] = false
  })

  function handleListClick(menuLabel: string) {
    setTimeout(() => {
      secondMenuOpened[menuLabel] = true
      thirdMenuOpened[menuLabel] = false
    }, 10);
  }

  function handleSubMenuClick(menuLabel: string) {
    setTimeout(() => {
      thirdMenuOpened[menuLabel] = true
    }, 10);
  }
</script>
<h1>Menu</h1>
<ComponentSubtitle>Custom elements that appear on the screen wherever you want them to be positioned.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <div style:width="fit-content" bind:this={activator}>
    <Button
      onclick={(e) => handleButtonClick(e.detail.nativeEvent)}
    >
      Click me
    </Button>
  </div>
</div>

<Menu
  _width="250px"
  activator={activator}
  bind:open={menuOpened}
  anchor="bottom-center"
  _borderRadius="10px"
  _boxShadow="rgba(149, 157, 165, 0.2) 0px 8px 24px"
  closeOnClickOutside
  stayInViewport
>
  <div class="menu-content">
    <div class="list-container">
      <ul>
        {#each menuLabels as menuLabel}
          <li
            bind:this={secondActivators[menuLabel]} 
            onclick={() => handleListClick(menuLabel)}
            onkeypress={() => handleListClick(menuLabel)}
            role="presentation"
          >{menuLabel}</li>
        {/each}
      </ul>
    </div>
  </div>
</Menu>

{#each menuLabels as menuLabel}
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
      style:height="100px"
      bind:this={thirdActivators[menuLabel]}
      onclick={() => handleSubMenuClick(menuLabel)}
      onkeypress={() => handleSubMenuClick(menuLabel)}
      role="presentation"
    >
      {menuLabel}
    </div>
  </Menu>
{/each}

{#each menuLabels as menuLabel}
  <Menu
    _width="140px"
    activator={thirdActivators[menuLabel]}
    bind:open={thirdMenuOpened[menuLabel]}
    anchor="bottom-center"
    _borderRadius="10px"
    _boxShadow="rgba(149, 157, 165, 0.2) 0px 8px 24px"
    closeOnClickOutside
    openingId="third-menu"
    flipOnOverflow
  >
    <div style:height="100px">
      {menuLabel}
    </div>
  </Menu>
{/each}

<h2>Props</h2>
<PropsViewer
  props={[
    { name: '_top', type: 'number', description: 'Top position of the menu', default: 'undefined' },
    { name: '_left', type: 'number', description: 'Left position of the menu', default: 'undefined' },
    { name: '_width', type: 'string', description: 'Width of the menu', default: '"auto"' },
    { name: '_height', type: 'string', description: 'Height of the menu', default: '"auto"' },
    { name: '_maxHeight', type: 'string', description: 'Maximum height of the menu', default: 'undefined' },
    { name: '_minWidth', type: 'string', description: 'Minimum width of the menu', default: 'undefined' },
    { name: '_overflow', type: 'string', description: 'Overflow behavior of the menu', default: '"auto"' },
    { name: '_boxShadow', type: 'string', description: 'Box shadow styling for the menu', default: 'undefined' },
    { name: '_borderRadius', type: 'string', description: 'Border radius of the menu', default: 'undefined' },
    { name: '_activatorGap', type: 'number', description: 'Gap between the activator and menu', default: '5' },
    { name: 'open', type: 'boolean', description: 'Controls the visibility of the menu', default: 'false' },
    { name: 'refreshPosition', type: 'boolean', description: 'Triggers recalculation of menu position', default: 'false' },
    { name: 'activator', type: 'HTMLElement', description: 'Element that triggers the menu', default: 'undefined' },
    { name: 'anchor', type: '"bottom" | "bottom-center" | "right" | "right-center" | "up" | "up-center" | "left" | "left-center"', description: 'Defines the menu alignment', default: '"bottom"' },
    { name: 'closeOnClickOutside', type: 'boolean', description: 'Closes the menu when clicking outside', default: 'false' },
    { name: 'inAnimation', type: '(node: Element, params?: SlideParams | FlyParams | FadeParams) => TransitionConfig', description: 'Animation for menu entrance', default: 'fly' },
    { name: 'inAnimationConfig', type: 'SlideParams | FlyParams | FadeParams', description: 'Configuration for inAnimation', default: '{ duration: 100, y: 10 }' },
    { name: 'outAnimation', type: '(node: Element, params?: SlideParams | FlyParams | FadeParams) => TransitionConfig', description: 'Animation for menu exit', default: 'fly' },
    { name: 'outAnimationConfig', type: 'SlideParams | FlyParams | FadeParams', description: 'Configuration for outAnimation', default: '{ duration: 100, y: 10 }' },
    { name: 'menuElement', type: 'HTMLElement', description: 'Reference to the menu element', default: 'undefined' },
    { name: 'flipOnOverflow', type: 'boolean', description: 'Flips the menu if it overflows viewport', default: 'false' },
    { name: 'stayInViewport', type: 'boolean', description: 'Keeps the menu within the viewport', default: 'false' },
    { name: 'openingId', type: 'string', description: 'Unique identifier for the menu instance', default: 'undefined' }
  ]}
  styleProps={[]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
    slots={[
      {
        description: 'Content of the menu',
        name: 'Children',
      }
    ]}
></SlotsViewer>

<style>
  .example {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    flex-direction: column;
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