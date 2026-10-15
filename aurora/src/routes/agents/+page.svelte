<script lang="ts">
	import Article from '../../docs/Article.svelte';
	import { AGENTS_INTRO, AGENTS_SECTIONS, AGENTS_TITLE } from '../../docs/agents.js';
</script>

<Article title={AGENTS_TITLE} intro={AGENTS_INTRO} markdown="/agents.md" sections={AGENTS_SECTIONS} />
