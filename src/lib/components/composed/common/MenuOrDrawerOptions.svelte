<script lang="ts" module>
  export type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[] ? ElementType : never;
</script>

<script lang="ts">
  import '../../../css/main.css'
  import type { ComponentProps } from 'svelte';
  import MenuOrDrawer from "./MenuOrDrawer.svelte";
  import type Drawer from '$lib/components/simple/navigation/Drawer.svelte';
  import type Menu from '$lib/components/simple/common/Menu.svelte';
  import SelectableVerticalList from '$lib/components/simple/lists/SelectableVerticalList.svelte';

  interface Props {
    open?: boolean;
    activator: HTMLElement;
    drawerPosition?: ComponentProps<typeof Drawer>['position'];
    menuAnchor?: ComponentProps<typeof Menu>['anchor'];
    elements?: ComponentProps<typeof SelectableVerticalList>['elements'];
    stayInViewport?: ComponentProps<typeof MenuOrDrawer>['stayInViewport'];
    flipOnOverflow?: ComponentProps<typeof MenuOrDrawer>['flipOnOverflow'];
    _boxShadow?: string;
    _height?: string;
    _maxHeight?: string;
    _minWidth?: string;
    _borderRadius?: string;
    openingId?: ComponentProps<typeof MenuOrDrawer>['openingId'];
    onselect?: ComponentProps<typeof SelectableVerticalList>['onselect']
  }

  let { 
    open = $bindable(false),
    activator = $bindable(),
    drawerPosition = 'bottom',
    menuAnchor = 'bottom-center',
    elements = [],
    stayInViewport = true,
    flipOnOverflow = false,
    _boxShadow = "rgb(var(--global-color-grey-900), .5) 0px 2px 4px",
    _height = "fit-content",
    _maxHeight = undefined,
    _minWidth = "100px",
    _borderRadius = "5px",
    openingId = undefined,
    onselect,
  }: Props = $props();

  let selected: ArrayElement<NonNullable<ComponentProps<typeof SelectableVerticalList>['elements']>>['name'] | undefined = $state()
  let focused: ArrayElement<NonNullable<ComponentProps<typeof SelectableVerticalList>['elements']>>['name'] | undefined = $state()
  $effect(() => {
    if(!!selected) selected = undefined
  })
  $effect(() => {
    if(!!focused && !open) focused = undefined
  })

  function handleOnSelect(e: Parameters<NonNullable<ComponentProps<typeof SelectableVerticalList>['onselect']>>[0]){
    open = false

    if(onselect){
      onselect(e)
    }
  }
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
  --drawer-default-space={`${Math.min(elements?.length || 0, 5) * 56}px`}
  bind:openingId
>
  {#snippet children({ isDrawer, isMenu })}
    <div class="selectable-list-wrapper">
      <SelectableVerticalList
        bind:selected
        bind:focused
        bind:elements
        --selectable-vertical-list-default-width={isDrawer ? '100%' : 'auto'}
        --selectable-vertical-list-default-element-height={isDrawer ? '56px' : 'auto'}
        --selectable-vertical-list-default-title-font-size="null"
        onselect={handleOnSelect}
      ></SelectableVerticalList>
    </div>
  {/snippet}
</MenuOrDrawer>

<style>
  .selectable-list-wrapper {
    background-color: rgb(var(--global-color-background-100));
    overflow: auto;
    height: 100%
  }
</style>