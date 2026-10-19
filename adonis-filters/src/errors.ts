/**
 * Filters the backend refuses: malformed JSON, an unknown operator, a column or table outside the
 * allowed ones, a raw condition. `status` 400 makes the AdonisJS exception handler answer
 * "400 Bad Request" instead of a 500.
 */
export class FilterError extends Error {
	readonly status = 400;
	readonly code = 'E_INVALID_FILTERS';

	constructor(message: string) {
		super(message);
		this.name = 'FilterError';
	}
}
