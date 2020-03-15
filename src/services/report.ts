import db from  './database-client';
import { Model, DataTypes } from 'sequelize';
import { ITest } from './test';

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
}

export class Report implements IReport {
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
}
