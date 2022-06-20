<script lang="ts">
    import { monthNames, dayNames } from "./utils";

    import YearSelector from "./YearSelector.svelte";
    import MonthSelector from "./MonthSelector.svelte";
    import Calendar from "./Calendar.svelte";
    import Button from "$lib/buttons/Button.svelte";

    export let selectedYear: number = new Date().getFullYear(),
        selectedMonth: number = new Date().getMonth(),
        selectedDate: Date = new Date(),
        componentOpened: number = 0,
        headerBackgroundColor: string = "#008080",
        headerColor: string = "white",
        cardColor: string = "black",
        cardBackGroundColor: string = "rgba(255,255,255,0)",
        height: string = "100%",
        width: string = "100%";

    let selectorText: string = undefined;
    let selectableYears: number[] = [...Array(150).keys()].map(
        (i) => i + (new Date().getFullYear() - 75)
    );
    let elementDisabled: number = 0;

    $: visibleSelector = componentOpened < 2;
    $: {
        selectorText =
            componentOpened == 0
                ? monthNames[selectedMonth] + " " + selectedYear
                : selectedYear.toString();
    }
    $: elementDisabled = componentOpened == 2 ? 1 : 0;

    function next() {
        if (componentOpened == 0) {
            if (selectedMonth == 11) {
                selectedMonth = 0;
                selectedYear += 1;
            } else {
                selectedMonth += 1;
            }
        } else {
            if (selectedYear != selectableYears[selectableYears.length-1])
                selectedYear++;
        }
    }

    function previous() {
        if (componentOpened == 0) {
            if (selectedMonth == 0) {
                selectedMonth = 11;
                selectedYear -= 1;
            } else {
                selectedMonth -= 1;
            }
        } else {
            if (selectedYear != selectableYears[0])
                selectedYear--;
        }
    }

    function SelectorHandler() {
        componentOpened++;
    }

    function handleYearChange() {
        componentOpened = 1;
    }

    function handleMonthChange() {
        componentOpened = 0;
    }
</script>

<div
    class="container"
    style:background={cardBackGroundColor}
    style:color={cardColor}
    style:height
    style:width
>
    <div
        class="header"
        style:height="25%"
        style:background={headerBackgroundColor}
        style:color={headerColor}
    >
        <span
            class:disabled="{elementDisabled == 1}"
            on:click={() => {
                componentOpened = 2;
            }}>{selectedYear}</span
        >
        <h2
            class:disabled="{elementDisabled == 0}"
            on:click={() => {
                componentOpened = 0;
            }}
        >
            {dayNames[selectedDate.getDay()] + ", " + monthNames[selectedDate.getUTCMonth()] + " " + selectedDate.getDate()}
        </h2>
    </div>
    <div class="body" style:height="75%">
        {#if visibleSelector}
            <div class="selector-row" style:height="25%">
                <div class="row-elem">
                    <Button
                        color="#008080"
                        hoverBackgroundColor="#00808012"
                        type="icon"
                        iconSize={25}
                        icon="mdi-chevron-left"
                        on:click={previous}
                    />
                </div>
                <div class="row-elem selector">
                    {#key selectorText}
                        <div on:click={SelectorHandler}>
                            {selectorText}
                        </div>
                    {/key}
                </div>
                <div class="row-elem">
                    <Button
                        color="#008080"
                        hoverBackgroundColor="#00808012"
                        type="icon"
                        iconSize={25}
                        icon="mdi-chevron-right"
                        on:click={next}
                    />
                </div>
            </div>
        {/if}
        {#if componentOpened == 1}
            <MonthSelector
                height="75%"
                {width}
                bind:selectedMonth
                on:click={handleMonthChange}
            />
        {:else if componentOpened == 2}
            <YearSelector
                height="100%"
                {width}
                bind:selectedYear
                {selectableYears}
                on:click={handleYearChange}
            />
        {:else}
            <Calendar
                height="75%"
                {width}
                bind:visibleMonth={selectedMonth}
                bind:visibleYear={selectedYear}
                bind:selectedDate={selectedDate}
            />
        {/if}
    </div>
</div>

<style>
    .header {
        border-radius: 5px 5px 0 0;
    }
    .header > h2 {
        margin-left: 30px;
        transition: 0.1s;
        opacity: 0.8;
    }
    .header > h2:hover {
        opacity: 1;
        cursor: pointer;
    }
    .header > span {
        display: inline-block;
        line-height: 100%;
        margin-left: 15px;
        margin-top: 10px;
        opacity: 0.8;
        transition: 0.1s;
    }
    .header > span:hover {
        opacity: 1;
        cursor: pointer;
    }
    .selector-row {
        display: flex;
        justify-content: space-between;
        line-height: 100%;
    }
    .row-elem {
        margin: auto;
    }
    .selector {
        width: 50%;
        text-align: center;
    }
    .selector > div {
        transition: 0.1s;
    }
    .selector > div:hover {
        cursor: pointer;
        color: #008080;
    }
    .disabled {
        pointer-events: none;
        opacity: 1 !important;
    }
</style>
