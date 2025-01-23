<script lang="ts">
	import './Divider.css'
	export let weight = '1px',
		radius = '0.5px',
		marginTop: string | undefined = '10px',
		marginBottom: string | undefined = '10px',
		marginLeft: string | undefined = '5px',
		marginRight: string | undefined = '5px'
</script>

<div
	style:background-color={'var(--divider-color, var(--divider-default-color))'}
	style:border-radius={radius}
	style:height={weight}
	style:margin-top={marginTop}
	style:margin-bottom={marginBottom}
	style:margin-right={marginRight}
	style:margin-left={marginLeft}
/>
