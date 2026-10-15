import { json } from '@sveltejs/kit';
import { searchIndex } from '../../docs/search.server.js';

export function GET() {
	return json(searchIndex());
}
