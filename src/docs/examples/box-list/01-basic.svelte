<!-- @component Sections
Entry points of a settings page: each box is a link with an icon, a label and a description. The grid puts as many columns as fit and becomes one column on a phone. -->
<script lang="ts">
	import { BoxList, type BoxListItem } from '#lib';
	import { mdiAccountGroupOutline, mdiBellOutline, mdiCreditCardOutline, mdiShieldLockOutline } from '@mdi/js';

	const boxes: BoxListItem[] = [
		{ name: 'team', label: 'Team', description: 'Members, roles and invitations', icon: mdiAccountGroupOutline, href: '#team' },
		{ name: 'billing', label: 'Billing', description: 'Plan, invoices and payment method', icon: mdiCreditCardOutline, href: '#billing' },
		{ name: 'notifications', label: 'Notifications', description: 'Emails and push messages', icon: mdiBellOutline, href: '#notifications' },
		{ name: 'security', label: 'Security', description: 'Password, two-factor login and sessions', icon: mdiShieldLockOutline, href: '#security' }
	];
</script>

<div class="demo">
	<BoxList {boxes} aria-label="Settings" />
</div>

<style>
	.demo {
		width: min(100%, 760px);
	}
</style>
