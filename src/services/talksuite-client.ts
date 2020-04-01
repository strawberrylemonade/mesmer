import got from 'got';
import FormData from 'form-data';
import { ProcessError } from '../helpers/errors';
import log from '../helpers/log';
import { DepGraph } from 'dependency-graph';
import { resolve } from 'path';
import { readdir, readJSON } from 'fs-extra';

export const getTokenForTalksuite = async (username: string, password: string) => {
  const clientId = process.env['TS_CLIENT_ID'];
  const tenantId = process.env['TS_TENANT_ID'];

  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  formData.append('grant_type', 'password');
  formData.append('scope', `openid ${clientId}`);
  formData.append('client_id', clientId);
  formData.append('response_type', 'token id_token');

  const response = await got(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token?p=B2C_1_ROPC_Auth`, {
    method: 'POST',
    body: formData
  });
  const token = JSON.parse(response.body);
  return token;
}

export const getOrganisations = async (token: string) => {
  try {
    const baseUrl = process.env['TS_BASEURL'];
    const response = await got(`https://${baseUrl}/api/profile`, { headers: { 'Authorization': token, 'Content-Type': 'application/json'}});
    const profile = JSON.parse(response.body);
    return profile.memberships.filter((membership: any) => membership.author);
  } catch (e) {
    if (e.response?.statusCode === 400) {
      const message = JSON.parse(e.response?.body)?.errors?.[0].title;
      throw new ProcessError(message);
    }
    throw new ProcessError(e.message);
  }
}

export const getBots = async (token: string, orgId: string) => {
  try {
    const baseUrl = process.env['TS_BASEURL'];
    const response = await got(`https://${baseUrl}/api/bots`, { headers: { 'Authorization': token, 'Content-Type': 'application/json', 'organisation-id': orgId}});
    const bots = JSON.parse(response.body);
    return bots.data;
  } catch (e) {
    if (e.response?.statusCode === 400) {
      const message = JSON.parse(e.response?.body)?.errors?.[0].title;
      throw new ProcessError(message);
    }
    throw new ProcessError(e.message);
  }
}

export const getBot = async (token: string, orgId: string, botId: string) => {
  try {
    const baseUrl = process.env['TS_BASEURL'];
    const response = await got(`https://${baseUrl}/api/bots/${botId}`, { headers: { 'Authorization': token, 'Content-Type': 'application/json', 'organisation-id': orgId}});
    const bot = JSON.parse(response.body);
    const eTag = response.headers['ETag'];
    return [bot.data, eTag, bot.links];
  } catch (e) {
    if (e.response?.statusCode === 400) {
      const message = JSON.parse(e.response?.body)?.errors?.[0].title;
      throw new ProcessError(message);
    }
    throw new ProcessError(e.message);
  }
}

export const saveBot = async (token: string, orgId: string, botId: string, candidate: any, eTag: string) => {
  try {
    const baseUrl = process.env['TS_BASEURL'];
    const response = await got(`https://${baseUrl}/api/bots/${botId}`, { method: 'PUT', body: JSON.stringify({ data: candidate }), headers: { 'Authorization': token, 'Content-Type': 'application/json', 'organisation-id': orgId, 'If-Match': eTag }})
    return JSON.parse(response.body);
  } catch (e) {
    if (e.response?.statusCode === 400) {
      const message = JSON.parse(e.response?.body)?.errors?.[0].title;
      throw new ProcessError(message);
    }
    throw new ProcessError(e.message);
  }
}

interface Constant {
  value: string
  name: string
}

export const addConstantsToBot = async (token: string, orgId: string, botId: string, constants: Constant[]) => {
  try {
    const [data, eTag] = await getBot(token, orgId, botId);
    const filteredExistingConstants = data.attributes.constants.filter((existingConstant: Constant) => (
      !constants.reduce<boolean>((needsToBeRemoved: boolean, constant: Constant) => ( needsToBeRemoved ? needsToBeRemoved : constant.name === existingConstant.name ), false)
    ))
    data.attributes.constants = [...filteredExistingConstants, ...constants];
    return await saveBot(token, orgId, botId, data, eTag)
  } catch (e) {
    if (e.response?.statusCode === 400) {
      const message = JSON.parse(e.response?.body)?.errors?.[0].title;
      throw new ProcessError(message);
    }
    throw new ProcessError(e.message);
  }
}

export const importDialogues = async (token: string, orgId: string, version: string) => {

  const path = resolve(__dirname, '../dialogues', version);
  const files = await readdir(path);
  const dialogues = await Promise.all(files.map(file => readJSON(resolve(path, file))));

  const orderedDialogues = findImportOrder(dialogues);
  for (let dialogue of orderedDialogues) {
    await exports.createDialogue(token, orgId, dialogue);
  }
}

export const createProject = async (token: string, orgId: string, name: string) => {
  const baseUrl = process.env['TS_BASEURL'];
  try {
      let response = await got(`https://${baseUrl}/api/projects`, { method: 'POST', body: JSON.stringify({ data: { name } }), headers: { 'Authorization': token, 'Content-Type': 'application/json', 'organisation-id': orgId }})
      return JSON.parse(response.body);
  } catch (e) {
    if (e.response?.statusCode === 400) {
      const message = JSON.parse(e.response?.body)?.errors?.[0].title;
      throw new ProcessError(message);
    }
    throw new ProcessError(e.message);
  }
}

export const createDialogue = async (token: string, orgId: string, dialogue: any) => {
  const baseUrl = process.env['TS_BASEURL'];
  try {
    let response = await got(`https://${baseUrl}/api/dialogues`, { method: 'POST', body: JSON.stringify({ data: { attributes: { json: JSON.stringify(dialogue) }, projectId: 'global' } }), headers: { 'Authorization': token, 'Content-Type': 'application/json', 'organisation-id': orgId }})
    return JSON.parse(response.body);
  } catch (e) {
    if (e.response?.statusCode === 400) {
      const message = JSON.parse(e.response?.body)?.errors?.[0].title;
      throw new ProcessError(message);
    }
    throw new ProcessError(e.message);
  }
}

export const findImportOrder = function (dialogues: any[]) {
  let graph = new DepGraph();
  let dialogueMap: {[key: string]: any} = {};
  dialogues.forEach(dialogue => {
    dialogueMap[dialogue.id] = dialogue.id;
    graph.addNode(dialogue.id);
    graph.setNodeData(dialogue.id, dialogue);
  });

  dialogues.forEach(dialogue => {
    let nodes = dialogue.nodes;
    let id = dialogue.id;
    //case sensitive... james laughed at me for this solution rather than fixing the case sensitive nature so i'm shipping it
    let dialogueNodes = nodes.filter((node: any) => node.type.includes('ialogue'));
    dialogueNodes.forEach((node: any) => {
      try {
        graph.addDependency(id, dialogueMap[node.dialogueId]);
      } catch (error) {
        log(new ProcessError('The dialogue "' + dialogue.id + '" references a dialogue "' + node.dialogueId + '" which does not exist in the current system'));
      }
    });
  });

  let order = graph.overallOrder().map(node => {
    return graph.getNodeData(node);
  });

  return order;
};