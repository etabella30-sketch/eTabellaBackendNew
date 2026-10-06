/**
 * @app/rt-features/code-tables: the code-table lookup (`public.et_combo_codemaster`), one implementation for coreapi
 * `common/getcode`, realtime-server `issue/dynamiccombo` and the venue box's /coreapi relay (plan Phase 10, D12).
 * Hosts import this folder alias, never the lib root.
 */
export * from './dto/code-table.query';
export * from './code-tables.operations';
export * from './code-tables.service';
export * from './http/code-tables.controllers';
export * from './http/legacy-shapes';
export * from './http/code-tables.http.modules';
