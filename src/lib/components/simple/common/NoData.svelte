<script lang="ts">
  import '../../../css/main.css'
  import './NoData.css'
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

<div class="no-data-container">
  <Icon name={iconName} --icon-default-size="40px"></Icon>
  <span class="no-data-text {clazz || ''}">{noItemsText}</span>
</div>

<style>
  .no-data-container {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    gap: var(
      --no-data-gap, 
      var(--no-data-default-gap)
    );
    opacity: 50%;
  }

  .no-data-text {
    font-size: 12px;
    opacity: 50%;
  }
</style>