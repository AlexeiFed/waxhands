import { Pool } from 'pg';
declare const pool: Pool;
export declare const db: Pool;
export declare const testConnection: () => Promise<boolean>;
export declare const query: (text: string, params?: unknown[]) => Promise<import("pg").QueryResult<any>>;
export default pool;
//# sourceMappingURL=connection.d.ts.map