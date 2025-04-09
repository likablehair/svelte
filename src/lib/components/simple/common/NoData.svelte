<script lang="ts">
    import Icon from "../media/Icon.svelte";

  interface Props {
    lang?: 'it' | 'en',
    noItemsText?: string,
    iconName?: string,
    class?: string 
  }

  let {
    lang = 'en',
    noItemsText = lang == 'en' ? 'No data available' : 'Nessun dato disponibile',
    iconName = 'mdi-database-off',
    class: clazz,
  }: Props = $props()
</script>

<div>
  <Icon name={iconName} ></Icon>
  <span class={clazz}>{noItemsText}</span>
</div>