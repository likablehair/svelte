<script lang="ts">
  import Textfield from "$lib/forms/Textfield.svelte";
  import Switch from "$lib/forms/Switch.svelte";

  export let hourFormat: "12" | "24" = "24",
    dayPeriod: "am" | "pm" = "am",
    time: Date = undefined,
    text: string = "",
    fieldSeparator: string = ":",
    placeholder: string = "Insert time...",
    focusedBoxShadow: string = "#C0D6FF 0px 2px 10px",
    borderColor: string = "",
    borderWeight: string = "1px",
    fontSize: string = "14px",
    width: string = "100%";

  let minutes: number = undefined,
    hours: number = undefined,
    switchValue: boolean = false;

  function checkHour(hour: number): boolean {
    if (hourFormat == "12") return hour > 0 && hour <= 12;
    else return hour >= 0 && hour < 24;
  }

  function checkMinute(minute: number): boolean {
    return minute >= 0 && minute < 60;
  }

  $: dayPeriod = switchValue ? "pm" : "am";
  $: {
    let fields = text.split(fieldSeparator);
    hours = +fields[0];
    minutes = +fields[1];

    if (fields[1]?.length != 2) {
      time = undefined
    }
    else {
      if (!isNaN(hours) && !isNaN(minutes) && checkHour(hours) && checkMinute(minutes) && fields.length == 2) {
        if (hourFormat == '12') {
          if (dayPeriod == 'am' && hours == 12)
            hours = 0
          else if (dayPeriod == 'pm' && hours != 12)
            hours += 12
        }

        time = new Date(new Date().setHours(hours, minutes, 0));
      }
      else time = undefined;
    }
  }

</script>

<div class="container" style:width>
  <div class="text-field" style:width="100%">
    <Textfield
      {placeholder}
      variant="boxed"
      {borderColor}
      {borderWeight}
      {focusedBoxShadow}
      {fontSize}
      width="100%"
      bind:value={text}
    />
  </div>
  {#if hourFormat == "12"}
    <div class="period-selector">
      <Switch bind:value={switchValue} />
      <div
        style:margin-top="25px"
        style:font-size={fontSize}
        style:text-align="center"
      >
        {dayPeriod.toUpperCase()}
      </div>
    </div>
  {/if}
</div>

<style>
  .container {
    display: flex;
  }
  .period-selector {
    align-self: flex-start;
    margin-left: 20px;
  }
</style>
