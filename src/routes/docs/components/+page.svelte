<script>
  import FinalButton from "../FinalButton.svelte";
</script>

<h1>Components</h1>
<p>Components are the basic entity used to build UI. They could be:</p>
<ul>
  <li>
    <b>Simple components</b>, they are usually built from a blank file and they provide in general a small part of the UI. 
    For Example the <code class="inline">Button</code> component only provide a button to click and it uses the <code class="inline">&lt;button /&gt;</code> tag plus some style.
  </li>
  <li>
    <b>Composed components</b>, they are a combination of one or more simple components or an enanched one.
    For example the <code class="inline">SearchResults</code> component use a <code class="inline">SelectableVerticalList</code> component inside and adapts it to show search results.
  </li>
  <li>
    <b>Layouts</b>, they are used as application layouts.
    For example the <code class="inline">StableDividedSideBarLayout</code> component, which is used for this doc, provide the sidebar navigation and the header menu.
  </li>
</ul>

<h2>Typescript</h2>
<p>Typescript has become something we cannot miss on a project. All our components use it, so we encourage its usage on every javascript project.</p>
<p>Anyway svelte let developers choose, so you can always choose to use our typescript components with plain javascript as well.</p>

<FinalButton
  previousText="Quickstart"
  previousUrl="/docs/quickstart"
  nextText="Button"
  nextUrl="/docs/components/simple-components/Button"
></FinalButton>