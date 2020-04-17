import db from  './database-client';
import { Model, DataTypes } from 'sequelize';

import { MissingParameterError, DatabaseError, NotFoundError, CustomError } from '../helpers/errors';
import log from '../helpers/log';
import { syncOptions } from '../helpers/options';
import { getProject } from './project';

export interface IEnvironment {
  // Parent information
  project: string

  // Metadata
  id: string
  environmentId: string
  name: string
  connection: string
  tests?: string[]
  slack?: string
}

class Environment extends Model {}

Environment.init({
  id: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true
  },
  environmentId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  project: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  connection: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tests: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true
  },
  slack: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  sequelize: db,
  modelName: 'environment'
})

Environment.sync(syncOptions)
  .then(() => {
    console.log('[DEV] Successful table sync for "Environment"', syncOptions);
  })
  .catch((err: Error) => {
    log(err);
    console.log('[DEV] Failed table sync for "Environment"');
    process.exit(1);
  });

export const createEnvironment = async (projectId: string, environment: Partial<IEnvironment>) => {

  if (!projectId) throw new MissingParameterError('projectId');
  if (!environment.name) throw new MissingParameterError('name');
  if (!environment.environmentId) throw new MissingParameterError('environmentId');

  // Confirm that project exists
  await getProject(projectId); // Throws a NotFoundError
  environment.project = projectId;
  environment.id = `${projectId}-${environment.environmentId}`

  try {
    const response = await Environment.create(environment);
    return response.toJSON();
  } catch (e) {
    log(e);
    throw new DatabaseError('Could not save this new environment.')
  }
}

export const getEnvironments = async (projectId: string) => {
  try {
    const environments = await Environment.findAll({ where: { project: projectId }, order: [['createdAt', 'ASC']]})
    return environments.map(res => res.toJSON()) as IEnvironment[];
  } catch (e) {
    log(e);
    throw new DatabaseError('Could not get environments.')
  }
}

export const getEnvironment = async (projectId: string, environmentId: string): Promise<IEnvironment> => {
  try {
    const environment = await Environment.findOne({ where: { project: projectId, environmentId: environmentId }})
    if(!environment) throw new NotFoundError('This environment does not exist.');
    return environment.toJSON() as IEnvironment;
  } catch (e) {
    log(e);
    // If it is a handled error (i.e. Not Found) just rethrow
    if(e instanceof CustomError) throw e;
    // Else throw a custom database error
  }
}

export const getEnvironmentById = async (id: string): Promise<IEnvironment> => {
  try {
    const environment = await Environment.findOne({ where: { id }})
    if(!environment) throw new NotFoundError('This environment does not exist.');
    return environment.toJSON() as IEnvironment;
  } catch (e) {
    log(e);
    // If it is a handled error (i.e. Not Found) just rethrow
    if(e instanceof CustomError) throw e;
    // Else throw a custom database error
  }
}

export const updateEnvironment = async (projectId: string, environmentId: string, candidateEnvironment: Partial<IEnvironment>) => {
  try {
    const environment = await Environment.findOne({ where: { project: projectId, environmentId: environmentId } })
    await environment.update(candidateEnvironment, { fields: ['name', 'connection', 'tests', 'slack'] })
    return environment.toJSON();
  } catch (e) {
    log(e);
    throw new DatabaseError('Could not update this project.')
  }
}

export const deleteEnvironment = async (projectId: string, environmentId: string) => {
  try {
    const environment = await Environment.findOne({ where: { project: projectId, environmentId: environmentId } })
    if(!environment) throw new NotFoundError('This environment does not exist.');
    await environment.destroy()
  } catch (e) {
    log(e);
    throw new DatabaseError('Could not update this project.')
  }
}