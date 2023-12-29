<script lang="ts">
  import Button from "$lib/components/simple/buttons/Button.svelte";
  import Card from "$lib/components/simple/common/Card.svelte";
  import Dialog from "$lib/components/simple/dialogs/Dialog.svelte";
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import colors from "../../../stores/colors"
  import EventsViewer from "../../EventsViewer.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";
  import Menu from "$lib/components/simple/common/Menu.svelte";
  import DatePickerTextField from "$lib/components/composed/forms/DatePickerTextField.svelte";

  let dialogOpened = false

  let menuOpened = false
  let activator: HTMLElement

  function handleButtonClick(e: CustomEvent) {
    e.detail.nativeEvent.stopPropagation()
    menuOpened = !menuOpened
  }

  let secondActivators: Record<string, HTMLElement> = {}
  let secondMenuOpened: Record<string, boolean> = {}

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
    on:click={() => { dialogOpened = !dialogOpened }}
  >
    Click me
  </Button>
</div>

<Dialog
  bind:open={dialogOpened}
  transition="scale"
>
  <div>
    <Card
      padding="30px"
      width="350px"
    >
      <div class="card-header" slot="header" style:--example-card-header-color={$colors.primary}>Peace</div>
      <div class="card-body">
        <span>"Peace begins with a smile"</span>
        <DatePickerTextField></DatePickerTextField>
        <div style:width="fit-content" bind:this={activator}>
          <Button
            backgroundColor={$colors.primary}
            color={$colors.background}
            hoverBackgroundColor={$colors.secondary}
            width="200px"
            maxWidth="90vw"
            on:click={(e) => handleButtonClick(e)}
          >
            Click me
          </Button>
        </div>
      </div>
      <div class="card-footer" slot="footer">
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
                  bind:this={secondActivators[menuLabel]} 
                  on:click={() => handleListClick(menuLabel)}
                  on:keypress={() => handleListClick(menuLabel)}
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
            style:height="100px"
            bind:this={thirdActivators[menuLabel]}
            on:click={() => handleSubMenuClick(menuLabel)}
            on:keypress={() => handleSubMenuClick(menuLabel)}
          >
            {menuLabel}
          </div>
        </Menu>
      {/each}
    </Card>
  </div>
</Dialog>
<h2>Props</h2>
<PropsViewer
  props={[
    {
      name: "open",
      type: "boolean",
      description: "Define whether the dialog is opened or not",
      default: "false"
    }, {
      name: "transition",
      type: "'fly-down' | 'fly-up' | 'fly-horizontal' | 'scale' | 'fade'",
      default: "'fly-up'",
      description: "Type of transition used by the dialog to show up"
    }
  ]}
  styleProps={[
    {
      name: "_overlayOpacity",
      type: "string",
      default: "30%",
      description: "Opacity of the background"
    }, {
      name: "_overlayColor",
      type: "string",
      default: "#282828",
      description: "Color of the background"
    }, {
      name: "_overlayBackdropFilter",
      type: "string",
      default: "undefined",
      description: "backdrop-filter css property"
    }, {
      name: "_transitionTimingFunction",
      type: "string",
      default: "cubic-bezier(0.075, 0.82, 0.165, 1)",
      description: "transition-timing-function css property"
    }, {
      name: "_transitionDuration",
      type: "string",
      default: "0.5s",
      description: "transition-duration css property"
    }
  ]}
></PropsViewer>
<h2>Slots</h2>
<SlotsViewer
    slots={[
      {
        name: 'top-right',
        description: 'Space in the top-right conrner'
      }, {
        name: 'center-left',
        description: 'Space vertically centered on the left'
      }, {
        name: 'center-left',
        description: 'Space vertically centered on the right'
      }, {
        name: 'default',
        description: 'Space vertically and horizontally centered'
      }
    ]}
></SlotsViewer>
<h2>Events</h2>
<EventsViewer
      events={[
        {
          name: 'click',
          description: 'Native event triggered by the content of the Dialog'
        }, {
          name: 'keypress',
          description: 'Native event triggered by the content of the Dialog'
        }
      ]}
></EventsViewer>

<style>
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