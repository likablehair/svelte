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
    style: string = ""

</script>

<style>
  .shadow-lg {
    --shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    --shadow-colored: 0 10px 15px -3px #000, 0 4px 6px -4px #000;
    box-shadow: inset 0 0 0 calc(1px + 0px) rgb(255 255 255/0.1), 0 0 #0000, 0 0 #0000;
  }
</style>

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
  style={style}
  style:display="flex"
  style:flex-direction="column"
  class="shadow-lg" 
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