<!-- @component Inside text
The link is inline: it takes the font size of the text around it, so it can sit inside a sentence. -->
<script lang="ts">
	import { LinkButton } from '#lib';
</script>

<p>
	Your plan renews on 1 November. You can <LinkButton href="#billing">change the payment method</LinkButton>
	or <LinkButton href="#cancel">cancel the renewal</LinkButton> at any time.
</p>

<style>
	p {
		max-width: 46ch;
		margin: 0;
		line-height: 1.7;
	}
</style>
