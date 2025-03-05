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

  export let open: boolean = false,
    activator: HTMLElement,
    drawerPosition: ComponentProps<Drawer>['position'] = 'bottom',
    menuAnchor: ComponentProps<Menu>['anchor'] = 'bottom-center',
    elements: ComponentProps<SelectableVerticalList>['elements'] = [],
    stayInViewport: ComponentProps<MenuOrDrawer>['stayInViewport'] = true,
    flipOnOverflow: ComponentProps<MenuOrDrawer>['flipOnOverflow'] = false,
    _boxShadow: string = "rgb(var(--global-color-grey-900), .5) 0px 2px 4px",
    _height: string = "fit-content",
    _maxHeight: string | undefined = undefined,
    _minWidth: string = "100px",
    _borderRadius: string = "5px",
    openingId: ComponentProps<MenuOrDrawer>['openingId'] = undefined;

  let selected: ArrayElement<NonNullable<ComponentProps<SelectableVerticalList>['elements']>>['name'] | undefined
  let focused: ArrayElement<NonNullable<ComponentProps<SelectableVerticalList>['elements']>>['name'] | undefined
  $: if(!!selected) selected = undefined
  $: if(!!focused && !open) focused = undefined
</script>

<MenuOrDrawer
  bind:open
  bind:activator
  bind:drawerPosition
  bind:menuAnchor
  bind:stayInViewport
  bind:flipOnOverflow
  {_boxShadow}
  {_height}
  {_maxHeight}
  {_minWidth}
  {_borderRadius}
  let:isDrawer
  --drawer-default-space={`${Math.min(elements?.length || 0, 5) * 56}px`}
  bind:openingId
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
  }
</style>