<script lang="ts">
	import './Divider.css'
	interface Props {
    weight?: string;
    radius?: string;
    marginTop?: string;
    marginBottom?: string;
    marginLeft?: string;
    marginRight?: string;
  }

  let {
    weight = '1px',
    radius = '0.5px',
    marginTop = '10px',
    marginBottom = '10px',
    marginLeft = '5px',
    marginRight = '5px',
  }: Props = $props();
</script>

<div
	style:background-color={'var(--divider-color, var(--divider-default-color))'}
	style:border-radius={radius}
	style:height={weight}
	style:margin-top={marginTop}
	style:margin-bottom={marginBottom}
	style:margin-right={marginRight}
	style:margin-left={marginLeft}
></div>
