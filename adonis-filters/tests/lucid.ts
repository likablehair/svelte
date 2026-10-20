import { AppFactory } from '@adonisjs/core/factories/app';
import { EmitterFactory } from '@adonisjs/core/factories/events';
import { LoggerFactory } from '@adonisjs/core/factories/logger';
import { Database } from '@adonisjs/lucid/database';

export function createDatabase() {
	const app = new AppFactory().create(new URL('./', import.meta.url), () => {});
	return new Database(
		{ connection: 'pg', connections: { pg: { client: 'pg', connection: { host: 'localhost', database: 'filters' } } } },
		new LoggerFactory().create(),
		new EmitterFactory().create(app)
	);
}
