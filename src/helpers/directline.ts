//@ts-ignore
import xhr2 from 'xhr2';
import ws from 'ws';

//@ts-ignore
global.XMLHttpRequest = xhr2;
//@ts-ignore
global.WebSocket = ws;

import { DirectLine, Message, Activity, EventActivity } from 'botframework-directlinejs';
import got from 'got';

import log from './log';
import { BadRequestError } from './errors';
import { createDebugSession } from '../services/debug';

interface IDiscovery {
  botId: string
  organisationId: string
  directLine: {
    tokenEndpoint: string
  }
  webApp: {
    constants: {[key: string]: string}
  }
}

interface ITSConversation {
  id: string
  directLine: {
    conversationId: string
    token: string
    expires_in: number
    streamUrl: string
    referenceGrammarId: string
  }
}

export const createConversation = async (discovery: IDiscovery) => {

  try {
    const response = await got(discovery.directLine.tokenEndpoint, { method: 'POST' });
    const tsConversation = JSON.parse(response.body) as ITSConversation;
    const conversation = new DirectLine({ token: tsConversation.directLine.token });
    return conversation;
  } catch (e) {
    log(e);
    throw new BadRequestError('Cannot connection to talksuitre, potentially corrupted discovery information.')
  }
}

export const resolveDiscovery = async (connection: string) => {

  try {
    const response = await got(connection);
    return JSON.parse(response.body);
  } catch (e) {
    log(e);
    throw new BadRequestError('Cannot connection to discovery, potentially invalid connection information.')
  }
}

export const sendMessage = async (conversation: DirectLine, message: string): Promise<string> => {

  const activity: Message = {
    type: 'message',
    from: {
      id: 'automaton',
      name: 'An Automated User',
      role: 'user'
    },
    text: message
  }

  const id = await conversation.postActivity(activity).toPromise();
  return id;
}
export const waitForResponse = (conversation: DirectLine, messageId: string) => {
  const maxTimout = 30000;
  
  return new Promise((resolve, reject) => {
    
    const subscription = conversation.activity$
    // @ts-ignore
    .filter(activity => activity.type === 'message' && activity.replyToId === messageId)
    .subscribe(
      (message) => {
        subscription.unsubscribe();
        resolve(message as Message);
      }
    );

    setInterval(() => {
      if (subscription.closed) { return }
      subscription.unsubscribe();
      reject(new BadRequestError(`The response didn't come or took longer than the max timeout: ${maxTimout}`));
    }, maxTimout);
  });
}

export const endConversation = async () => { }
export const setUpDebugSession = async (conversation: DirectLine, projectId: string, environmentId: string) => {
  const debugSession = await createDebugSession(projectId, environmentId);

  const activity: EventActivity = {
    type: 'event',
    name: 'setUpDebugSession',
    value: debugSession,
    from: {
      id: 'automaton',
      name: 'An Automated User',
      role: 'user'
    },
  }

  await conversation.postActivity(activity).toPromise();
  return debugSession;
}