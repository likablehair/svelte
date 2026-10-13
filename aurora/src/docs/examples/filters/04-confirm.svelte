<!-- @component Confirm before applying, in Italian
With `confirm` the card and the panel work on a draft with Cancel and Apply, as in v4. `locale="it"` is enough for Italian: it picks every text of the library (operators, periods, placeholders, the lists and the calendar included) and the format of dates and numbers; `labels` changes only the texts you pass. The field labels are the app's own. -->
<script lang="ts">
	import { Filters, createFilters } from '#lib';
	import { italianFields } from './fields.js';

	let value = $state(createFilters());
</script>

<Filters fields={italianFields} bind:value confirm locale="it" />
