<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import PaginatedTable from "$lib/components/composed/list/PaginatedTable.svelte";
  import type { Filter } from "$lib/utils/filters/filters";
  import type { Header } from "$lib/components/simple/lists/SimpleTable.svelte";
  import Icon from "$lib/components/simple/media/Icon.svelte";
  import type Builder from "$lib/utils/filters/builder";
  import SimpleTextField from "$lib/components/simple/forms/SimpleTextField.svelte";
    import Button from "$lib/components/simple/buttons/Button.svelte";
    import QuickActions from "$lib/components/composed/common/QuickActions.svelte";

  let slotSelectActionsContainer: HTMLElement,
    showSelectContainer = false

</script>

<h1>QuickActions</h1>
<ComponentSubtitle>Fast actions available only to you.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <Button
    on:click={() => { showSelectContainer = true }}
  >
    Show Actions
  </Button>

  <QuickActions
    bind:slotSelectActionsContainer={slotSelectActionsContainer}
    loading={false}
    disabled={false}
    totalRows={5}
    isSelectedAll={false}
    {showSelectContainer}
    actionsForSelectedItems={[
      {
        label: 'Disassociate',
        icon: 'mdi-account-multiple-minus-outline',
        disabled: true,
        onClick: () => {
          return
        }
      },
      {
        label: 'Aggregate',
        icon: 'mdi-link-variant-plus',
        disabled: false,
        onClick: () => {}
      },
      {
        label: 'Ungroup',
        icon: 'mdi-link-variant-minus',
        disabled: false,
        onClick: () => {
          return
        }
      },
      {
        label: 'Split',
        icon: 'mdi-link-variant',
        disabled: true,
          onClick: () => {
          return
        }
      },
      {
        label: 'Supplier = Trader',
        icon: 'mdi-account-arrow-right-outline',
        disabled: false,
          onClick: () => {
          return
        }
      },
      {
        label: 'Supplier = Manufacturer',
        icon: 'mdi-account-arrow-right-outline',
        disabled: false,
          onClick: () => {
          return
        },
        info: 'Essential information'
      },
      {
        label: 'Apply default values',
        icon: 'mdi-cloud-upload-outline',
        disabled: true,
          onClick: () => {
          return
        }
      }
    ]}
    selectedItems={[
      {},
      {}
    ]}
  >
  </QuickActions>
</div>
<h2>Props</h2>
<PropsViewer
  props={[
    // {
    //   name: 'type',
    //   type: '"button" | "submit"',
    //   description: "HTML type attribute",
    //   default: "button"
    // }
  ]}
  styleProps={[
    // {
    //   name: '--button-max-width',
    //   type: 'string',
    //   default: 'undefined',
    //   description: 'The max width of the outer element'
    // }
  ]}
></PropsViewer>
<h2>Slots</h2>
<h2>Events</h2>

<style>
  .example {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 20px;
  }

  :global(.calculated-class) {
    background-color: rgba(var(--global-color-contrast-200), 0.2);
  }
</style>