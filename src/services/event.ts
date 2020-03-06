import db from  './database-client';
import { Model, DataTypes } from 'sequelize';

import { MissingParameterError, DatabaseError } from '../helpers/errors';
import { syncOptions } from '../helpers/options';
import log from '../helpers/log';

interface IEvent {
  // Parent information
  project: string
  environment: string

  // Metadata
  id: Number,
  name: string
  originalTimestamp: string
  debugSession?: string

  // User Identity
  anonId: string
  userId?: string

  // Additional context
  context?: {[key: string]: string}
}

class Event extends Model {}

Event.init({
  project: {
    type: DataTypes.STRING,
    allowNull: false
  },
  environment: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  originalTimestamp: {
    type: DataTypes.STRING,
    allowNull: false
  },
  debugSession: {
    type: DataTypes.STRING,
    allowNull: true
  },
  anonId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  context: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  sequelize: db,
  modelName: 'event'
});

Event.sync(syncOptions)
  .then(() => {
    console.log('[DEV] Successful table sync for "Event"');
  })
  .catch((err: Error) => {
    console.log('[DEV] Failed table sync for "Event"');
    console.error(err);
    process.exit(1);
  });

export const createEvent = async (projectId: string, environmentId: string, event: Partial<IEvent>) => {

  if (!environmentId) throw new MissingParameterError('environment');
  if (!projectId) throw new MissingParameterError('project');

  event.environment = environmentId;
  event.project = projectId;

  if (!event.name) throw new MissingParameterError('name');
  if (!event.anonId) throw new MissingParameterError('anonId');
  if (!event.originalTimestamp) throw new MissingParameterError('originalTimestamp');

  try {
    const response = await Event.create(event);
    return response.toJSON();  
  } catch (e) {
    log(e);
    throw new DatabaseError('Could not save this event.');
  }
}

export const getEventsByDebugSession = async (projectId: string, environmentId: string, debugId: string) => {
  try {
    const events = await Event.findAll({ where: { project: projectId, environment: environmentId, debugSession: debugId }});
    return events.map(res => res.toJSON());
  } catch (e) {
    log(e);
    throw new DatabaseError('Could not get this events.');
  }
}