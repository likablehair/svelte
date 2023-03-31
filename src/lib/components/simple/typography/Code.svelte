<script lang="ts">
  import { onMount } from "svelte";
  import hljs from 'highlight.js';
  import hljsSvelte from 'highlightjs-svelte';
  import 'highlight.js/styles/github.css';
  import './dracula.css'
  import { escape } from 'lodash'


  export let 
    codeBackgroundColor: string = "rgb(24 24 27/1)",
    headerBackgroundColor: string = "rgb(39 39 42/1)",
    dividerColor: string = "rgb(63 63 70)",
    borderRadius: string = "1rem",
    headerPadding: string = "1rem 1rem",
    codePadding: string = "0rem 1rem",
    color: string = "white",
    boxShadow: string = "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    code: string,
    title: string | undefined = undefined,
    language: 'javascript' | 'bash' | 'html' | 'svelte' = 'javascript'

  let codeElement: HTMLElement
  onMount(() => {
    hljsSvelte(hljs)
    hljs.highlightElement(codeElement)
  })
</script>

<div 
  class="container"
  style:box-shadow={boxShadow}
  style:border-radius={borderRadius}
>
  {#if !!title}  
    <div 
      style:color={color}
      style:background-color={headerBackgroundColor}
      style:border-top-left-radius={borderRadius}
      style:border-top-right-radius={borderRadius}
      style:border-color={dividerColor}
      style:padding={headerPadding}
      style:font-weight="600"
      style:font-size=".8125rem"
      style:line-height="1.5rem"
    >
      {title}
    </div>
  {/if}
  <div
    style:border-bottom-left-radius={borderRadius}
    style:border-bottom-right-radius={borderRadius}
    style:border-top-right-radius={!!title ? undefined : borderRadius}
    style:border-top-left-radius={!!title ? undefined : borderRadius}
    style:background-color={codeBackgroundColor}
  ><pre
      style:margin="0px"
      style:padding={codePadding}
    ><code 
        bind:this={codeElement}
        class="language-{language}"
        style:padding-top="1rem"
        style:padding-bottom="1rem"
        style:font-size="1rem"
        style:line-height="1.5rem"
      >{@html escape(code)}</code></pre></div>
</div>