<script lang="ts">
  import SelectableVerticalList from "$lib/components/simple/lists/SelectableVerticalList.svelte";

  let selectedName: string | undefined = undefined,
    focusedName: string | undefined = undefined

  function handleSelect(event: CustomEvent) {
    selectedName = event.detail.element.name
  }

  function handleFocus(event: CustomEvent) {
    focusedName = event.detail.element.name
  }
</script>

<div
  style:height="100vh"
  style:width="100vw"
  style:display="flex"
  style:align-items="center"
  style:justify-content="center"
  style:flex-direction="column"
>
  <div
    style:box-shadow="0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)"
  >
    <SelectableVerticalList
      activeKeyboard={true}
      on:select={handleSelect}
      on:focus={handleFocus}
      maxWidth="26rem"
      elements={[
        {
          title: 'Ciao',
          name: 'ciao',
          description: 'Io sono una descrizione'
        }, {
          title: 'Bella',
          name: 'bella',
          description: 'Io sono un\'altra descrizione un po\' più lunga'
        }, {
          title: 'Bella li',
          name: 'bellali',
          description: 'Io sono un\'altra descrizione un po\' più lunga di quella prima per vedere come viene fuori'
        }
      ]}
    ></SelectableVerticalList>
  </div>
  <div style:margin-top="15px">hai selezionato: {selectedName}</div>
  <div style:margin-top="15px">hai evidenziato: {focusedName}</div>
</div>
