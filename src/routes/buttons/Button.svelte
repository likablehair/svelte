<script lang="ts">
  import Button from '$lib/buttons/Button.svelte'
  import Icon from '$lib/media/Icon.svelte'
</script>

<div class="container">
  <div class="section">
    <Button 
      --color="white" 
      --background-color="#008080"
      --hover-background-color="#008f8f"
      --width="400px"
    >
      Click me
      <span slot="append" style="padding-right: 10px">
        <Icon name="mdi-account"></Icon>
      </span>
    </Button>
  </div>
  <div class="section">
    <Button 
      --color="#008080"
      --hover-background-color="#00808012"
      --padding="10px 20px 10px 20px"
      type="text"
    >
      Click me
    </Button>
  </div>
  <div class="section">
    <Button 
      --color="#008080"
      --hover-background-color="#00808012"
      type="icon"
      icon="mdi-account"
    ></Button>
  </div>
  <div class="section">
    <Button 
      --color="#008080"
      --hover-background-color="#00808012"
      type="icon"
      iconSize={25}
      icon="mdi-account"
    ></Button>
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
    margin-top: 15px;
  }
</style>
