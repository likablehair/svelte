<script lang="ts">
  export let title: string | undefined = undefined,
    description: string | undefined = undefined,
    borderColor = "#B8B8B8",
    iconColor = "#8D8D8D",
    iconSize = 40,
    iconName = "mdi-file",
    borderWidth = "1px",
    maxWidth: string | undefined = undefined,
    maxHeight: string | undefined = undefined,
    minWidth: string | undefined = undefined,
    minHeight: string | undefined = undefined,
    width = "fit-content",
    height: string | undefined = undefined;

  import Icon from "$lib/media/Icon.svelte";
  import Card from "$lib/common/Card.svelte";
</script>

<Card
  outlined
  {borderColor}
  {borderWidth}
  {width}
  {maxWidth}
  {minWidth}
  {height}
  {maxHeight}
  {minHeight}
  on:click
>
  <div style:display="flex" style:align-items="center" style:gap="10px">
    <Icon name={iconName} size={iconSize} color={iconColor} />
    <div
      style:margin-left="10px"
      style:margin-right="10px"
      style:margin-top="10px"
      style:margin-bottom="10px"
    >
      {#if !!title}
        <div class="title">{title}</div>
      {/if}
      {#if !!description}
        <div class="description">{description}</div>
      {/if}
    </div>
  </div>
</Card>

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
