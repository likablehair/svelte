<script lang="ts" module>
  export type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[] ? ElementType : never;
</script>

<script lang="ts" generics="Data">
  import '../../../css/main.css'
  import type { ComponentProps } from 'svelte';
  import MenuOrDrawer from "./MenuOrDrawer.svelte";
  import SelectableVerticalList from '$lib/components/simple/lists/SelectableVerticalList.svelte';
  import lodash from 'lodash'

  interface Props extends ComponentProps<typeof MenuOrDrawer> {
    elements?: ComponentProps<typeof SelectableVerticalList<Data>>['elements'];
    onselect?: ComponentProps<typeof SelectableVerticalList<Data>>['onselect']
  }

  let { 
    open = $bindable(false),
    elements = [],
    onselect,
    menuProps,
    drawerProps,
  }: Props = $props();

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

  let finalMenuProps = $derived(
    lodash.clone(lodash.merge(menuPropsDefaultValue, menuProps))
  )

  const drawerPropsDefaultValue = {
    position: 'bottom'
  }

  let finalDrawerProps = $derived(
    lodash.clone(lodash.merge(drawerPropsDefaultValue, drawerProps))
  )

  let selected: ArrayElement<NonNullable<ComponentProps<typeof SelectableVerticalList<Data>>['elements']>>['name'] | undefined = $state()
  let focused: ArrayElement<NonNullable<ComponentProps<typeof SelectableVerticalList<Data>>['elements']>>['name'] | undefined = $state()
  $effect(() => {
    if(!!selected) selected = undefined
  })
  $effect(() => {
    if(!!focused && !open) focused = undefined
  })

  function handleOnSelect(e: Parameters<NonNullable<ComponentProps<typeof SelectableVerticalList<Data>>['onselect']>>[0]){
    open = false

    if(onselect){
      onselect(e)
    }
  }
</script>

<MenuOrDrawer
  bind:open
  drawerProps={finalDrawerProps}
  menuProps={finalMenuProps}
  --drawer-default-space={`${Math.min(elements?.length || 0, 5) * 56}px`}
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
  }
</style>