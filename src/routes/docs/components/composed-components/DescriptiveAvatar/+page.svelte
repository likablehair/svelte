<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  
  import DescriptiveAvatar from "$lib/components/simple/media/DescriptiveAvatar.svelte";
</script>

<h1>Descriptive Avatar</h1>
<ComponentSubtitle>Circle Image with description.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <DescriptiveAvatar
    src="/avatars/avatar1.jpeg"
    title="Nome cognome"
    subtitle="ruolo"
  ></DescriptiveAvatar>
  <DescriptiveAvatar
    src="/avatars/avatar1.jpeg"
    title="Nome cognome"
    subtitle="ruolo"
    direction="column"
  ></DescriptiveAvatar>
  <DescriptiveAvatar
    src="/no/image.jpeg"
    title="Nome cognome"
    subtitle="ruolo"
    reverse
  ></DescriptiveAvatar>
  <DescriptiveAvatar
    title="Nome cognome"
    subtitle="ruolo"
    direction="column"
    reverse
  ></DescriptiveAvatar>
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
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 24px;
    margin-bottom: 20px;
  }
</style>