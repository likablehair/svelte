<script>
  import Code from "$lib/components/simple/typography/Code.svelte";
  import FinalButton from "../FinalButton.svelte";
  import cssColorVariable from "./cssColorVariable";
  import colorStoreType from "./colorStoreType";
  import defaultCssVariables from './defaultCssVariables'
  import colorStoreUsage from "./colorStoreUsage";
  import themeStoreDisabled from "./themeStoreDisabled";
</script>

<h1>Theming</h1>
<p>Is always hard to chose the right style for your application. 
  This library has some basic concepts that helps you do that.</p>

<h2 id="class-attribute">Class attribute</h2>
<p>Every components will have a <code class="inline">class</code> attribute, 
  that will let you specify all the classes you want to apply to the root 
  element of the components.</p>
<p>In case the components has more than one root elements, or want to 
  let you specify more element classes, then the class attribute will 
  be an <code class="inline">object</code>
</p>

<h2>Components style props</h2>
<p>Some components (many of them) will have style props you can apply to them. Those 
  props will begin with <code class="inline">--</code> and svelte will convert them to
  CSS variable. The variable you define will overwrite the component default. Something like that:</p>

<Code
  code={cssColorVariable}
  language="svelte"
></Code>

<h2>Themes store</h2>
<p>The library comes with a themes store, where are stored all the color 
  needed by the app. This store has this type of object:</p>
<Code
  code={colorStoreType}
  language="typescript"
></Code>
<p>The color specified for the current theme will be used as default for components.
  The default theme will be <code class="inline">light</code>, but you can always
  choose another one, like explained below.
</p>
<p>The colors key of the store is initially empty. If you want to change it import the 
  store from the library and then set the value:</p>
<Code
  code={colorStoreUsage}
  language="typescript"
></Code>

<h2>Color CSS Variables</h2>
<p>The theme store is useful if you want to change colors or theme at runtime, but when you 
  load the page you can see that the page has to execute the javascript in order to 
  setting the right colors.
</p>
<p>To avoid the side effect you can set the default colors with CSS variables, 
  then when the javascript will run the store will take over.
</p>
<p>Those are the CSS variables:
</p>
<Code
  code={defaultCssVariables}
  language="css"
></Code>
<p>Setting the variable is not mandatory. Neither using the store is: you can choose 
  to use only css variables for example. In that case could be useful to deactivate 
  the store like that:</p>
<Code
  code={themeStoreDisabled}
  language="typescript"
></Code>
<p>Either way if the store is empty CSS variables will remain untouched.</p>

<h2>Setting the active theme</h2>
<p>As you can see in the theme store there is an attribute called <code class="inline">active</code>.
  This attribute contains the value <code class="inline">light</code> by default, if you have set multiple
  colors in the theme you can set the active to one of those and colors will switch.
</p>
<p>
  This way you will be able to specify not only a dark theme but also whatever color scheme you need.
</p>

<h2>Tailwind Integration</h2>
Thanks to the <code class="inline">class attribute</code> you can use all the available tailwind classes. 
So if you prefer to use tailwind as a theming engine you're free to choose.

<FinalButton
  previousText="Quickstart"
  previousUrl="/docs/quickstart"
  nextText="Components"
  nextUrl="/docs/components"
></FinalButton>

<style>
  /* h2 {
    margin-top: -20px;
    padding-top: 20px;
  } */
</style>