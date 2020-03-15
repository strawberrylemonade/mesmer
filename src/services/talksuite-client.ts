import got from 'got';
import FormData from 'form-data';

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
  const baseUrl = process.env['TS_BASEURL'];
  const response = await got(`${baseUrl}/profile`, { headers: { 'Authorization': token, 'Content-Type': 'application/json'}});
  const profile = JSON.parse(response.body);
  return profile.memberships.filter((membership: any) => membership.author);
}

export const getBots = async (token: string, orgId: string) => {
  const baseUrl = process.env['TS_BASEURL'];
  const response = await got(`${baseUrl}/bots`, { headers: { 'Authorization': token, 'Content-Type': 'application/json', 'organisation-id': orgId}});
  const bots = JSON.parse(response.body);
  return bots.data;
}

export const getBot = async (token: string, orgId: string, botId: string) => {
  const baseUrl = process.env['TS_BASEURL'];
  const response = await got(`${baseUrl}/bots/${botId}`, { headers: { 'Authorization': token, 'Content-Type': 'application/json', 'organisation-id': orgId}});
  const bot = JSON.parse(response.body);
  return bot.data;
}