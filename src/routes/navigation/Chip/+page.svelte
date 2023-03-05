<script lang="ts">
  import Switch from "$lib/forms/Switch.svelte";
  import Chip from "$lib/navigation/Chip.svelte";

  let openFilter = false;

  function handleClick() {
    console.log("click");
  }

  function handleClose() {
    console.log("close");
  }
</script>

<div class="container">
  <span> Closable </span>
  <div class="section">
    <Chip
      close
      on:click={handleClick}
      on:close={handleClose}
      color="rgba(0,0,0,0.2)"
      textColor="rgba(0,0,0,0.8)"
    >
      chipchop
    </Chip>

    <Chip close on:click={handleClick} on:close={handleClose} color="#F44336">
      chipchop
    </Chip>

    <Chip
      close
      outlined
      on:click={handleClick}
      on:close={handleClose}
      color="#7CB342"
    >
      chipchop
    </Chip>

    <Chip
      close
      outlined
      label
      on:click={handleClick}
      on:close={handleClose}
      color="#FF8F00"
    >
      chipchop
    </Chip>
  </div>

  <span>Filter</span>
  <Switch bind:value={openFilter} />
  <div class="section">
    <Chip
      filter={openFilter}
      label
      on:click={handleClick}
      on:close={handleClose}
      color="rgba(0,0,0,0.1)"
      textColor="rgba(0,0,0,0.8)"
    >
      chipchop
    </Chip>
    <Chip
      filter={openFilter}
      filterIcon="mdi-plus"
      on:click={handleClick}
      on:close={handleClose}
      color="rgba(0,0,0,0.1)"
      textColor="rgba(0,0,0,0.8)"
    >
      chipchop
    </Chip>
    <Chip
      filter={openFilter}
      filterIcon="mdi-minus"
      on:click={handleClick}
      on:close={handleClose}
      color="rgba(0,0,0,0.1)"
      textColor="rgba(0,0,0,0.8)"
    >
      chipchop
    </Chip>
  </div>
  <span>Label</span>
  <div class="section">
    <Chip
      label
      on:click={handleClick}
      on:close={handleClose}
      color="rgba(0,0,0,0.1)"
      textColor="rgba(0,0,0,0.8)"
    >
      chipchop
    </Chip>
    <Chip
      label
      filter
      close
      disabled
      filterIcon="mdi-tag"
      on:click={handleClick}
      on:close={handleClose}
      color="#E91E63"
    >
      chipchop
    </Chip>
    <Chip
      label
      outlined
      filter
      filterIcon="mdi-account"
      on:click={handleClick}
      on:close={handleClose}
      color="#5C6BC0"
    >
      chipchop
    </Chip>
    <Chip
      label
      close
      filter
      filterIcon="mdi-twitter"
      on:click={handleClick}
      on:close={handleClose}
      color="#4DD0E1"
    >
      chipchop
    </Chip>
  </div>
  <span>Size</span>
  <div class="section">
    <Chip
      size={8}
      close
      on:click={handleClick}
      on:close={handleClose}
      color="rgba(0,0,0,0.1)"
      textColor="rgba(0,0,0,0.8)"
    >
      size 8
    </Chip>
    <Chip
      size={10}
      close
      on:click={handleClick}
      on:close={handleClose}
      color="rgba(0,0,0,0.1)"
      textColor="rgba(0,0,0,0.8)"
    >
      size 10
    </Chip>
    <Chip
      close
      on:click={handleClick}
      on:close={handleClose}
      color="rgba(0,0,0,0.1)"
      textColor="rgba(0,0,0,0.8)"
    >
      default
    </Chip>
    <Chip
      size={15}
      close
      on:click={handleClick}
      on:close={handleClose}
      color="rgba(0,0,0,0.1)"
      textColor="rgba(0,0,0,0.8)"
    >
      size 15
    </Chip>
  </div>
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100vh;
  }
  .section {
    width: 1000px;
    margin-top: 50px;
    margin-bottom: 50px;
    display: flex;
    justify-content: space-evenly;
  }
</style>
