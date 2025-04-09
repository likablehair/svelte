<script module lang="ts">
  export type TimeLineItem<Data = any> = {
    name: string;
    title?: string;
    description?: string;
    imageUrl?: string;
    from?: Date;
    to?: Date;
    data?: Data;
  };
</script>

<script lang="ts" generics="Data">
  import { dateToString } from "$lib/components/simple/dates/utils";
  import type { Snippet } from "svelte";
  import "../../../css/main.css";
  import "./SimpleTimeLine.css";

  type TimeLineItemData = TimeLineItem<Data>
  interface Props {
    items: TimeLineItemData[];
    singleSided?: boolean;
    circleAlignment?: "top" | "center" | "bottom";
    itemSnippet?: Snippet<[{
      item: TimeLineItemData
      alignment: 'left' | 'right'
    }]>
    timesSnippet?: Snippet<[{
      item: TimeLineItemData
      dateToString: typeof dateToString
    }]>
    infosSnippet?: Snippet<[{
      item: TimeLineItemData
      alignment: 'left' | 'right'
    }]>
    infosAppendSnippet?: Snippet<[{
      item: TimeLineItemData
      alignment: 'left' | 'right'
    }]>
    circleSnippet?: Snippet<[{
      item: TimeLineItemData
    }]>
  }

  let {
    items = [],
    singleSided = false,
    circleAlignment = "top",
    circleSnippet,
    infosAppendSnippet,
    infosSnippet,
    itemSnippet,
    timesSnippet,
  }: Props = $props();
</script>

<div
  style:--simple-time-line-divider-width="48px"
  style:--simple-time-line-central-line-left={singleSided
    ? `calc(var(--simple-time-line-divider-width)/2)`
    : "calc(50% - 0.5px)"}
  style:--simple-time-line-body-width={singleSided
    ? `calc(100% - var(--simple-time-line-divider-width))`
    : `calc(50% - var(--simple-time-line-divider-width) / 2)`}
  class="container"
>
  {#each items as item, index}
    <div
      style:flex-direction={singleSided || index % 2 == 0
        ? "row-reverse"
        : "row"}
      class="time-line-item"
    >
      <div
        style:flex-direction={singleSided || index % 2 == 0
          ? "row"
          : "row-reverse"}
        class="time-line-body"
      >
        {#if itemSnippet}
          {@render itemSnippet({ item, alignment: !singleSided && index % 2 == 0 ? "right" : "left" })}
        {:else}
          {#if !!item.from || !!item.to || timesSnippet}
            <div
              style:padding={singleSided || index % 2 == 0
                ? "0px 20px 0px 0px"
                : "0px 0px 0px 20px"}
              class="time-line-times"
            >
              {#if timesSnippet}
                {@render timesSnippet({ item, dateToString })}
              {:else}
                <div
                  class:vertical-centered-container={circleAlignment ==
                    "center"}
                  class:vertical-bottom-container={circleAlignment == "bottom"}
                >
                  {#if !!item.from}
                    <div
                      style:text-align={singleSided || index % 2 == 0
                        ? "left"
                        : "right"}
                      style="font-weight: 200; font-size: 9pt"
                    >
                      {dateToString(item.from)}
                    </div>
                  {/if}
                  {#if !!item.to}
                    <div
                      style:text-align={singleSided || index % 2 == 0
                        ? "left"
                        : "right"}
                      style="font-weight: 200; font-size: 9pt"
                    >
                      {dateToString(item.to)}
                    </div>
                  {/if}
                </div>
              {/if}
            </div>
          {/if}
          <div
            class="time-line-infos"
            style:text-align={singleSided || index % 2 == 0 ? "left" : "right"}
          >
            {#if infosSnippet}
              {@render infosSnippet({ item, alignment: !singleSided && index % 2 == 0 ? "right" : "left"})}
            {:else}
              {#if !!item.title}
                <div class="time-line-title">
                  {item.title}
                </div>
              {/if}
              {#if !!item.description}
                <div class="time-line-description">
                  {item.description}
                </div>
              {/if}
              {@render infosAppendSnippet?.({ item, alignment: !singleSided && index % 2 == 0 ? "right" : "left"})}
            {/if}
          </div>
        {/if}
      </div>
      <div style:align-items={circleAlignment} class="time-line-divider">
        {#if circleSnippet}
          {@render circleSnippet({ item })}
        {:else}
          <div class="circle"></div>
        {/if}
      </div>
    </div>
  {/each}
</div>

<style>
  .container {
    position: relative;
    height: var(
      --simple-time-line-height,
      var(--simple-time-line-default-height)
    );
    width: var(--simple-time-line-width, var(--simple-time-line-default-width));
    display: flex;
    flex-direction: column;
    gap: var(--simple-time-line-gap, var(--simple-time-line-default-gap));
  }

  .container::before {
    position: absolute;
    left: var(--simple-time-line-central-line-left);
    right: auto;
    top: 0;
    bottom: 0;
    height: 100%;
    background: var(
      --simple-time-line-line-background,
      var(--simple-time-line-default-line-background)
    );
    content: "";
    width: var(
      --simple-time-line-line-width,
      var(--simple-time-line-default-line-width)
    );
  }

  .time-line-times {
    flex: none;
  }

  .circle {
    border-radius: 9999px;
    height: var(
      --simple-time-line-circle-height,
      var(--simple-time-line-default-circle-height)
    );
    width: var(
      --simple-time-line-circle-width,
      var(--simple-time-line-default-circle-width)
    );
    background-color: var(
      --simple-time-line-circle-background-color,
      var(--simple-time-line-default-circle-background-color)
    );
    z-index: 5;
    margin-top: 4px;
  }

  .time-line-item {
    display: flex;
  }

  .time-line-title {
    font-size: 16pt;
    font-weight: 700;
  }

  .time-line-description {
    margin-top: 10px;
    font-size: 10pt;
    font-weight: 400;
  }

  .time-line-body {
    width: var(--simple-time-line-body-width);
    justify-content: flex-start;
    display: flex;
  }

  .time-line-divider {
    width: var(--simple-time-line-divider-width);
    display: flex;
    justify-content: center;
  }

  .vertical-centered-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 100%;
  }

  .vertical-bottom-container {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    height: 100%;
  }
</style>
