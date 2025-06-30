import { TDatabase, TPluginsTable } from 'src/components/database/Types';

export default class PluginRepository {
    private db: TDatabase;
    private pluginsTable: TPluginsTable;

    constructor(db: TDatabase, pluginsTable: TPluginsTable) {
        this.db = db;
        this.pluginsTable = pluginsTable;
    }
}
