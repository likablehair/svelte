import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { create, insertMultiple, search } from '@orama/orama'
import componentsDatabase from './components.database';
import themingDatabase from './theming.database';

const db = await create({
  schema: {
    title: 'string',
    description: 'string',
    status: 'string',
    type: 'string',
    url: 'string'
  }
})

await insertMultiple(db, componentsDatabase)
await insertMultiple(db, themingDatabase)

export const GET = (async ({ url }) => {
  let searchText = url.searchParams.get('text')
  if(!searchText) throw error(500, 'search text is not provided')
  let limit = url.searchParams.get('limit')

  let searchResults = await search(db, {
    term: searchText,
    // tolerance: 1,
    properties: ['title', 'description'],
    limit: Number(limit) || 5
  })

  const results = searchResults.hits.map((el) => ({
    title: el.document.title,
    description: el.document.description,
    status: el.document.status,
    url: el.document.url,
    name: el.id
  }));

  return json(results);
}) satisfies RequestHandler;