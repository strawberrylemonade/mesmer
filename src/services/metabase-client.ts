import got, { Headers } from 'got';
import { NotFoundError } from '../helpers/errors';

export const get = async (path: string, sessionId?: string) => {
  const headers: Headers = { 'Content-Type': 'application/json' };
  if (sessionId) headers['X-Metabase-Session'] = sessionId;
  try {
    const response = await got(`https://${process.env['MB_BASEURL']}/api${path}`, 
      { headers: headers });
    return JSON.parse(response.body);
  } catch (e) {

  }
}

export const post = async (path: string, body: {[key: string]: any}, sessionId?: string) => {
  const headers: Headers = { 'Content-Type': 'application/json' };
  if (sessionId) headers['X-Metabase-Session'] = sessionId;
  try {
    const response = await got(`https://${process.env['MB_BASEURL']}/api${path}`, 
      { headers: headers, body: JSON.stringify(body) });
    return JSON.parse(response.body);
  } catch (e) {

  }
}

export const put = async (path: string, body: {[key: string]: any}, sessionId?: string) => {
  const headers: Headers = { 'Content-Type': 'application/json' };
  if (sessionId) headers['X-Metabase-Session'] = sessionId;
  try {
    const response = await got(`https://${process.env['MB_BASEURL']}/api${path}`, 
      { headers: headers, body: JSON.stringify(body) });
    return JSON.parse(response.body);
  } catch (e) {

  }
}

interface Collection {
  id: number
  slug: string
  name: string
  description?: string
}

export const createCollectionIfNotExists = async (sessionId: string, name: string, description?: string, parentId?: number) => {
  try {
    const collections: Collection[] = await get('/collection/root/items', sessionId);
    const [collection] = collections.filter(collection => collection.name === name)
    if (!collection) throw new NotFoundError('This collection does not exist.');
    return collection;
  } catch (e) {
    if (!(e instanceof NotFoundError)) throw e;
    return await post('/api/collections', { name, description, color: '509EE3', parent_id: parentId }, sessionId);
  }
}

export const createNewDashboard = async (collectionId: number, name: string, description: string, sessionId: string) => {
  return await post('/api/dashboard', { name, description, collection_id: collectionId }, sessionId);
}

export const createNewQuestion = async (collectionId: number, name: string, description: string, sessionId: string) => {
  return await post('/api/dashboard', { name, description, collection_id: collectionId }, sessionId);
}

export const assignQuestionToDashboard = async (collectionId: number, name: string, description: string, sessionId: string) => {
  return await post('/api/dashboard', { name, description, collection_id: collectionId }, sessionId);
}