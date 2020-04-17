import db from  './database-client';
import { Model, DataTypes } from 'sequelize';

import { MissingParameterError, DatabaseError, NotFoundError, CustomError } from '../helpers/errors';
import log from '../helpers/log';
import { syncOptions } from '../helpers/options';


export interface IProject {
  // Metadata
  id: string
  name: string
}

class Project extends Model {}

Project.init({
  id: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  sequelize: db,
  modelName: 'project'
})

Project.sync(syncOptions)
  .then(() => {
    console.log('[DEV] Successful table sync for "Project"');
  })
  .catch((err: Error) => {
    log(err);
    console.log('[DEV] Failed table sync for "Project"');
    process.exit(1);
  });

export const createProject = async (project: Partial<IProject>) => {

  if (!project.name) throw new MissingParameterError('name');
  if (!project.id) throw new MissingParameterError('id');

  try {
    const response = await Project.create(project);
    return response.toJSON();
  } catch (e) {
    log(e);
    throw new DatabaseError('Could not save this new project.')
  }
}

export const getProject = async (projectId: string) => {

  try {
    const project = await Project.findOne({ where: { id: projectId }})
    if(!project) throw new NotFoundError('This project does not exist.');
    return project.toJSON();  
  } catch (e) {
    log(e);
    // If it is a handled error (i.e. Not Found) just rethrow
    if(e instanceof CustomError) throw e;
    // Else throw a custom database error
    throw new DatabaseError('Could not get this project.')
  }

}

export const getProjects = async () => {
  try {
    const projects = await Project.findAll();
    return projects.map(res => res.toJSON()) as IProject[];
  } catch (e) {
    log(e);
    throw new DatabaseError('Could not get projects.')
  }
}

export const updateProject = async (projectId: string, candidateProject: Partial<IProject>) => {
  try {
    const project = await Project.findOne({ where: { id: projectId } })
    await project.update(candidateProject, { fields: ['name'] })
    return project.toJSON();
  } catch (e) {
    log(e);
    throw new DatabaseError('Could not update this project.')
  }
}

export const deleteProject = async (projectId: string) => {
  try {
    const project = await Project.findOne({ where: { id: projectId } })
    if(!project) throw new NotFoundError('This project does not exist.');
    return project.destroy();
  } catch (e) {
    log(e);
    if(e instanceof CustomError) throw e;
    throw new DatabaseError('Could not delete this project.')
  }
}