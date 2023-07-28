<script context="module" lang="ts">
  export type Header = {
    value: string;
    label: string;
    type: "boolean" | "string" | "number" | "date" | "custom";
    width?: string;
    minWidth?: string;
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    data?: { [key: string]: any };
  };
</script>

<script lang="ts">
  import '../../../css/main.css'
  import './SimpleTable.css'
  import { dateToString } from "$lib/components/simple/dates/utils";

  export let headers: Header[] = [],
    items: { [key: string]: any }[] = []
</script>

{#if !!items && Array.isArray(items)}
  <div class="simple-table-container" >
    <table class="table">
      <thead class="thead">
        <tr>
          {#each headers as head}
            <th 
              style:width={head.width} 
              style:min-width={head.minWidth}
            >
              <slot name="header" {head}>
                {head.label}
              </slot>
            </th>
          {/each}
          {#if $$slots.rowActions || $$slots.append}
            <th>
              <slot name="append" index={-1} items={undefined} />
            </th>
          {/if}
        </tr>
      </thead>
      <tbody>
        {#each items as item, i}
          <tr class="item-tr">
            {#each headers as header, j}
              <td>
                {#if header.type == "custom"}
                  <slot
                    name="custom"
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
            {#if $$slots.rowActions || $$slots.append}
              <td>
                <slot name="rowActions" index={i} {item} />
                <slot name="append" index={i} {item} />
              </td>
            {/if}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}

<style>
  .simple-table-container {
    --simple-table-default-background-color: transparent;
    --simple-table-default-header-background-color: rgb(var(--global-color-background-400), .8);
    --simple-table-default-separator-color: rgb(var(--global-color-background-400));
    --simple-table-default-header-height: 30px;
    --simple-table-default-header-border-radius: 5px;
    --simple-table-default-width: 100%;
    --simple-table-default-row-height: 60px;
    --simple-table-default-row-hover-background-color: rgb(var(--global-color-background-400), .2);
    --simple-table-default-header-padding: .2rem .5rem;
    --simple-table-default-header-font-weight: 700;

    width: var(
      --simple-table-width,
      var(--simple-table-default-width)
    );
    min-width: var(
      --simple-table-min-width,
      var(--simple-table-default-min-width)
    );
    max-width: var(
      --simple-table-max-width,
      var(--simple-table-default-max-width)
    );
    height: var(
      --simple-table-height,
      var(--simple-table-default-height)
    );
    min-height: var(
      --simple-table-min-height,
      var(--simple-table-default-min-height)
    );
    max-height: var(
      --simple-table-max-height,
      var(--simple-table-default-max-height)
    );
  }

  .table {
    background-color: var(
      --simple-table-background-color,
      var(--simple-table-default-background-color)
    );
  }

  .thead th {
    background-color: var(
      --simple-table-header-background-color,
      var(--simple-table-default-header-background-color)
    );
    padding: var(
      --simple-table-header-padding,
      var(--simple-table-default-header-padding)
    );
    font-size: var(
      --simple-table-header-font-size,
      var(--simple-table-default-header-font-size)
    );
    font-weight: var(
      --simple-table-header-font-weight,
      var(--simple-table-default-header-font-weight)
    )
  }

  .thead th:first-child {
    border-top-left-radius: var(
      --simple-table-header-border-radius,
      var(--simple-table-default-header-border-radius)
    );
    border-bottom-left-radius: var(
      --simple-table-header-border-radius,
      var(--simple-table-default-header-border-radius)
    );
  }

  .thead th:last-child {
    border-top-right-radius: var(
      --simple-table-header-border-radius,
      var(--simple-table-default-header-border-radius)
    );
    border-bottom-right-radius: var(
      --simple-table-header-border-radius,
      var(--simple-table-default-header-border-radius)
    );
  }

  .thead {
    height: var(
      --simple-table-header-height,
      var(--simple-table-default-header-height)
    );
  }

  .item-tr {
    border-bottom: solid;
    border-width: 1px 0;
    border-color: var(
      --simple-table-separator-color,
      var(--simple-table-default-separator-color)
    );
    height: var(
      --simple-table-row-height,
      var(--simple-table-default-row-height)
    );
    transition: background-color .1s ease-in-out;
  }

  .item-tr:hover {
    background-color: var(
      --simple-table-row-hover-background-color,
      var(--simple-table-default-row-hover-background-color)
    );
  }

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
</style>
