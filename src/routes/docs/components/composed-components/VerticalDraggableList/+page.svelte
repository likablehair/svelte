<script lang="ts">
    import { Button, Divider, Drawer, Icon, VerticalDraggableList } from "$lib";
    import MediaQuery from "$lib/components/simple/common/MediaQuery.svelte";
    import StandardSwitch from "$lib/components/simple/forms/StandardSwitch.svelte";
    import { flip } from "svelte/animate";
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
    import { type Header } from "$lib/components/simple/lists/SimpleTable.svelte";
    import { crossfade } from "svelte/transition";
    import { quintOut } from "svelte/easing";

  const [send, receive] = crossfade({
    duration: 500,
    fallback(node, params) {
      const style = getComputedStyle(node);
      const transform = style.transform === "none" ? "" : style.transform;

      return {
        duration: 500,
        easing: quintOut,
        css: (t) => `
        transform: ${transform} scale(${t});
        opacity: ${t}
      `,
      };
    },
  });

  let headers : Header[] =[
      {
        value: 'businessName',
        label: 'Business name',
        type: {
        key: "string",
      },
    },
    {
      value: "productName",
      label: "Product Name",
      type: {
        key: "string",
      },
      sortable: true,
    },
    {
      value: "progress",
      label: "Progress",
      type: {
        key: "string",
      },
    },
    {
      value: "rating",
      label: "Rating",
      type: {
        key: "custom",
      },
      sortable: true,
      }
    ],
    headersToShowInTable = headers.slice(2),
    openHeaderDrawer = false,
    headersToSelect: {
        id: string;
        name: string;
      }[] = !!headers
        ? headers
            .filter((h) => {
              return !headersToShowInTable.find((hst) => hst.value == h.value);
            })
            .map((h) => {
              return {
                id: h.value,
                name: h.label,
              };
            })
        : [],
      headersToShow: {
        id: string;
        name: string;
      }[] = headersToShowInTable.map((h) => {
        return {
          id: h.value,
          name: h.label,
        };
      })
</script>

<h1>VerticalDraggableList</h1>
<ComponentSubtitle>Drag all over me.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <Icon
    name="mdi-plus-circle-outline"
    click
    on:click={() => (openHeaderDrawer = true)}
  />

  <MediaQuery let:sAndDown>
  <Drawer
    bind:open={openHeaderDrawer}
    _space={sAndDown ? "60vh" : "20vw"}
    position={sAndDown ? "bottom" : "right"}
  >
    <div style="padding: 20px;">
      <div class="personalize-header">Personalize your headers</div>

      <span class="headers-show grid-col-1">Headers shown in table</span>

      {#if headersToShow}
        <VerticalDraggableList
          items={headersToShow}
          on:changeOrder={(e) => {
            headersToShow = e.detail.items;
          }}
        >
          <svelte:fragment slot="item" let:item>
            <StandardSwitch
              labelWidth="90%"
              value={headersToShow.find((h) => h.id == item.id) != undefined}
              label={item.name}
              on:change={(e) => {
                if (e.detail.value == false) {
                  headersToShow = headersToShow.filter((h) => h.id != item.id);
                  headersToSelect = [...headersToSelect, item];
                }
              }}
            />
          </svelte:fragment>
        </VerticalDraggableList>
      {/if}
      <Divider color="rgb(var(--global-color-contrast-100)" />
      <span class="headers-show grid-col-1">Headers to show</span>
      {#if headersToSelect && headersToSelect.length > 0}
        {#each headersToSelect as header (header.id)}
          <div
            animate:flip
            in:receive={{ key: header }}
            out:send={{ key: header }}
            class="headers-show grid-col-1"
          >
            <StandardSwitch
              labelWidth="90%"
              value={false}
              label={header.name}
              on:change={(e) => {
                if (e.detail.value == true) {
                  headersToSelect = headersToSelect.filter(
                    (h) => h.id != header.id
                  );
                  headersToShow = [...headersToShow, header];
                }
              }}
            />
          </div>
        {/each}
      {:else}
        <div class="headers-show grid-col-1">
          <span style="text-align: center;">No headers to add</span>
        </div>
      {/if}
      <div style="width: 100%; display: flex; justify-content: center;">
        <Button
          class="mr-3 mt-5"
          --button-width="70%"
          on:click={() => openHeaderDrawer = false}
        >
          Save preferences
        </Button>
      </div>
    </div>
  </Drawer>
</MediaQuery>
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

  .personalize-header {
    font-size: 20px;
    line-height: 28px;
    font-weight: 700;
    padding: 20px;
  }

  .headers-show {
    display: grid;
    gap: 12px;
    padding: 8px;
  }
</style>