<script context="module" lang="ts">
  export type TimeLineItem = {
    name: string;
    title?: string;
    description?: string;
    imageUrl?: string;
    from?: Date;
    to?: Date;
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    data?: any;
  };
</script>

<script lang="ts">
  import { dateToString } from "$lib/dates/utils";

  export let items: TimeLineItem[] = [],
    singleSided = false,
    height: string | undefined = undefined,
    width: string | undefined = undefined,
    itemMarginTop = "15px",
    itemMarginBottom = "0px",
    firstItemMarginTop = "5px",
    lastItemMarginBottom = "5px",
    circleColor = "black",
    circleDiameter = "15px",
    timesWidth: string | undefined = undefined,
    circleAlignment: "top" | "center" | "bottom" = "top";

  $: cssVariables = Object.entries({
    "-divider-width": "48px",
    "-central-line-left": singleSided
      ? `calc(var(--simple-timeline-divider-width)/2)`
      : "calc(50% - 1px)",
    "-body-width": singleSided
      ? `calc(100% - var(--simple-timeline-divider-width))`
      : `calc(50% - var(--simple-timeline-divider-width) / 2)`,
  })
    .filter(([key]) => key.startsWith("-"))
    .reduce((css, [key, value]) => {
      return `${css}--simple-timeline${key}: ${value};`;
    }, "");
</script>

<div style:height style:width style={cssVariables} class="container">
  {#each items as item, index}
    <div
      style:margin-top={index == 0 ? firstItemMarginTop : itemMarginTop}
      style:margin-bottom={index == items.length - 1
        ? lastItemMarginBottom
        : itemMarginBottom}
      style:flex-direction={singleSided || index % 2 == 0
        ? "row-reverse"
        : "row"}
      class="time-line-item"
    >
      <div
        style:flex-direction={singleSided || index % 2 == 0
          ? "row"
          : "row-reverse"}
        style:justify-content={"flex-start"}
        class="time-line-body"
      >
        <slot
          name="item"
          {item}
          alignment={!singleSided && index % 2 == 0 ? "right" : "left"}
        >
          {#if !!item.from || !!item.to || $$slots.times}
            <div
              style:padding={singleSided || index % 2 == 0
                ? "0px 20px 0px 0px"
                : "0px 0px 0px 20px"}
              style:width={timesWidth}
              class="time-line-times"
            >
              <slot name="times" {item} {dateToString}>
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
              </slot>
            </div>
          {/if}
          <div class="time-line-infos">
            <slot
              name="infos"
              {item}
              alignment={!singleSided && index % 2 == 0 ? "right" : "left"}
            >
              {#if !!item.title}
                <div
                  style:text-align={singleSided || index % 2 == 0
                    ? "left"
                    : "right"}
                  class="time-line-title"
                >
                  {item.title}
                </div>
              {/if}
              {#if !!item.description}
                <div
                  style:text-align={singleSided || index % 2 == 0
                    ? "left"
                    : "right"}
                  class="time-line-description"
                >
                  {item.description}
                </div>
              {/if}
              <slot
                name="infos-append"
                {item}
                alignment={!singleSided && index % 2 == 0 ? "right" : "left"}
              />
            </slot>
          </div>
        </slot>
      </div>
      <div style:align-items={circleAlignment} class="time-line-divider">
        <slot name="circle" {item}>
          <div
            style="margin-top: 5px;"
            style:background-color={circleColor}
            style:height={circleDiameter}
            style:width={circleDiameter}
            style:z-index="5"
            class="circle"
          />
        </slot>
      </div>
    </div>
  {/each}
</div>

<style>
  .container {
    position: relative;
  }

  .container::before {
    position: absolute;
    left: var(--simple-timeline-central-line-left);
    right: auto;
    top: 0;
    bottom: 0;
    height: 100%;
    background: #6767678f;
    content: "";
    width: 2px;
  }

  .time-line-times {
    flex: none;
  }

  .circle {
    border-radius: 50%;
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
    width: var(--simple-timeline-body-width);
    display: flex;
  }

  .time-line-divider {
    width: var(--simple-timeline-divider-width);
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
