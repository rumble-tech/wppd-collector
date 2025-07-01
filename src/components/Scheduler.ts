import { Job, RecurrenceRule, RecurrenceSpecDateRange, RecurrenceSpecObjLit, scheduleJob } from 'node-schedule';
import Logger from 'src/components/Logger';

export default class Scheduler {
    private static instance: Scheduler;

    private tasks: Map<string, Job>;
    private logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger;
        this.tasks = new Map<string, Job>();
    }

    public static getInstance(logger: Logger): Scheduler {
        if (!Scheduler.instance) {
            Scheduler.instance = new Scheduler(logger);
        }

        return Scheduler.instance;
    }

    public addTask(name: string, rule: RecurrenceRule | RecurrenceSpecDateRange | RecurrenceSpecObjLit | string | Date, callback: () => void): boolean {
        if (this.tasks.has(name)) {
            this.logger.app.warn(`Task with name "${name}" already exists. Skipping addition.`);
            return false;
        }

        const job = scheduleJob(name, rule, callback);
        this.tasks.set(name, job);

        this.logger.app.info(`Task "${name}" scheduled successfully.`);

        return true;
    }
}
