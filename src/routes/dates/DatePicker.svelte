<script lang="ts">
    import DatePicker from "$lib/dates/DatePicker.svelte";
    import { dateToString } from "$lib/dates/utils";

    let selectedDate: Date = new Date();
</script>

<div class="card-container">
    <DatePicker
        height="400px"
        width="300px"
        bind:selectedDate
        selectedDayColor = "white"
    />
    <div style:display="flex">
        <div>
            <b>selectedDate:</b>
            {dateToString(selectedDate, 'dayAndMonth', 'en')}
        </div>
    </div>
</div>

<style>
    .card-container {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        height: 100vh;
        width: 100vw;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
    }
    .card-container > div {
        margin-top: 100px;
    }
</style>
