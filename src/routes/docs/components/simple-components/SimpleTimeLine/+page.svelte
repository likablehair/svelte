<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  
  import SimpleTimeLine from "$lib/components/simple/timeline/SimpleTimeLine.svelte";
</script>

<h1>SimpleTimeLine</h1>
<ComponentSubtitle>Always simple timeline</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <SimpleTimeLine
    items={[
      { name: 'firstEvent', title: 'firstEvent', description: 'firstEvent', from: new Date(), to: new Date() },
      { name: 'secondEvent', title: 'secondEvent', description: 'secondEvent' },
      { name: 'thirdEvent', title: 'thirdEvent', description: 'thirdEvent' },
      { name: 'forthEvent', title: 'forthEvent', description: 'forthEvent' },
      { name: 'fifthEvent', title: 'fifthEvent', description: 'fifthEvent' }
    ]}
  ></SimpleTimeLine>
</div>
<div class="example">
  <SimpleTimeLine
    items={[
      { name: 'firstEvent', title: 'firstEvent', description: 'firstEvent' },
      { name: 'secondEvent', title: 'secondEvent', description: 'secondEvent' },
      { name: 'thirdEvent', title: 'thirdEvent', description: 'thirdEvent' },
      { name: 'forthEvent', title: 'forthEvent', description: 'forthEvent' },
      { name: 'fifthEvent', title: 'fifthEvent', description: 'fifthEvent' }
    ]}
    singleSided
  ></SimpleTimeLine>
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
    gap: 10px;
    margin-bottom: 20px;
  }
</style>