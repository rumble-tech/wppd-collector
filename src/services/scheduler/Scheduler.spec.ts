import { Job, scheduleJob } from 'node-schedule';
import Logger from 'src/services/logger/Logger';
import Scheduler from './Scheduler';

jest.mock('node-schedule');

const mockedScheduleJob = scheduleJob as jest.MockedFunction<typeof scheduleJob>;

describe('Scheduler', () => {
    let scheduler: Scheduler;
    let mockLogger: jest.Mocked<Logger>;

    beforeEach(() => {
        // @ts-ignore
        Scheduler.instance = undefined;

        mockLogger = new Logger({ level: 'silly', directory: process.cwd() + '/logger' }) as jest.Mocked<Logger>;

        mockLogger.info = jest.fn();
        mockLogger.warn = jest.fn();
        mockLogger.error = jest.fn();
        mockLogger.debug = jest.fn();
        mockLogger.silly = jest.fn();

        scheduler = Scheduler.getInstance(mockLogger);
    });

    describe('Scheduler.getInstance', () => {
        it('should return a singleton instance of Scheduler', () => {
            const otherInstance = Scheduler.getInstance(mockLogger);

            expect(otherInstance).toBe(scheduler);
        });
    });

    describe('Scheduler.addTask', () => {
        it('should add a new task successfully', () => {
            const taskName = 'test-task';
            const rule = '0 * * * *';
            const callback = jest.fn();

            mockedScheduleJob.mockReturnValue({ name: taskName } as Job);

            const result = scheduler.addTask(taskName, rule, callback);

            expect(result).toBe(true);
            expect(mockedScheduleJob).toHaveBeenCalledWith(taskName, rule, callback);
            expect(mockLogger.info).toHaveBeenCalledWith(`Task "${taskName}" scheduled successfully.`);
        });

        it('should not add a task if it already exists', () => {
            const taskName = 'test-task';
            const rule = '0 * * * *';
            const callback = jest.fn();

            scheduler.addTask(taskName, rule, callback);
            const result = scheduler.addTask(taskName, rule, callback);

            expect(result).toBe(false);
            expect(mockLogger.warn).toHaveBeenCalledWith(
                `Task with name "${taskName}" already exists. Skipping addition.`
            );
        });
    });
});
