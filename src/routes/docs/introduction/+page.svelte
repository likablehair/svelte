<script>
  import FinalButton from "../FinalButton.svelte";
  import Code from "$lib/components/simple/typography/Code.svelte";

  let basicButtonImport = `import { Button } from '@likable-hair/svelte'`
  let basicMediaQueryImport = `import { mediaQuery } from '@likable-hair/svelte'`
  let basicButtonUsage = `<Button>I am a button</Button>`
  let basicMediaQueryUsage = `{#if $mediaQuery.s}
  I am a small device
{:else}
  I am not a small device
{/if}`
</script>

<h1>Introduction</h1>
<p>
  @likable-hair is a company based in Piacenza, italy.
  We love <a href="https://kit.svelte.dev/" target="_blank" rel="noreferrer">sveltekit</a> and we decided to create a component libary.
</p>
<h2>Component Usage</h2>
<p>
  This is a super simple library. We have some components written in svelte and we share it as they are.
</p>
<p>
  Let just take for example the <code class="inline">Button</code> component. If you want to use it you have to import it from the library:
</p>
<Code
  code={basicButtonImport}
  title="ButtonComponent.svelte"
></Code>
<p>
  And then use it as a component inside the template:
</p>
<Code
  code={basicButtonUsage}
  title="ButtonComponent.svelte"
></Code>
<p>
  And the job is done!
</p>
<h2>Store Usage</h2>
<p>
  We provide some store that you can use to get some information about the page or the content in that page. In order to use them just import them from the library.
</p>
<p>
  Lets take the <code class="inline">mediaQuery</code> for example. If you want to use it you have to import it from the library:
</p>
<Code
  code={basicMediaQueryImport}
  title="MediaQueryComponent.svelte"
></Code>
<p>
  And then use it wherever you need with the <code class="inline">$</code> special synthax:
</p>
<Code
  code={basicMediaQueryUsage}
  title="MediaQueryComponent.svelte"
></Code>

<FinalButton
  nextText="Quickstart"
  nextUrl="/docs/quickstart"
></FinalButton>