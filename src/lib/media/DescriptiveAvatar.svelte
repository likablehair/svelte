<script lang="ts">
  export let 
    src: string,
    title: string = undefined,
    description: string = undefined,
    direction: 'row' | 'column' = 'row',
    reverse: boolean = false,
    avatarSpacing: string = '10px',
    width: string = undefined,
    maxWidth: string = undefined,
    minWidth: string = undefined,
    height: string = undefined,
    maxHeight: string = undefined,
    minHeight: string = undefined,
    borderRadius: string = "50%";

  let textAlignment: 'left' | 'right' | 'center'

  $: if(direction == 'column') {
    textAlignment = 'center'
  } else if(reverse) {
    textAlignment = 'right'
  } else {
    textAlignment = 'left'
  }

  import Avatar from "$lib/media/Avatar.svelte";
</script>

<style>
  .descriptive-avatar-container {
    width: fit-content;
    display: flex;
  }

  .avatar-container {
    flex: none
  }

  .description-container {
    flex-grow: 1;
  }

  .title {
    font-size: 12pt;
    font-weight: 700;
  }

  .description {
    font-size: 10pt;
    font-weight: 300;
  }
</style>

<div
  style:align-items="center"
  style:flex-direction={reverse ? direction + '-reverse' : direction}
  class="descriptive-avatar-container"
>
  <div class="avatar-container">
    <Avatar
      src={src}
      width={width}
      maxWidth={maxWidth}
      minWidth={minWidth}
      height={height}
      maxHeight={maxHeight}
      minHeight={minHeight}
      borderRadius={borderRadius}
    ></Avatar>
  </div>
  <div 
    style:margin-left={!reverse && direction === 'row' ? avatarSpacing : undefined}
    style:margin-right={reverse && direction === 'row' ? avatarSpacing : undefined}
    style:margin-top={!reverse && direction === 'column' ? avatarSpacing : undefined}
    style:margin-bottom={reverse && direction === 'column' ? avatarSpacing : undefined}
    class="description-container"
  >
    {#if !!title}
      <div 
        style:text-align={textAlignment}
        class="title"
      >{title}</div>
    {/if}
    {#if !!description}
      <div
        style:text-align={textAlignment}
        class="description"
      >{description}</div>
    {/if}
  </div>
</div>