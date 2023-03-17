<script lang="ts">
  import { v4 as uuidv4 } from "uuid";

  export let label: string | null = null,
    placeholder = "placeholder",
    textAreaId: string = uuidv4(),
    fontFamily = "inherit",
    value = "",
    resizable = true,
    disabled = false,
    readOnly = false,
    maxLength: number | undefined = undefined,
    textColor = "black",
    border = "none",
    borderRadius = "5px",
    focusedBoxShadow: string | undefined = undefined,
    backgroundColor: string | null = null,
    padding: string | undefined = undefined,
    paddingLeft: string | undefined = undefined,
    paddingRight: string | undefined = undefined,
    paddingBottom: string | undefined = undefined,
    paddingTop: string | undefined = undefined,
    fontSize: string | undefined = undefined,
    labelFontSize: string | undefined = undefined,
    labelColor: string | undefined = undefined,
    width = "100%",
    height = "100%";
</script>

<div class="container">
  {#if label}
    <label
      for={textAreaId}
      style:font-size={labelFontSize}
      style:color={labelColor}
    >
      {label}
    </label>
  {/if}
  <textarea
    style:width
    style:height
    style:font-family={fontFamily}
    style:resize={resizable ? "both" : "none"}
    style:font-size={fontSize}
    style:border-radius={borderRadius}
    style:background-color={backgroundColor}
    style:color={textColor}
    style:padding
    style:padding-left={paddingLeft}
    style:padding-right={paddingRight}
    style:padding-bottom={paddingBottom}
    style:padding-top={paddingTop}
    style:border
    style:--textarea-focus-box-shadow={focusedBoxShadow}
    bind:value
    id={textAreaId}
    {placeholder}
    maxlength={maxLength}
    {disabled}
    readonly={readOnly}
  />
</div>

<style>
  textarea {
    display: block;
    transition: all 0.3s;
  }

  label {
    display: block;
    margin-bottom: 10px;
    margin-left: 10px;
  }

  textarea:focus {
    outline: none;
    -webkit-box-shadow: var(--textarea-focus-box-shadow);
    -moz-box-shadow: var(--textarea-focus-box-shadow);
    -o-box-shadow: var(--textarea-focus-box-shadow);
    box-shadow: var(--textarea-focus-box-shadow);
  }
</style>
