<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import ActivableButton from "$lib/components/composed/buttons/ActivableButton.svelte";
  import Icon from "$lib/components/simple/media/Icon.svelte";

  let boldActive: boolean = false,
    italicActive: boolean = false,
    underlineActive: boolean = false
</script>

<h1>ActivableButton</h1>
<ComponentSubtitle>Activate the power now.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <div
    style:display="flex"
    style:gap="2px"
  >
    <ActivableButton
      bind:active={italicActive}
    >
      <Icon name="mdi-format-italic"></Icon>
    </ActivableButton>
    <ActivableButton
      bind:active={underlineActive}
    >
      <Icon name="mdi-format-underline"></Icon>
    </ActivableButton>
    <ActivableButton
      buttonProps={{
        disabled: true
      }}
      bind:active={boldActive}
    >
      <Icon name="mdi-format-bold"></Icon>
    </ActivableButton>
  </div>
  <div>
    Italic: {italicActive}<br/>
    Underline: {underlineActive}<br/>
    Bold: {boldActive}
  </div>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    // {
    //   name: 'type',
    //   type: '"button" | "submit"',
    //   description: "HTML type attribute",
    //   default: "button"
    // }
  ]}
  styleProps={[
    // {
    //   name: '--button-max-width',
    //   type: 'string',
    //   default: 'undefined',
    //   description: 'The max width of the outer element'
    // }
  ]}
></PropsViewer>
<h2>Slots</h2>
<h2>Events</h2>

<style>
  .example {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    margin-bottom: 20px;
  }
</style>