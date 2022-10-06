<script context="module" lang="ts">
  export type Header = {
    value: string;
    label: string;
    type: "boolean" | "string" | "number" | "date" | "custom";
    width?: string;
    minWidth?: string;
    data?: { [key: string]: any };
  };
</script>

<script lang="ts">
  import { dateToString } from "$lib/dates/utils";

  export let headers: Header[] = undefined,
    items: { [key: string]: any }[] = undefined,
    backgroundColor: string = "rgba(255,255,255,0)",
    headerColor: string = "rgba(0,0,0,0.05)",
    rowSeparatorColor: string = headerColor,
    headerHeight: string = "30px",
    headerBorderRadius: string = "5px",
    rowHeight: string = "70px",
    minWidth: string = undefined,
    height: string = "100%",
    width: string = "100%";
</script>

{#if !!items && Array.isArray(items)}
  <div class="container" style:height style:width>
    <table
      style:background-color={backgroundColor}
      style:width="100%"
      style:min-width={minWidth}
    >
      <thead 
        style:background-color={headerColor} 
        style:height={headerHeight}
        style:border-radius={headerBorderRadius}
      >
        {#each headers as head}
          <th style:width={head.width} style:min-width={head.minWidth}>
            {head.label}
          </th>
        {/each}
        {#if $$slots.appendLastColumn}
          <th />
        {/if}
      </thead>
      <tbody>
        {#each items as item, i}
          <tr style:border-color={rowSeparatorColor} style:height={rowHeight}>
            {#each headers as header, j}
              <td>
                {#if header.type == "custom"}
                  <slot
                    name="customColumn"
                    index={i}
                    columnIndex={j}
                    {header}
                    {item}
                  />
                {:else if header.type == "date"}
                  {dateToString(item[header.value], "dayAndHours", "it")}
                {:else}
                  {item[header.value]}
                {/if}
              </td>
            {/each}
            {#if $$slots.appendLastColumn}
              <td>
                <slot name="appendLastColumn" index={i} {item} />
              </td>
            {/if}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}

<style>
  table {
    border-collapse: collapse;
    width: 100%;
  }
  th {
    text-align: start;
    padding-left: 10px;
    min-width: 100px;
  }
  td {
    padding-left: 10px;
  }
  tr:not(:first-child) {
    border: solid;
    border-width: 2px 0;
  }
</style>
