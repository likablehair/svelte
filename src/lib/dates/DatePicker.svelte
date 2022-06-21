<script lang="ts">
    import { getMonthName, dateToString } from "./utils";

    import YearSelector from "./YearSelector.svelte";
    import MonthSelector from "./MonthSelector.svelte";
    import Calendar from "./Calendar.svelte";
    import Button from "$lib/buttons/Button.svelte";

    export let selectedYear: number = new Date().getFullYear(),
        selectedMonth: number = new Date().getMonth(),
        selectedDate: Date = new Date(),
        view: 'year'|'month'|'day' = 'day',
        primaryColor: string = "#008080",
        headerBackgroundColor: string = primaryColor,
        arrowColor: string = primaryColor,
        hoverColor: string = "#00808012",
        selectedDayColor: string = "black",
        headerColor: string = "white",
        cardColor: string = "black",
        cardBackGroundColor: string = "rgba(255,255,255,0)",
        height: string = "100%",
        width: string = "100%";

    let selectorText: string = undefined;
    let selectableYears: number[] = [...Array(150).keys()].map(
        (i) => i + (new Date().getFullYear() - 75)
    );
    let elementDisabled: 'year' | 'date' = 'date';

    $: visibleSelector = view == 'day' || view == 'month';
    $: {
        selectorText =
            view == 'day'
                ? getMonthName(selectedMonth) + " " + selectedYear
                : selectedYear.toString();
    }
    $: elementDisabled = view == 'year' ? 'year' : 'date';

    function next() {
        if (view == 'day') {
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
        if (view == 'day') {
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
        if (view == 'month')
            view = 'year';
        else
            view = 'month';
    }

    function handleYearChange() {
        view = "month";
    }

    function handleMonthChange() {
        view = "day";
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
            class:disabled="{elementDisabled == 'year'}"
            on:click={() => {
                view = 'year';
            }}>{selectedYear}</span
        >
        <h2
            class:disabled="{elementDisabled == 'date'}"
            on:click={() => {
                view = 'day';
            }}
        >
            {dateToString(selectedDate, 'dayAndMonth', 'it')}
        </h2>
    </div>
    <div class="body" style:height="75%">
        {#if visibleSelector}
            <div class="selector-row" style:height="25%">
                <div class="row-elem">
                    <Button
                        color={arrowColor}
                        hoverBackgroundColor={hoverColor}
                        type="icon"
                        iconSize={25}
                        icon="mdi-chevron-left"
                        on:click={previous}
                    />
                </div>
                <div class="row-elem selector">
                    {#key selectorText}
                        <div
                            on:click={SelectorHandler}
                            style:--primary-color={primaryColor}
                        >
                            {selectorText}
                        </div>
                    {/key}
                </div>
                <div class="row-elem">
                    <Button
                        color={arrowColor}
                        hoverBackgroundColor={hoverColor}
                        type="icon"
                        iconSize={25}
                        icon="mdi-chevron-right"
                        on:click={next}
                    />
                </div>
            </div>
        {/if}
        {#if view == 'month'}
            <MonthSelector
                height="75%"
                {width}
                bind:selectedMonth
                on:click={handleMonthChange}
            />
        {:else if view == 'year'}
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
                dayHoverColor={hoverColor}
                daySelectedColor={primaryColor}
                selectedTextColor={selectedDayColor}
            />
        {/if}
    </div>
</div>

<style>
    .container {
        border-radius: 5px;
    }
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
        color: var(--primary-color);
    }
    .disabled {
        pointer-events: none;
        opacity: 1 !important;
    }
</style>
