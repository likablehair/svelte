<script lang="ts">
  import Button from '$lib/buttons/Button.svelte'
  import Icon from '$lib/media/Icon.svelte'
</script>

<div class="flex flex-col justify-center h-screen items-center">
  <div class="m-3">
    <Button 
      --color="white" 
      --background-color="#008080"
      --hover-background-color="#008f8f"
      --width="400px"
    >
      Click me
      <span slot="append" class="pr-2">
        <Icon name="mdi-account"></Icon>
      </span>
    </Button>
  </div>
  <div class="m-3">
    <Button 
      --color="#008080"
      --hover-background-color="#00808012"
      --padding="10px 20px 10px 20px"
      type="text"
    >
      Click me
    </Button>
  </div>
  <div class="m-3">
    <Button 
      --color="#008080"
      --hover-background-color="#00808012"
      type="icon"
      icon="mdi-account"
    ></Button>
  </div>
  <div class="m-3">
    <Button 
      --color="#008080"
      --hover-background-color="#00808012"
      type="icon"
      iconSize={25}
      icon="mdi-account"
    ></Button>
  </div>
</div>
