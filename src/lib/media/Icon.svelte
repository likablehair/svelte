<script lang="ts">
  export let name: string,
    size: number = 15;

  $: cssVariables = Object.entries({
      '--size': size + 'pt'
    }).filter(([key]) => key.startsWith('--'))
    .reduce( (css, [key,value]) => {
      return `${ css }${ key }: ${ value };`
    }, '');
  
  import '../common/materialDesign.css'
</script>

<style>
.icon {
  font-size: var(--size);
}
</style>

<span
  style={cssVariables}
  class="icon mdi {name}"
></span>

