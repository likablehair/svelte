<script lang="ts">
  export let component: any

let frame: any;
let win;
let doc;
let head: any;
let body;
let content: any;
let props: any;
$: {
  ({ component, ...props } = $$props);
  if (content) content.set(props);
}
$: if (frame) {
  frame.addEventListener('load', loadHandler);
  if (frame.contentDocument.readyState === 'complete' && frame.contentDocument.defaultView) {
    loadHandler();
  } else {
    frame.addEventListener('load', loadHandler);
  }
}
function loadHandler() {
  win = frame.contentWindow;
  doc = frame.contentDocument;
  head = doc.head;
  body = doc.body;
  doc.insertBefore(document.doctype?.cloneNode(true), doc.documentElement);
  const style = doc.createElement('style');
  style.innerText = `html,body {
    background: none !important;
    margin: 0 !important;
    padding: 0px !important;
    overflow: hidden !important;
    height: 100% !important;
  }`;
  head.appendChild(style);
  Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .forEach(node => head.appendChild(node.cloneNode(true)));
  if (component) {
    content = new component({ target: body, props, slots: $$slots });
  }
}
</script>

<iframe bind:this={frame} title="playground"></iframe>

<style>
iframe {
  border: none;
  width: 100%;
}
</style>