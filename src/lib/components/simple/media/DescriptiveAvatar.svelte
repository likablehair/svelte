<script lang="ts">
  export let src: string,
    title: string | undefined = undefined,
    description: string | undefined = undefined,
    direction: "row" | "column" = "row",
    reverse = false,
    avatarSpacing = "10px",
    width: string | undefined = undefined,
    maxWidth: string | undefined = undefined,
    minWidth: string | undefined = undefined,
    height: string | undefined = undefined,
    maxHeight: string | undefined = undefined,
    minHeight: string | undefined = undefined,
    lazyLoaded = false,
    borderRadius = "50%",
    referrerpolicy: ReferrerPolicy | null | undefined = "no-referrer";

  let textAlignment: "left" | "right" | "center";

  $: if (direction == "column") {
    textAlignment = "center";
  } else if (reverse) {
    textAlignment = "right";
  } else {
    textAlignment = "left";
  }

  import Avatar from "$lib/components/simple/media/Avatar.svelte";
</script>

<div
  style:align-items="center"
  style:flex-direction={reverse ? direction + "-reverse" : direction}
  class="descriptive-avatar-container"
  on:click
  on:keypress
>
  <div class="avatar-container">
    <slot name="avatar">
      <Avatar
        {src}
        {width}
        {maxWidth}
        {minWidth}
        {height}
        {maxHeight}
        {minHeight}
        {borderRadius}
        {lazyLoaded}
        {referrerpolicy}
      />
    </slot>
  </div>
  <div
    style:margin-left={!reverse && direction === "row"
      ? avatarSpacing
      : undefined}
    style:margin-right={reverse && direction === "row"
      ? avatarSpacing
      : undefined}
    style:margin-top={!reverse && direction === "column"
      ? avatarSpacing
      : undefined}
    style:margin-bottom={reverse && direction === "column"
      ? avatarSpacing
      : undefined}
    class="description-container"
  >
    {#if !!title}
      <div style:text-align={textAlignment} class="title">{title}</div>
    {/if}
    {#if !!description}
      <div style:text-align={textAlignment} class="description">
        {description}
      </div>
    {/if}
  </div>
</div>

<style>
  .descriptive-avatar-container {
    width: fit-content;
    display: flex;
  }

  .avatar-container {
    flex: none;
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
