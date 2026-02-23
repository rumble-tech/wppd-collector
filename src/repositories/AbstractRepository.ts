import { TDatabase } from 'src/services/database/Types';

export default abstract class AbstractRepository {
    protected readonly db: TDatabase;

    protected constructor(db: TDatabase) {
        this.db = db;
    }
}
