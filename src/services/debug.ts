import db from  './database-client';
import { Model, DataTypes, UUIDV4 } from 'sequelize';
import { generate } from 'randomstring';
import { v4 } from 'uuid';

import { MissingParameterError, DatabaseError, NotFoundError, CustomError } from '../helpers/errors';
import log from '../helpers/log';
import { syncOptions } from '../helpers/options';
import { getEventsByDebugSession } from './event';

export interface IDebug {
  // Metadata
  project: string
  environment: string
  id: string
  code: string
  events?: object[]
}

class Debug extends Model {}

Debug.init({
  id: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false
  },
  project: {
    type: DataTypes.STRING,
    allowNull: false
  },
  environment: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  sequelize: db,
  modelName: 'debug'
})

Debug.sync(syncOptions)
  .then(() => {
    console.log('[DEV] Successful table sync for "Debug"');
  })
  .catch((err: Error) => {
    log(err);
    console.log('[DEV] Failed table sync for "Debug"');
    process.exit(1);
  });

export const createDebugSession = async (projectId: string, environmentId: string) => {

  if (!environmentId) throw new MissingParameterError('environment');
  if (!projectId) throw new MissingParameterError('project');
  
  const id = v4()
  const code = generate({ length: 6, charset: '2346789BCDFGHJKMPQRTVWXY' })

  const response = await Debug.create({ id, code, project: projectId, environment: environmentId })
  return response.toJSON() as IDebug;

}

export const getDebugSession = async (projectId: string, environmentId: string, debugId: string) => {
  if (!environmentId) throw new MissingParameterError('environment');
  if (!projectId) throw new MissingParameterError('project');
  if (!debugId) throw new MissingParameterError('debugId');

  const debugSession = await Debug.findOne({ where: { environment: environmentId, project: projectId, id: debugId }});
  if(!debugSession) throw new NotFoundError('This debug session does not exist.');
  const session = debugSession.toJSON() as IDebug;

  const events = await getEventsByDebugSession(projectId, environmentId, debugId);
  session.events = events.reverse();
  return session;
}

export const getDebugSessionByCode = async (projectId: string, environmentId: string, code: string) => {

  if (!environmentId) throw new MissingParameterError('environment');
  if (!projectId) throw new MissingParameterError('project');
  if (!code) throw new MissingParameterError('code');

  const debugSession = await Debug.findOne({ where: { environment: environmentId, project: projectId, code }});
  if(!debugSession) throw new NotFoundError('This debug session does not exist.');
  const session = debugSession.toJSON() as IDebug;
  return session;

}