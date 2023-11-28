<script lang="ts">
  import '../../../css/flag-icons/css/flag-icons.min.css'
  import './FlagIcon.css'
  
  let clazz: string | undefined = undefined;
	export { clazz as class };

  export let alpha2: string
</script>

<span 
  class="flag-icon fi fi-{alpha2.toLowerCase()} fis {clazz || ''}"
></span>

<style>
  .flag-icon {
    border-radius: var(
      --flag-icon-border-radius,
      var(--flag-icon-default-border-radius)
    );
    font-size: var(
      --flag-icon-size,
      var(--flag-icon-default-size)
    );
  }
</style>