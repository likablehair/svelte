<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import DatePickerTextField from "$lib/components/composed/forms/DatePickerTextField.svelte";
  import { DateTime } from "luxon";

  let date: Date | undefined = new Date()

  setTimeout(() => {
    date = DateTime.fromJSDate(date || new Date()).plus({ year: 1 }).toJSDate()
  }, 2000);
</script>

<h1>DatePickerTextField</h1>
<ComponentSubtitle>If you want a date, you'll have a date.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <div
    style:display="flex"
    style:justify-content="center"
    style:flex-direction="column"
    style:align-items="center"
  >
    <div 
      style:margin-bottom="16px"
    >
      {date}
    </div>
    <div class="h-flex">
      <DatePickerTextField bind:selectedDate={date} />
      <DatePickerTextField bind:selectedDate={date} disabled />
    </div>
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

  .h-flex {
    display: flex;
    gap: 8px
  }
</style>
