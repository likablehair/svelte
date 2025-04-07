<script lang="ts" module>
  export type Slot = {
    name: string,
    description: string,
    default?: string,
    properties?: {
      name: string,
      type: string,
      description: string
    }[]
  };
</script>

<script lang="ts">
  import NoData from "$lib/components/simple/common/NoData.svelte";

  import Code from "$lib/components/simple/typography/Code.svelte";
  interface Props {
    slots?: Slot[];
  }

  let { slots = [] }: Props = $props();
</script>

<ul class="container">
  {#if slots.length > 0}
    {#each slots as slot}
      <div class="element">
        <div class="title">{slot.name}</div>
        <div class="description">{slot.description}</div>
        {#if !!slot.default}  
          <div class="subtitle">Default content:</div>
          <Code
            language="svelte"
            code={slot.default}
          ></Code>
        {/if}
        {#if !!slot.properties}
          <div class="subtitle">Available variables:</div>
          <div class="properties">
            <table class="properties-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {#each slot.properties as property}
                  <tr>
                    <td>
                      <code>
                        {property.name}
                      </code>
                    </td>
                    <td>
                      <code>
                        {property.type}
                      </code>
                    </td>
                    <td>{property.description}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    {/each}
  {:else}
    <div
      style:display="flex"
      style:height="3rem"
      style:font-size=".9rem"
      style:align-items="center"
      style:justify-content="center"
      style:color="rgb(var(--global-color-contrast-300))"
    >
      <NoData/>
    </div>
  {/if}
</ul>

<style>
  .container {
    display: flex;
    flex-direction: column;
    list-style: none;
    gap: 1rem;
    margin: 0;
    padding: 0;
  }

  .element {
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    background-color: rgb(var(--global-color-background-200));
    padding: 1rem;
    border-radius: .5rem;
  }

  .title {
    font-size: 1.1rem;
    font-weight: 700;
  }

  .subtitle {
    margin-top: 1rem;
    margin-bottom: .5rem;
    font-size: .875rem;
    font-weight: 600;
  }

  .description {
    font-size: .8rem;
    font-weight: 200;
  }

  code {
    color: rgb(16, 16, 16);
    border-radius: 0.5rem;
    padding: 0.25rem 0.375rem;
    box-shadow: inset 0 0 0 1px #d4d4d8;
    background-color: #f4f4f5;
  }

  .properties-table {
    border-collapse: collapse;
    margin: 25px 0;
    font-size: 0.9em;
    font-family: sans-serif;
    min-width: 400px;
    width: 100%;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.15);
  }

  .properties-table thead tr {
    background-color: rgb(var(--global-color-primary-500));
    color: rgb(var(--global-color-grey-50));
    text-align: left;
  }

  .properties-table th,
  .properties-table td {
      padding: 12px 15px;
  }

  .properties-table tbody tr {
    border-bottom: 1px solid var(--global-light-contrast-color);
  }

  .properties-table tbody tr:nth-of-type(even) {
    background-color: rgb(var(--global-color-background-300));
  }

  .properties-table tbody tr:last-of-type {
    border-bottom: 2px solid rgb(var(--global-color-primary-500));
  }

</style>