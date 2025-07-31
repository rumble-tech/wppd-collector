import { scheduleJob, Job } from 'node-schedule';
import { LoggerInterface } from './logger/LoggerInterface';
import Scheduler from './Scheduler';

jest.mock('node-schedule');

const mockedScheduleJob = scheduleJob as jest.MockedFunction<typeof scheduleJob>;

describe('Scheduler', () => {
    let scheduler: Scheduler;
    let mockLogger: jest.Mocked<LoggerInterface>;

    beforeEach(() => {
        // @ts-ignore
        Scheduler.instance = undefined;

        mockLogger = {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
            silly: jest.fn(),
        };

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
