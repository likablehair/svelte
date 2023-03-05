<script lang="ts">
  export let outlined = false,
    maxWidth: string | undefined = undefined,
    maxHeight: string | undefined = undefined,
    minWidth: string | undefined = undefined,
    minHeight: string | undefined = undefined,
    width = "fit-content",
    height: string | undefined = undefined,
    padding = "5px",
    borderRadius = "5px",
    backgroundColor = "rgb(252, 252, 252)",
    color: string | undefined = undefined,
    borderColor: string | undefined = undefined,
    borderWidth: string | undefined = undefined,
    marginBottom: string | undefined = undefined,
    marginTop: string | undefined = undefined,
    marginLeft: string | undefined = undefined,
    marginRight: string | undefined = undefined,
    boxShadow =
      "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)";
</script>

<div
  style:width
  style:max-width={maxWidth}
  style:min-width={minWidth}
  style:height
  style:max-height={maxHeight}
  style:min-height={minHeight}
  style:padding
  style:border-radius={borderRadius}
  style:background-color={backgroundColor}
  style:color
  style:border-color={borderColor}
  style:border-width={borderWidth}
  style:margin-bottom={marginBottom}
  style:margin-top={marginTop}
  style:margin-left={marginLeft}
  style:margin-right={marginRight}
  style:box-shadow={boxShadow}
  style:display="flex"
  style:flex-direction="column"
  on:click
  on:keypress
  class:border-solid={outlined}
>
  <div style:flex="none" class="header">
    <slot name="header" />
  </div>
  <div style:flex-shrink="1" style:overflow-y="auto" class="body">
    <slot />
  </div>
  <div style:flex="none" class="footer flex-none">
    <slot name="footer" />
  </div>
</div>
