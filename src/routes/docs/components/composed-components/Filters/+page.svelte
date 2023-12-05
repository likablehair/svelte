<script lang="ts">
  import ComponentSubtitle from "../../../ComponentSubtitle.svelte";
  import PropsViewer from "../../PropsViewer.svelte";
  import Filters from "$lib/components/composed/search/Filters.svelte";
    import { filter } from "lodash";
    import Converter, { type Filter } from "$lib/utils/filters/filters";
    import type Builder from "$lib/utils/filters/builder";

  let filters: Filter[] = [
      {
        name:"customerName",
        label:"Customer Name",
        type:"string",
        column:"customerName",
        mode: 'ilike',
        advanced: false
      }, {
        name:"date",
        label:"Date dsadasdasdsdasdasdasdsadasdasdasd",
        type:"date",
        column:"date",
        mode: 'equal',
        advanced: true
      }, {
        name: "testNumber",
        label: "test number",
        type: "number",
        column: "testNumber",
        mode: 'greater',
        advanced: false
      }, {
        name: "testNumberAdvanced",
        label: "test number advanced",
        type: "number",
        column: "testNumberAdvanced",
        mode: 'greater',
        advanced: true
      }, {
        name: "testSelect",
        label: "test select dsadsadsadasdsadsadasdasda",
        type: "select",
        column: "testSelect",
        advanced: false,
        mode: "equal",
        items: [
          {
            value: 1,
            label: 'test 1dsadasdasdadadsadsadsadasdadasdasdasdasdadddads'
          },
          {
            value: 2,
            label: 'test 2ewqeqwewqeqwewqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq'
          },
          {
            value: 3,
            label: 'test 3ewqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqdasdasdsadsadsadsadadasqqqq'
          }
        ]
      }, {
        name: "testSelectAdvanced",
        label: "test select advanced",
        type: "select",
        column: "testSelectAdvanced",
        advanced: true,
        mode: "equal",
        items: [
          {
            value: 1,
            label: 'test 1'
          },
          {
            value: 2,
            label: 'test 2'
          },
          {
            value: 3,
            label: 'test 3'
          }, {
            value: 6,
            label: 'test 1'
          },
          {
            value: 7,
            label: 'test 2'
          },
          {
            value: 8,
            label: 'test 3'
          }, {
            value: 9,
            label: 'test 1'
          },
          {
            value: 10,
            label: 'test 2'
          },
          {
            value: 11,
            label: 'test 3'
          }
        ]
      }, {
        name: "testBool",
        label: "test bool",
        type: "bool",
        column: "testBool",
        mode: "equal",
        description: "include only if column is true"
      }
    ]

  function handleFilterEdit() {
    if(!!filters) {
      let converter = new Converter()
      let builder: Builder
      builder = converter.createBuilder({
        filters
      })
    }
  }
</script>

<h1>Filters</h1>
<ComponentSubtitle>Make it easy, make it filter.</ComponentSubtitle>
<h2>Example</h2>
<div class="example">
  <Filters
    lang="it"
    bind:filters
    on:applyFilter={handleFilterEdit}
  ></Filters>
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
</style>