<script lang="ts">
  export let props: {
    name: string,
    type: string,
    description: string,
    default: string
  }[] = []
</script>

<ul class="container">
  {#each props as prop}
    <div class="element">
      <div class="first-column">
        <div class="first-line">
          <code>{prop.name}</code>
          <div class="props-type">{prop.type}</div>
        </div>
        <div class="second-line">
          {prop.description}
        </div>
      </div>
      <div class="append-column">
        <code>{prop.default}</code>
      </div>
    </div>
  {/each}
</ul>

<style>
  .container {
    display: flex;
    flex-direction: column;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .element {
    border-bottom: 1px solid rgba(24,24,27,.1);
    padding: 1rem 0 1rem 0;
    display: flex;
    align-items: center;
  }

  .first-line {
    display: flex;
    align-items: center;
    font-family: monospace;
    gap: 1.5rem;
  }

  .first-column {
    flex-grow: 1;
  }

  .second-line {
    margin-top: .8rem;
  }

  .props-type {
    color: var(--global-light-contrast-color);
  }

  code {
    color: rgb(16, 16, 16);
    border-radius: 0.5rem;
    padding: 0.25rem 0.375rem;
    box-shadow: inset 0 0 0 1px #d4d4d8;
    background-color: #f4f4f5;
  }
</style>