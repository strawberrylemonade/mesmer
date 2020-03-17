import { WebClient } from '@slack/web-api';
const { IncomingWebhook } = require('@slack/webhook');
import { getEnvironmentById, updateEnvironment, getEnvironment } from './environment';

export const handleToken = async (environmentId: string, code: string) => {

  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;

  const result = await (new WebClient()).oauth.v2.access({
    client_id: clientId,
    client_secret: clientSecret,
    code
  }) as any;

  const environment = await getEnvironmentById(environmentId);
  await updateEnvironment(environment.project, environment.environmentId, { slack: result.incoming_webhook.url })
}

export const sendReportNotificationToEnvironment = async (projectId: string, environmentId: string, message: string, link: string) => {
  const environment = await getEnvironment(projectId, environmentId);
  const webhook = new IncomingWebhook(environment.slack);
  await webhook.send({
    text: message,
    attachments: [
      {
        fallback: `See the report at ${link}`,
        actions: [
          {
            type: 'button',
            text: 'Open report',
            url: link
          }
        ]
      }
    ]
  });
}