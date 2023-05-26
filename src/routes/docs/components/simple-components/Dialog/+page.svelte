<script lang="ts">
  import Button from "$lib/components/simple/buttons/Button.svelte";
  import Card from "$lib/components/simple/common/Card.svelte";
  import Dialog from "$lib/components/simple/dialogs/Dialog.svelte";
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import colors from "../../../stores/colors"
  import EventsViewer from "../../EventsViewer.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import SlotsViewer from "../../SlotsViewer.svelte";

  let dialogOpened = false
</script>

<h1>Dialog</h1>
<ComponentSubtitle>A dialog for peace.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <Button
    backgroundColor={$colors.primary}
    color={$colors.background}
    hoverBackgroundColor={$colors.secondary}
    width="200px"
    maxWidth="90vw"
    on:click={() => { dialogOpened = !dialogOpened }}
  >
    Click me
  </Button>
</div>
<Dialog
  bind:open={dialogOpened}
>
  <div>
    <Card
      padding="30px"
      width="260px"
    >
      <div class="card-header" slot="header" style:--example-card-header-color={$colors.primary}>Peace</div>
      <div class="card-body">
        <span>"Peace begins with a smile"</span>
      </div>
      <div class="card-footer" slot="footer">
        <span>Mother Teresa</span>
      </div>
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
    color: var(--example-card-header-color);
  }

  .card-body {
    margin-bottom: 15px;
    font-size: 1.2rem;
    font-style: italic;
  }

  .card-footer {
    display: flex;
    flex-direction: row-reverse;
  }
</style>