<script lang="ts" generics="Item extends {[key: string]: any}, Data">
  import { Button, Divider, Drawer, Icon, MediaQuery, Switch, VerticalDraggableList } from "$lib";
  import type { ComponentProps, Snippet } from "svelte";
  import { flip } from "svelte/animate";
  import { quintOut } from "svelte/easing";
  import { crossfade } from "svelte/transition";
  import EnhancedPaginatedTable from "../list/EnhancedPaginatedTable.svelte";
  
  interface Props {
    drawerProps?: Omit<ComponentProps<typeof Drawer>, 'open'>
    open?: boolean,
    lang: 'en' | 'it',
    availableHeaders: ComponentProps<typeof EnhancedPaginatedTable<Item, Data>>['headers'],
    headersToShow: ComponentProps<typeof EnhancedPaginatedTable<Item, Data>>['headers'],
    onsaveHeadersToShow?: (event: {
      detail: {
        headersToShow: ComponentProps<typeof EnhancedPaginatedTable<Item, Data>>['headers'];
      }
    }) => void
    itemSnippet?: ComponentProps<typeof VerticalDraggableList>['itemSnippet']
    headersToAddSnippet?: Snippet<[{ header: ComponentProps<typeof EnhancedPaginatedTable<Item, Data>>['headers'][number] }]>
    contentSnippet?: Snippet<[]>
  }

  let {
    drawerProps,
    open = $bindable(),
    lang,
    availableHeaders,
    headersToShow = $bindable(),
    onsaveHeadersToShow,
    itemSnippet: internalItemSnippet,
    headersToAddSnippet,
    contentSnippet,
  }: Props = $props()

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

  function saveHeadersToShow() {
    onsaveHeadersToShow?.({
      detail: {
        headersToShow,
      }
    })

    open = false;
  }
</script>

<MediaQuery>
  {#snippet defaultSnippet({ sAndDown })}
    <Drawer
      {...drawerProps}
      bind:open
      _space={drawerProps?._space || sAndDown ? "60vh" : "400px"}
      position={drawerProps?.position || sAndDown ? "bottom" : "right"}
    >
      {#if contentSnippet}
        {@render contentSnippet()}
      {:else}
        <div class="drawer-container">
          <div class="personalize-header">{lang == 'en' ? 'Personalize your headers' : 'Personalizza le tue intestazioni'}</div>
          
          <div class="drawer-content">
            <span class="headers-show">{lang == 'en' ? 'Headers shown in table' : 'Intestazioni visualizzate in tabella'}</span>
  
            {#if headersToShow}
              <VerticalDraggableList
                items={headersToShow.map((e) => {
                  return {
                    ...e,
                    id: e.value,
                    name: e.label,
                  }
                })}
                onchangeOrder={(e) => {
                  let newHeaders: typeof headersToShow = []
                  for(let i = 0; i < e.detail.items.length; i += 1) {
                    let item = headersToShow.find(hts => hts.value === e.detail.items[i].id)
                    if(!!item) {
                      newHeaders.push(item)
                    }
                  }
                  headersToShow = newHeaders;
                }}
              >
                {#snippet itemSnippet({ item })}
                  {#if internalItemSnippet}
                    {@render internalItemSnippet({ item })}
                  {:else}
                    <div
                      style:display=flex
                    >
                      <div
                        style:flex-grow=1
                      >
                        {#if !!item.icon}
                          <Icon name={item.icon} />
                        {/if}
                        {item.name}
                      </div>
                      <div
                        style:display=flex
                        style:min-width=50px
                        style:justify-content=end
                      >
                        <Switch
                          --switch-label-width="90%"
                          value={headersToShow.find((h) => h.value == item.id) != undefined}
                          onchange={(e) => {
                            if (e.detail.value == false) {
                              headersToShow = headersToShow.filter((h) => h.value != item.id);
                              availableHeaders = [...availableHeaders, item];
                            }
                          }}
                        />
                      </div>
                    </div>
                  {/if}
                {/snippet}
              </VerticalDraggableList>
            {/if}
  
            <Divider --divider-color=rgb(var(--global-color-contrast-100) />
  
            <span class="headers-show">{lang == 'en' ? 'Available headers' : 'Intestazioni disponibili'}</span>
  
            {#if availableHeaders && availableHeaders.length > 0}
              {#each availableHeaders as header (header.value)}
                <div
                  animate:flip
                  in:receive={{ key: header }}
                  out:send={{ key: header }}
                >
                  {#if headersToAddSnippet}
                    {@render headersToAddSnippet({ header })}
                  {:else}
                    <div
                      class="headers-show"
                    >
                      <div
                        style:display=flex
                      >
                        <div
                          style:flex-grow=1
                        >
                          {#if !!header.icon}
                            <Icon name={header.icon} />
                          {/if}
                          {header.label}
                        </div>
                        <div
                          style:display=flex
                          style:min-width=50px
                          style:justify-content=end
                        >
                          <Switch
                            --switch-label-width="90%"
                            value={false}
                            onchange={(e) => {
                              if (e.detail.value == true) {
                                availableHeaders = availableHeaders.filter(
                                  (h) => h.value != header.value
                                );
                                headersToShow = [...headersToShow, header];
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  {/if}
                </div>
              {/each}
            {:else}
              <div class="headers-show">
                <span style="text-align: center;">{lang == 'en' ? 'No headers available' : 'Nessuna intestazione da aggiungere'}</span>
              </div>
            {/if}
          </div>
  
          <Divider --divider-color=rgb(var(--global-color-contrast-100) />

          <div class="drawer-footer">
            <Button
              --button-width="100%"
              --button-height=25px
              onclick={saveHeadersToShow}
            >
              {lang == 'en' ? 'Save preferences' : 'Salva preferenze'}
            </Button>
          </div>
        </div>
      {/if}
    </Drawer>
  {/snippet}
</MediaQuery>

<style>
  .drawer-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .personalize-header {
    font-size: 20px;
    line-height: 28px;
    font-weight: 700;
    padding: 20px 20px 0px 20px;
    flex-shrink: 0;
  }

  .drawer-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }

  .drawer-footer {
    display: flex;
    flex-shrink: 0;
    padding: 10px 20px 20px;
  }

  .headers-show {
    display: grid;
    gap: 12px;
    padding: 8px;
  }
</style>