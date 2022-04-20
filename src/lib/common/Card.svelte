<script lang="ts">
  export let
    outlined: boolean = false,
    maxWidth: string = undefined,
    maxHeight: string = undefined,
    minWidth: string = undefined,
    minHeight: string = undefined,
    width: string = 'fit-content',
    height: string = undefined,
    padding: string = "5px",
    borderRadius: string = "5px",
    backgroundColor: string = "rgb(252, 252, 252)",
    color: string = undefined,
    borderColor: string = undefined,
    borderWidth: string = undefined,
    marginBottom: string = undefined,
    marginTop: string = undefined,
    marginLeft: string = undefined,
    marginRight: string = undefined,
    boxShadow: string = "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"

</script>

<div
  style:width={width}
  style:max-width={maxWidth}
  style:min-width={minWidth}
  style:height={height}
  style:max-height={maxHeight}
  style:min-height={minHeight}
  style:padding={padding}
  style:border-radius={borderRadius}
  style:background-color={backgroundColor}
  style:color={color}
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
  class:border-solid={outlined}
>
  <div 
    style:flex="none"
    class="header"
  >
    <slot name="header"></slot>
  </div>
  <div
    style:flex-shrink="1"
    style:overflow-y="auto"
    class="body"
  >
    <slot></slot>
  </div>
  <div 
    style:flex="none"
    class="footer flex-none"
  >
    <slot name="footer"></slot>
  </div>
</div>