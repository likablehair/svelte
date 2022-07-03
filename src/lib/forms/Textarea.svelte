<script lang="ts">
  type VariantOptions = 'outlined' | 'boxed'

  export let label: string = "label",
    width: string = "100%",
    height: string = "100%";

    import { v4 as uuidv4 } from 'uuid';

    let textAreaId: string = uuidv4(),
      focused: boolean = false;

</script>

<div
  style:width={width}
  style:height={height}
  class="container"
>
  <label for={textAreaId}>{label}</label>
  <textarea
    style:width="100%"
    style:height="100%"
  ></textarea>
</div>


<style>
</style>