<!-- @component Empty
Without items the timeline shows a small empty state; `empty` changes its text and `emptySnippet` replaces it. -->
<script lang="ts">
	import { Timeline } from '#lib';
</script>

<Timeline items={[]} empty="No activity on this ticket yet" />
