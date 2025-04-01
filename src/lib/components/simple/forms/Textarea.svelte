<script lang="ts">
  import { createId } from '@paralleldrive/cuid2';

  interface Props {
    label: string | null;
    placeholder: string;
    textAreaId: string;
    fontFamily: string;
    value: string;
    resizable: boolean;
    disabled: boolean;
    readOnly: boolean;
    maxLength?: number;
    textColor: string;
    border: string;
    borderRadius: string;
    focusedBoxShadow?: string;
    backgroundColor: string | null;
    padding?: string;
    paddingLeft?: string;
    paddingRight?: string;
    paddingBottom?: string;
    paddingTop?: string;
    fontSize?: string;
    labelFontSize?: string;
    labelColor?: string;
    width: string;
    height: string;
  }

  let {
    label = null,
    placeholder = "placeholder",
    textAreaId = createId(),
    fontFamily = "inherit",
    value = $bindable(""),
    resizable = true,
    disabled = false,
    readOnly = false,
    maxLength = undefined,
    textColor = "black",
    border = "none",
    borderRadius = "5px",
    focusedBoxShadow = undefined,
    backgroundColor = null,
    padding = undefined,
    paddingLeft = undefined,
    paddingRight = undefined,
    paddingBottom = undefined,
    paddingTop = undefined,
    fontSize = undefined,
    labelFontSize = undefined,
    labelColor = undefined,
    width = "100%",
    height = "100%"
  }: Props = $props();
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

  textarea:focus {
    outline: none;
    -webkit-box-shadow: var(--textarea-focus-box-shadow);
    -moz-box-shadow: var(--textarea-focus-box-shadow);
    -o-box-shadow: var(--textarea-focus-box-shadow);
    box-shadow: var(--textarea-focus-box-shadow);
  }
</style>
