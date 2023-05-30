<script lang="ts">
  import { createEventDispatcher } from "svelte";
    import Icon from "../media/Icon.svelte";

  let dispatch = createEventDispatcher<{
    'change': {
      collapsed: boolean
    }
  }>()

  export let collapsed: boolean = false,
    openedIconName: string = "mdi-chevron-left",
    collapsedIconName: string = "mdi-chevron-right",
    iconSize: number = 12,
    disabled: boolean = false


  export let _height = "1px",
    _radius = "0.5px",
    _marginTop: string | undefined = "10px",
    _marginBottom: string | undefined = "10px",
    _marginLeft: string  | undefined = "5px",
    _marginRight: string | undefined = "5px",
    _dividerColor: string = '#d2d2d2',
    _circleColor: string = '#d2d2d2',
    _circleBorder: string = "1px solid" ,
    _iconColor: string = 'grey'

  let buttonHeight: any

  function handleCollapseClick() {
    if(!disabled) {
      collapsed = !collapsed
      dispatch('change', { collapsed })
    }
  }

</script>

<div
  style:display="flex"
  style:margin-right={_marginRight}
  style:margin-left={_marginLeft}
  style:margin-top={_marginTop}
  style:margin-bottom={_marginBottom}
  style:align-items="center"
>
  <div
    style:background-color={_dividerColor}
    style:border-radius={_radius}
    style:height={_height}
    style:flex-grow={1}
  />
  <div
    style:border-radius={buttonHeight + 'px'}
    style:border={_circleBorder}
    style:border-color={_circleColor}
    bind:clientHeight={buttonHeight}
    style:width={buttonHeight + 'px'}
    style:display="flex"
    style:justify-content="center"
    style:cursor="pointer"
    style:color={_iconColor}
    style:opacity={disabled ? 0 : 1}
    on:click="{handleCollapseClick}"
    on:click
    on:keydown
    on:keyup
    on:keypress
  >
    <Icon name={collapsed ? collapsedIconName : openedIconName} size={iconSize}></Icon>
  </div>
</div>
