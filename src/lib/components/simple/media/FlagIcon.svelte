<script lang="ts">
  import '../../../css/flag-icons/css/flag-icons.min.css'
  import './FlagIcon.css'

  interface Props { 
    alpha2: string
    class?: string
  }

  let { 
    alpha2,
    class: clazz,
  }: Props = $props() 
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