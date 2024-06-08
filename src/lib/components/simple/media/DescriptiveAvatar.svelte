<script lang="ts">
  import './DescriptiveAvatar.css'
  import '../../../css/main.css'
  import Avatar from "$lib/components/simple/media/Avatar.svelte";

  export let src: string | undefined = undefined,
    title: string | undefined = undefined,
    subtitle: string | undefined = undefined,
    avatarText: string | undefined = !title ? undefined : title.substring(0, 2).toUpperCase(),
    direction: "row" | "column" = "row",
    reverse = false,
    referrerpolicy: ReferrerPolicy | null | undefined = "no-referrer";
</script>

<div 
  class="flex image-gapped items-center clickable"
  class:flex-col={direction == 'column'}
  class:flex-reverse={direction == 'row' && reverse}
  class:flex-col-reverse={direction == 'column' && reverse}
  role="presentation"
  on:click
>
  <Avatar
    {src}
    {referrerpolicy}
    bind:text={avatarText}
  ></Avatar>
  {#if !!title || !!subtitle}
    <slot {title} {subtitle} {avatarText} {src}>
      <div class="flex flex-col text-gapped">
        {#if !!title}
          <div 
            class="font-bold title"
            class:text-center={direction == 'column'}
            class:text-end={direction == 'row' && reverse}
          >{title}</div>
        {/if}
        {#if !!subtitle}
          <div 
            class="subtitle"
            class:text-center={direction == 'column'}
            class:text-end={direction == 'row' && reverse}
          >{subtitle}</div>
        {/if}
      </div>
    </slot>
  {/if}
</div>

<!-- <div
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
</div> -->

<!-- <style>
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
</style> -->

<style>
  .flex {
    display: flex;
  }

  .flex-col {
    flex-direction: column;
  }

  .flex-reverse {
    flex-direction: row-reverse;
  }

  .flex-col-reverse {
    flex-direction: column-reverse;
  }

  .image-gapped {
    gap: var(
      --descriptive-avatar-image-gap,
      var(--descriptive-avatar-default-image-gap)
    )
  }

  .text-gapped {
    gap: var(
      --descriptive-avatar-text-gap,
      var(--descriptive-avatar-default-text-gap)
    )
  }

  .font-bold {
    font-weight: bold;
  }

  .items-center {
    align-items: center;
  }

  .text-center {
    text-align: center;
  }

  .text-end {
    text-align: end;
  }

  .title {
    font-size: var(
      --descriptive-avatar-font-size,
      var(--descriptive-avatar-default-font-size)
    )
  }

  .clickable {
    cursor: var(
      --descriptive-avatar-cursor,
      var(--descriptive-avatar-default-cursor)
    );
  }
</style>
