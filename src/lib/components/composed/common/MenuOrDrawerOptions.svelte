<script lang="ts" context="module">
  export type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[] ? ElementType : never;
</script>

<script lang="ts">
  import '../../../css/main.css'
  import type { ComponentProps } from 'svelte';
  import MenuOrDrawer from "./MenuOrDrawer.svelte";
  import type Drawer from '$lib/components/simple/navigation/Drawer.svelte';
  import type Menu from '$lib/components/simple/common/Menu.svelte';
  import SelectableVerticalList from '$lib/components/simple/lists/SelectableVerticalList.svelte';
  import lodash from 'lodash'

  export let open: boolean = false,
    elements: ComponentProps<SelectableVerticalList>['elements'] = [],
    drawerProps: Omit<ComponentProps<Drawer>, 'open'> | undefined = undefined,
    menuProps: Omit<ComponentProps<Menu>, 'open'> | undefined = undefined

  let selected: ArrayElement<NonNullable<ComponentProps<SelectableVerticalList>['elements']>>['name'] | undefined
  let focused: ArrayElement<NonNullable<ComponentProps<SelectableVerticalList>['elements']>>['name'] | undefined
  $: if(!!selected) selected = undefined
  $: if(!!focused && !open) focused = undefined

  const menuPropsDefaultValue = {
    anchor: 'bottom-center',
    stayInViewport: true,
    flipOnOverflow: false,
    _boxShadow: "rgb(var(--global-color-grey-900), .5) 0px 2px 4px",
    _height: 'fit-content',
    _maxHeight: undefined,
    _minWidth: '100px',
    _borderRadius: '5px',
    openingId: undefined
  }

  $: finalMenuProps = lodash.clone(lodash.merge(menuPropsDefaultValue, menuProps))

  const drawerPropsDefaultValue = {
    position: 'bottom'
  }

  $: finalDrawerProps = lodash.clone(lodash.merge(drawerPropsDefaultValue, drawerProps))
</script>

<MenuOrDrawer
  bind:open
  drawerProps={finalDrawerProps}
  menuProps={finalMenuProps}
  let:isDrawer
  --drawer-default-space={`${Math.min(elements?.length || 0, 5) * 56}px`}
>
  <div class="selectable-list-wrapper">
    <SelectableVerticalList
      bind:selected
      bind:focused
      bind:elements
      --selectable-vertical-list-default-width={isDrawer ? '100%' : 'auto'}
      --selectable-vertical-list-default-element-height={isDrawer ? '56px' : 'auto'}
      --selectable-vertical-list-default-title-font-size="null"
      on:select={() => open = false}
      on:select
    ></SelectableVerticalList>
  </div>
</MenuOrDrawer>

<style>
  .selectable-list-wrapper {
    background-color: rgb(var(--global-color-background-100));
    overflow: auto;
    height: 100%
  }
</style>