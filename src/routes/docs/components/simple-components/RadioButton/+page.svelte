<script lang="ts">
    import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
    import PropsViewer from "../../PropsViewer.svelte";
    
    import RadioButton from "$lib/components/simple/forms/RadioButton.svelte";
    import EventsViewer from "../../EventsViewer.svelte";
</script>

<h1>Radio Button</h1>
<ComponentSubtitle>Tune in and choose you favorite station with our radio buttons.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <RadioButton name='radio' value='Pippo' label='Pippo' disabled checked/>
  <RadioButton name='radio' value='Pluto' label='Pippo'/>
  <RadioButton name='radio' value='PippoPluto' label='Pippo Pluto'/>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    {
      name: 'name',
      type: 'string',
      description: "Name of the group of radio buttons",
      default: "no default value"
    },
    {
      name: 'value',
      type: 'string',
      description: "Value of the radio button",
      default: "no default value"
    },
    {
      name: 'id',
      type: 'string | undefined',
      description: "Id of the radio button",
      default: "undefined"
    },
    {
      name: 'checked',
      type: 'boolean',
      description: "When checked the button is automatically checked",
      default: "false"
    },
    {
      name: 'disabled',
      type: 'boolean',
      description: "When disabled the button cannot be pressed",
      default: "false"
    },
    {
      name: 'label',
      type: 'string | undefined',
      description: "Label for the radio button",
      default: "undefined"
    }
  ]}
  styleProps={[
    {
      name: '--radio-button-active-color',
      type: 'string',
      default: 'rgb(var(--global-color-primary-500))',
      description: 'css color of an active radio button'
    },
    {
      name: '--radio-button-active-inner-color',
      type: 'string',
      default: 'rgb(var(--global-color-grey-50))',
      description: 'css inner color of an active radio button'
    },
    {
      name: '--radio-button-focus-shadow',
      type: 'string',
      default: '2px rgb(var(--global-color-primary-500), .3)',
      description: 'css width and color of the shadow box of a focused radio button'
    },
    {
      name: '--radio-button-border-color',
      type: 'string',
      default: 'rgb(var(--global-color-contrast-300), .2)',
      description: 'css color of the border of a radio button'
    },
    {
      name: '--radio-button-border-hover-color',
      type: 'string',
      default: 'rgb(var(--global-color-primary-500))',
      description: 'css color of the border of an hovered radio button'
    },
    {
      name: '--radio-button-background-color',
      type: 'string',
      default: 'rgb(var(--global-color-background-200))',
      description: 'css color of the background of a radio button'
    },
    {
      name: '--radio-button-disabled-color',
      type: 'string',
      default: 'rgb(var(--global-color-background-200), .5)',
      description: 'css color of the background of a disabled radio button'
    },
    {
      name: '--radio-button-disabled-active-color',
      type: 'string',
      default: 'rgb(var(--global-color-primary-400))',
      description: 'css color of a disabled active radio button'
    }
  ]}
></PropsViewer>
<h2>Slots</h2>
<h2>Events</h2>
<EventsViewer
      events={
        [
            {
            name: 'change',
            description: 'Native event',
          }, {
            name: 'input',
            description: 'Native event'
          }, {
            name: 'focus',
            description: 'Native event'
          }, {
            name: 'blur',
            description: 'Native event'
          }, {
            name: 'keydown',
            description: 'Native event'
          }, {
            name: 'keypress',
            description: 'Native event'
          }, {
            name: 'keyup',
            description: 'Native event'
          }
        ]
      }
></EventsViewer>

<style>
    .example {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-bottom: 20px;
    }
  </style>