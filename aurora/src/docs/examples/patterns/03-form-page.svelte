<!-- @component Form page
A long form split in sections: each section has a title and a line of explanation on the left and its fields on the right, and stacks on narrow screens. Fields are the library ones with `label`, `hint` and `state`; errors appear after the first submit. `ConfirmOrCancelButtons` closes the form, in a bar that stays at the bottom while scrolling. -->
<script lang="ts">
	import { ConfirmOrCancelButtons, DatePickerTextField, Select, SimpleTextField, Switch, Textarea } from '#lib';

	let salon = $state({
		name: 'Likable Milano',
		email: '',
		phone: '+39 02 1234 5678',
		timezone: 'Europe/Rome',
		opening: new Date(2019, 3, 1) as Date | undefined,
		description: '',
		onlineBooking: true,
		reminders: false
	});
	let submitted = $state(false);
	let saving = $state(false);

	const timezones = ['Europe/Rome', 'Europe/London', 'America/New_York'].map((value) => ({ value, label: value }));
	const emailError = $derived(submitted && !/^\S+@\S+\.\S+$/.test(salon.email));

	async function save() {
		submitted = true;
		if (emailError) return;
		saving = true;
		await new Promise((resolve) => setTimeout(resolve, 600));
		saving = false;
	}
</script>

<main class="page">
	<header>
		<h1>Salon settings</h1>
		<p>How the salon appears to clients and how bookings work.</p>
	</header>

	<form
		onsubmit={(event) => {
			event.preventDefault();
			save();
		}}
	>
		<section>
			<div class="about">
				<h2>Profile</h2>
				<p>Shown on the booking page and in the emails.</p>
			</div>
			<div class="fields">
				<SimpleTextField label="Name" bind:value={salon.name} required />
				<SimpleTextField
					label="Email"
					type="email"
					bind:value={salon.email}
					state={emailError ? 'error' : undefined}
					hint={emailError ? 'Enter a valid email address' : 'Replies to clients come from here'}
				/>
				<SimpleTextField label="Phone" type="tel" bind:value={salon.phone} />
				<Textarea label="Description" bind:value={salon.description} maxlength={280} counter autoGrow />
			</div>
		</section>

		<section>
			<div class="about">
				<h2>Calendar</h2>
				<p>Dates and times of the bookings follow these settings.</p>
			</div>
			<div class="fields">
				<Select label="Time zone" items={timezones} bind:value={salon.timezone} />
				<DatePickerTextField label="Opening date" bind:selectedDate={salon.opening} />
			</div>
		</section>

		<section>
			<div class="about">
				<h2>Bookings</h2>
				<p>What clients can do on their own.</p>
			</div>
			<div class="fields">
				<Switch label="Online booking" bind:checked={salon.onlineBooking} />
				<Switch label="Email reminder the day before" bind:checked={salon.reminders} />
			</div>
		</section>

		<div class="footer">
			<ConfirmOrCancelButtons confirmText="Save" confirmType="submit" loading={saving} />
		</div>
	</form>
</main>

<style>
	.page {
		display: grid;
		gap: 1.5rem;
		max-width: 60rem;
		padding: 1.5rem;
	}

	h1 {
		margin: 0;
		font-family: var(--global-font-family-display);
		font-size: 1.6rem;
		color: var(--global-color-text);
	}

	header p,
	.about p {
		margin: 0.25rem 0 0;
		color: var(--global-color-text-2);
	}

	form {
		border: var(--global-border-width) solid var(--global-color-border);
		border-radius: var(--global-radius-lg);
		background: var(--global-color-surface);
		box-shadow: var(--global-shadow-sm);
	}

	section {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
		gap: 1.5rem;
		padding: 1.5rem;
		border-bottom: var(--global-border-width) solid var(--global-color-border);
	}

	h2 {
		margin: 0;
		font-size: 0.95rem;
		color: var(--global-color-text);
	}

	.about p {
		font-size: 0.85rem;
	}

	.fields {
		display: grid;
		gap: 1rem;
	}

	.footer {
		position: sticky;
		bottom: 0;
		padding: 1rem 1.5rem;
		border-radius: 0 0 var(--global-radius-lg) var(--global-radius-lg);
		background: var(--global-color-surface-solid);
	}

	@media (width < 640px) {
		section {
			grid-template-columns: 1fr;
		}
	}
</style>
