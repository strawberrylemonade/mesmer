import db from  './database-client';
import { Model, DataTypes } from 'sequelize';

import { MissingParameterError, DatabaseError, NotFoundError, CustomError } from '../helpers/errors';
import log from '../helpers/log';
import { syncOptions } from '../helpers/options';
import { getProject } from './project';

interface IEnvironment {
  // Parent information
  project: string

  // Metadata
  id: Number
  name: string
}

class Environment extends Model {}

Environment.init({
  id: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true
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
  if (!environment.id) throw new MissingParameterError('id');

  // Confirm that project exists
  await getProject(projectId); // Throws a NotFoundError
  environment.project = projectId;

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
    const environments = await Environment.findAll({ where: { project: projectId }})
    return environments.map(res => res.toJSON());
  } catch (e) {
    log(e);
    throw new DatabaseError('Could not get environments.')
  }
}

export const getEnvironment = async (projectId: string, environmentId: string) => {
  try {
    const environment = await Environment.findOne({ where: { project: projectId, id: environmentId }})
    if(!environment) throw new NotFoundError('This environment does not exist.');
    return environment.toJSON();
  } catch (e) {
    log(e);
    // If it is a handled error (i.e. Not Found) just rethrow
    if(e instanceof CustomError) throw e;
    // Else throw a custom database error
  }
}

export const updateEnvironment = async (projectId: string, environmentId: string, candidateEnvironment: Partial<IEnvironment>) => {
  try {
    const project = await Environment.findOne({ where: { project: projectId, id: environmentId } })
    await project.update(candidateEnvironment, { fields: ['name', 'connection'] })
    return project.toJSON();
  } catch (e) {
    log(e);
    throw new DatabaseError('Could not update this project.')
  }
}