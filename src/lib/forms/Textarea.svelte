<script lang="ts">

  import { v4 as uuidv4 } from 'uuid';

  export let label: string = null,
    placeholder: string = "placeholder",
    textAreaId: string = uuidv4(),
    fontFamily: string = "inherit",
    value: string = "",
    resizable: boolean = true,
    disabled: boolean = false,
    readOnly: boolean = false,
    maxLength: number = undefined,
    textColor: string = "black",
    border: string = "none",
    borderRadius: string = "5px",
    focusedBoxShadow: string = undefined,
    backgroundColor: string = null,
    padding: string = undefined,
    paddingLeft: string = undefined,
    paddingRight: string = undefined,
    paddingBottom: string = undefined,
    paddingTop: string = undefined,
    fontSize: string = undefined,
    labelFontSize: string = undefined,
    labelColor: string = undefined,
    width: string = "100%",
    height: string = "100%";

</script>

<div
  class="container"
>
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
    style:width={width}
    style:height={height}
    style:font-family={fontFamily}
    style:resize={resizable?"both":"none"}
    style:font-size={fontSize}
    style:border-radius={borderRadius}
    style:background-color={backgroundColor}
    style:color={textColor}
    style:padding={padding}
    style:padding-left={paddingLeft}
    style:padding-right={paddingRight}
    style:padding-bottom={paddingBottom}
    style:padding-top={paddingTop}
    style:border={border}
    style:--textarea-focus-box-shadow={focusedBoxShadow}
    bind:value={value}
    id={textAreaId}
    placeholder={placeholder}
    maxlength={maxLength}
    disabled={disabled}
    readonly={readOnly}
    ></textarea>
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

  textarea:focus{
    outline: none;
    -webkit-box-shadow: var(--textarea-focus-box-shadow);
    -moz-box-shadow: var(--textarea-focus-box-shadow);
    -o-box-shadow: var(--textarea-focus-box-shadow);
    box-shadow: var(--textarea-focus-box-shadow);
  }

</style>