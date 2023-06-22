<script>
  import standardComponent from './stadardComponent'
  import Code from "$lib/components/simple/typography/Code.svelte";
  import FinalButton from "../FinalButton.svelte";
  import cssImportFile from './cssImportFile';

  let basicButtonImport = `npm install @likable-hair/svelte`
</script>

<h1>Quickstart</h1>
<p>You can either use <b>@likable-hair/svelte</b> package in a sveltekit project or whatever framework that is capable of compiling sveltekit components.</p>
<p>We advise you to use sveltekit because it helps you to keep files ordered and do the hard work under the hood.</p>
<h2>Use Sveltekit</h2>
<p>
  Follow the <a href="https://kit.svelte.dev/docs/creating-a-project" target="_blank" rel="noreferrer">sveltekit starter project tutorial</a> to create a new blank sveltekit app.
</p>
<p>
  After the app is created just install the package:
</p>
<Code
  code={basicButtonImport}
  language="bash"
></Code>

<p>
  Then you have to create a +layout.svelte in the root of the 
  routes directory and import the css file:
</p>
<Code
  code={cssImportFile}
  language="svelte"
  title="routes/+layout.svelte"
></Code>

<p>
  Then you're free to go! You can write component like this:
</p>
<Code
  code={standardComponent}
  title="/routes/+page.svelte"
  language="svelte"
></Code>

<FinalButton
  previousText="Introduction"
  previousUrl="/docs/introduction"
  nextText="Theming"
  nextUrl="/docs/theming"
></FinalButton>