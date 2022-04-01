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

  import './tailwind.css';
</script>

<style>
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
  class="flex flex-col shadow-lg" 
  class:border-solid={outlined}
>
  <div class="header flex-none">
    <slot name="header"></slot>
  </div>
  <div class="body shrink overflow-y-auto">
    <slot></slot>
  </div>
  <div class="footer flex-none">
    <slot name="footer"></slot>
  </div>
</div>