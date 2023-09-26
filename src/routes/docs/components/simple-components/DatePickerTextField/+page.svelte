<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import DatePickerTextField from "$lib/components/simple/dates/DatePickerTextField.svelte";

  let date: Date | undefined = undefined

  setTimeout(() => {
    date = new Date('2024-01-02')
    console.log(date)
  }, 2000);
</script>

<h1>DatePickerTextField</h1>
<ComponentSubtitle>If you want a date, you'll have a date.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <DatePickerTextField bind:selectedDate={date} />
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
    // },
  ]}
/>
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
