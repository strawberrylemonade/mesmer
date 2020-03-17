import db from  './database-client';
import { Model, DataTypes, Op } from 'sequelize';
import { v4 } from 'uuid';

import { ITest } from './test';
import { MissingParameterError, DatabaseError, NotFoundError, CustomError } from '../helpers/errors';
import log from '../helpers/log';
import { syncOptions } from '../helpers/options';
import { getEventsByDebugSession, IEvent } from './event';


enum ReportStatus {
  Good = 'Good',
  Poor = 'Poor',
  Bad = 'Bad'
}

export interface IStepReport {
  name: string
  duration: number
  started: Date
  ended: Date
  status: ReportStatus
  comment: string
}


export interface IReport {
  // Parent information
  project: string
  environment: string
  test: (string | ITest)

  // Metadata
  id: string
  debugSession: string
  status: ReportStatus
  duration: number
  steps: StepReport[]

  events?: IEvent[]
}

class Report extends Model {}

Report.init({
  id: {
    type: DataTypes.STRING,
    allowNull: false,
    primaryKey: true
  },
  environment: {
    type: DataTypes.STRING,
    allowNull: false
  },
  project: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false
  },
  duration: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  steps: {
    type: DataTypes.JSON,
    allowNull: false
  },
  debugSession: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  sequelize: db,
  modelName: 'report'
})

Report.sync(syncOptions)
  .then(() => {
    console.log('[DEV] Successful table sync for "Report"');
  })
  .catch((err: Error) => {
    log(err);
    console.log('[DEV] Failed table sync for "Report"');
    process.exit(1);
  });

export class TestReport implements IReport {
  project: string
  environment: string
  
  id: string
  debugSession: string
  test: ITest
  duration: number
  status: ReportStatus
  steps: StepReport[]

  private startedAt: Date

  constructor(projectId: string, environmentId: string, test: ITest, debugSession: string) {
    this.id = v4();
    this.project = projectId;
    this.environment = environmentId;
    this.test = test;
    this.debugSession = debugSession;
    this.steps = [];
  }

  start() {
    this.startedAt = new Date();
  }

  stop() {
    this.duration = (new Date().getTime() - this.startedAt.getTime()) / 1000;
    if (this.duration < this.test.targetDuration) {
      this.status = ReportStatus.Good;
    } else if (this.duration > this.test.targetDuration && this.duration < this.test.maxDuration) {
      this.status = ReportStatus.Poor;
    } else {
      this.status = ReportStatus.Bad;
    }
  }

  addStep(stepReport: StepReport) {
    this.steps.push(stepReport);
  }

  toJSON(): IReport {
    return {
      id: this.id,
      environment: this.environment,
      project: this.project,
      test: this.test.id,
      status: this.status,
      duration: this.duration,
      steps: this.steps,
      debugSession: this.debugSession
    }
  }

  async create() {
    const response = await Report.create(this.toJSON());
    return response.toJSON();
  }
}

export class StepReport implements IStepReport {
  name: string
  duration: number
  started: Date
  ended: Date
  status: ReportStatus
  comment: string

  constructor(name: string) {
    this.name = name;
  }

  start() {
    this.started = new Date();
  }

  stop(error?: Error) {
    this.ended = new Date()
    this.duration = (this.ended.getTime() - this.started.getTime()) / 1000;
    
    if (error) {
      this.status = ReportStatus.Bad
      this.comment = error.message
    }
  }
}

export const getReport = async (projectId: string, environmentId: string, reportId: string) => {
  if (!environmentId) throw new MissingParameterError('environment');
  if (!projectId) throw new MissingParameterError('project');
  if (!reportId) throw new MissingParameterError('reportId');

  const response = await Report.findOne({ where: { environment: environmentId, project: projectId, id: reportId }});
  if(!response) throw new NotFoundError('This report does not exist.');
  const report =  response.toJSON() as IReport;

  const events = await getEventsByDebugSession(projectId, environmentId, report.debugSession) as IEvent[];
  report.events = events.reverse();
  return report;
}

export const getRecentReport = async (projectId: string, environmentId: string) => {
  if (!environmentId) throw new MissingParameterError('environment');
  if (!projectId) throw new MissingParameterError('project');

  const response = await Report.findOne({ where: { environment: environmentId, project: projectId } });
  if(!response) throw new NotFoundError('This report does not exist.');
  return response.toJSON() as IReport;
}

export const getRecentReports = async (projectId: string, environmentId: string) => {
  if (!environmentId) throw new MissingParameterError('environment');
  if (!projectId) throw new MissingParameterError('project');

  const response = await Report.findAll({ where: { environment: environmentId, project: projectId, createdAt: { [Op.lt]: new Date(), [Op.gt]: new Date().setTime(new Date().getTime() - 24 * 60 * 60 * 1000) }}, limit: 40 });
  if(!response) throw new NotFoundError('These reports do not exist.');
  return response.map(res => res.toJSON()).reverse() as IReport[];
}