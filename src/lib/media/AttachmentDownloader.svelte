<script lang="ts">
  export let 
    title: string = undefined,
    description: string = undefined,
    borderColor: string = "#B8B8B8",
    iconColor: string = "#8D8D8D",
    iconSize: number = 40,
    iconName: string = 'mdi-file',
    borderWidth: string = '1px',
    maxWidth: string = undefined,
    maxHeight: string = undefined,
    minWidth: string = undefined,
    minHeight: string = undefined,
    width: string = 'fit-content',
    height: string = undefined

  import Icon from '$lib/media/Icon.svelte'
  import Card from '$lib/common/Card.svelte'
</script>

<style>
  .title {
    font-size: 13pt;
    font-weight: 700;
  }

  .description {
    margin-top: 5px;
    font-size: 9pt;
    font-weight: 200;
  }
</style>

<Card
  outlined
  borderColor={borderColor}
  borderWidth={borderWidth}
  width={width}
  maxWidth={maxWidth}
  minWidth={minWidth}
  height={height}
  maxHeight={maxHeight}
  minHeight={minHeight}
  on:click
>
  <div
    style:display="flex"
    style:align-items="center"
    style:gap="10px"
  >
    <Icon 
      name={iconName}
      size={iconSize}
      color={iconColor}
    ></Icon>
    <div
      style:margin-left="10px"
      style:margin-right="10px"
      style:margin-top="10px"
      style:margin-bottom="10px"
    >
      {#if !!title}
        <div 
          class="title"
        >{title}</div>
      {/if}
      {#if !!description}
        <div
          class="description"
        >{description}</div>
      {/if}
    </div>
  </div>
</Card>

