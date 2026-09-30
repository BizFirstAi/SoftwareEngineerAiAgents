-- ============================================================================
-- Agentic Testing Nodes — Elasticsearch — Phase 2 build script (combined chained workflow)
-- ============================================================================
-- Builds ONE workflow chaining all 10 elasticsearch operations built individually in Phase 1
-- (build-phase1-isolated-workflows.sql) into a single sequential execution: a realistic index/
-- document lifecycle exercised end-to-end in one click, per ..\..\globals.md's "Phase 2" — built only
-- after every Phase 1 case runs in isolation, never before/in parallel.
--
-- RUN AGAINST: sqlcmd -S .\SQLEXPRESS -d data-ocean-platform-prod -E -C -i <this file>
-- Same technique as Phase 1's script (see its header comment for the full explanation) — the only
-- difference is that every ES element's success/main output chains into the next ES element's main
-- input (instead of each being wired to its own separate trigger), via a WHILE-loop cursor.
--
-- RESULT AS RUN 2026-08-23:
--   ProcessID=1066  ProcessThreadID=1064  ProcessThreadVersionID=1062  TriggerElementID=2293
--   Step  1 index-create      ProcessElementID=2294  ConnectionID=1278
--   Step  2 document-create   ProcessElementID=2295  ConnectionID=1279
--   Step  3 document-get      ProcessElementID=2296  ConnectionID=1280
--   Step  4 document-search   ProcessElementID=2297  ConnectionID=1281
--   Step  5 document-update   ProcessElementID=2298  ConnectionID=1282
--   Step  6 document-getMany  ProcessElementID=2299  ConnectionID=1283
--   Step  7 index-get         ProcessElementID=2300  ConnectionID=1284
--   Step  8 index-getMany     ProcessElementID=2301  ConnectionID=1285
--   Step  9 document-delete   ProcessElementID=2302  ConnectionID=1286
--   Step 10 index-delete      ProcessElementID=2303  ConnectionID=1287
-- See ..\resource.md and ..\testround\r1\results.md for how this is used/verified.
--
-- CAUTION: re-running this script as-is creates a SECOND combined workflow (INSERT, not idempotent).
-- ============================================================================

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET NOCOUNT ON;

-- Phase 2: ONE combined workflow chaining all 10 elasticsearch features in a realistic sequence:
-- trigger -> index-create -> document-create -> document-get -> document-search -> document-update
--         -> document-getMany -> index-get -> index-getMany -> document-delete -> index-delete

DECLARE @Step TABLE (Seq INT IDENTITY(1,1), FeatureCode NVARCHAR(60), Config NVARCHAR(MAX));

INSERT INTO @Step (FeatureCode, Config) VALUES
('index-create',      N'{"resource":"index","operation":"create","host":"https://localhost:9200","username":"elastic","password":"PLACEHOLDER_NOT_A_REAL_CREDENTIAL","allowInsecure":true,"indexName":"agentic-testing-nodes-elasticsearch-20260823","mappings":{"properties":{"title":{"type":"text"}}},"settings":{"number_of_shards":1}}'),
('document-create',   N'{"resource":"document","operation":"create","host":"https://localhost:9200","username":"elastic","password":"PLACEHOLDER_NOT_A_REAL_CREDENTIAL","allowInsecure":true,"indexName":"agentic-testing-nodes-elasticsearch-20260823","fields":{"title":"Agentic Testing Doc","body":"created by agentic-testing-nodes phase 2"}}'),
('document-get',      N'{"resource":"document","operation":"get","host":"https://localhost:9200","username":"elastic","password":"PLACEHOLDER_NOT_A_REAL_CREDENTIAL","allowInsecure":true,"indexName":"agentic-testing-nodes-elasticsearch-20260823","documentID":"agentic-testing-doc-1"}'),
('document-search',   N'{"resource":"document","operation":"search","host":"https://localhost:9200","username":"elastic","password":"PLACEHOLDER_NOT_A_REAL_CREDENTIAL","allowInsecure":true,"indexName":"agentic-testing-nodes-elasticsearch-20260823","query":{"match_all":{}},"limit":10,"returnAll":false,"simplify":true}'),
('document-update',   N'{"resource":"document","operation":"update","host":"https://localhost:9200","username":"elastic","password":"PLACEHOLDER_NOT_A_REAL_CREDENTIAL","allowInsecure":true,"indexName":"agentic-testing-nodes-elasticsearch-20260823","documentID":"agentic-testing-doc-1","fields":{"title":"Agentic Testing Doc (updated)"}}'),
('document-getMany',  N'{"resource":"document","operation":"getMany","host":"https://localhost:9200","username":"elastic","password":"PLACEHOLDER_NOT_A_REAL_CREDENTIAL","allowInsecure":true,"indexName":"agentic-testing-nodes-elasticsearch-20260823","limit":10,"returnAll":false}'),
('index-get',         N'{"resource":"index","operation":"get","host":"https://localhost:9200","username":"elastic","password":"PLACEHOLDER_NOT_A_REAL_CREDENTIAL","allowInsecure":true,"indexName":"agentic-testing-nodes-elasticsearch-20260823"}'),
('index-getMany',     N'{"resource":"index","operation":"getMany","host":"https://localhost:9200","username":"elastic","password":"PLACEHOLDER_NOT_A_REAL_CREDENTIAL","allowInsecure":true,"limit":10,"returnAll":false}'),
('document-delete',   N'{"resource":"document","operation":"delete","host":"https://localhost:9200","username":"elastic","password":"PLACEHOLDER_NOT_A_REAL_CREDENTIAL","allowInsecure":true,"indexName":"agentic-testing-nodes-elasticsearch-20260823","documentID":"agentic-testing-doc-1","bulk":false}'),
('index-delete',      N'{"resource":"index","operation":"delete","host":"https://localhost:9200","username":"elastic","password":"PLACEHOLDER_NOT_A_REAL_CREDENTIAL","allowInsecure":true,"indexName":"agentic-testing-nodes-elasticsearch-20260823"}');

DECLARE @NewProcessID INT, @NewThreadID INT, @NewVersionID INT, @TriggerElementID INT, @PrevElementID INT, @NewConnectionID INT;
DECLARE @cols NVARCHAR(MAX), @sql NVARCHAR(MAX);

-- 1. Clone Process_Processes shape from 1055
SELECT @cols = STRING_AGG(QUOTENAME(COLUMN_NAME), ',') WITHIN GROUP (ORDER BY ORDINAL_POSITION)
FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Process_Processes' AND COLUMN_NAME NOT IN ('ProcessID');
SET @sql = N'INSERT INTO Process_Processes (' + @cols + N') SELECT ' +
    REPLACE(REPLACE(@cols,'[Name]','@NewName'),'[ResID]','NEWID()') +
    N' FROM Process_Processes WHERE ProcessID = 1055; SET @outID = SCOPE_IDENTITY();';
EXEC sp_executesql @sql, N'@NewName NVARCHAR(300), @outID INT OUTPUT',
    @NewName = N'Phase2-placeholder', @outID = @NewProcessID OUTPUT;

UPDATE Process_Processes SET Name = N'Agentic Testing - Elasticsearch Phase2 - Combined Chain (all 10 features)',
    Description = N'Phase 2 end-to-end chained workflow exercising all 10 elasticsearch node operations in one execution: index-create -> document-create -> document-get -> document-search -> document-update -> document-getMany -> index-get -> index-getMany -> document-delete -> index-delete.'
    WHERE ProcessID = @NewProcessID;

-- 2. Clone Process_ProcessThreads
SELECT @cols = STRING_AGG(QUOTENAME(COLUMN_NAME), ',') WITHIN GROUP (ORDER BY ORDINAL_POSITION)
FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Process_ProcessThreads' AND COLUMN_NAME NOT IN ('ProcessThreadID');
SET @sql = N'INSERT INTO Process_ProcessThreads (' + @cols + N') SELECT ' +
    REPLACE(REPLACE(@cols,'[ProcessID]','@NewProcessID'),'[Name]','@NewName') +
    N' FROM Process_ProcessThreads WHERE ProcessThreadID = 1053; SET @outID = SCOPE_IDENTITY();';
EXEC sp_executesql @sql, N'@NewProcessID INT, @NewName NVARCHAR(300), @outID INT OUTPUT',
    @NewProcessID = @NewProcessID, @NewName = N'Combined Chain', @outID = @NewThreadID OUTPUT;

-- 3. Clone Process_ProcessThreadVersions
SELECT @cols = STRING_AGG(QUOTENAME(COLUMN_NAME), ',') WITHIN GROUP (ORDER BY ORDINAL_POSITION)
FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Process_ProcessThreadVersions' AND COLUMN_NAME NOT IN ('ProcessThreadVersionID');
SET @sql = N'INSERT INTO Process_ProcessThreadVersions (' + @cols + N') SELECT ' +
    REPLACE(@cols,'[ProcessThreadID]','@NewThreadID') +
    N' FROM Process_ProcessThreadVersions WHERE ProcessThreadID = 1053; SET @outID = SCOPE_IDENTITY();';
EXEC sp_executesql @sql, N'@NewThreadID INT, @outID INT OUTPUT',
    @NewThreadID = @NewThreadID, @outID = @NewVersionID OUTPUT;

-- 4. Trigger element (clone from 2271)
SELECT @cols = STRING_AGG(QUOTENAME(COLUMN_NAME), ',') WITHIN GROUP (ORDER BY ORDINAL_POSITION)
FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Process_ProcessElements' AND COLUMN_NAME NOT IN ('ProcessElementID');
SET @sql = N'INSERT INTO Process_ProcessElements (' + @cols + N') SELECT ' +
    REPLACE(REPLACE(REPLACE(@cols,'[ProcessThreadVersionID]','@NewVersionID'),'[Name]','@TName'),'[ProcessElementKey]','@TKey') +
    N' FROM Process_ProcessElements WHERE ProcessElementID = 2271; SET @outID = SCOPE_IDENTITY();';
EXEC sp_executesql @sql, N'@NewVersionID INT, @TName NVARCHAR(300), @TKey NVARCHAR(100), @outID INT OUTPUT',
    @NewVersionID = @NewVersionID, @TName = N'Manual Trigger', @TKey = N'node-p2-trigger',
    @outID = @TriggerElementID OUTPUT;

SET @PrevElementID = @TriggerElementID;

-- 5. Loop: one ES element per step, chained success(prev) -> main(this)
DECLARE @Seq INT, @FeatureCode NVARCHAR(60), @Config NVARCHAR(MAX);
DECLARE @EsElementID INT, @ENameVal NVARCHAR(300), @EKeyVal NVARCHAR(100);
DECLARE @connCols NVARCHAR(MAX), @connSql NVARCHAR(MAX);

DECLARE cur CURSOR FOR SELECT Seq, FeatureCode, Config FROM @Step ORDER BY Seq;
OPEN cur;
FETCH NEXT FROM cur INTO @Seq, @FeatureCode, @Config;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @sql = N'INSERT INTO Process_ProcessElements (' + @cols + N') SELECT ' +
        REPLACE(REPLACE(REPLACE(REPLACE(@cols,'[ProcessThreadVersionID]','@NewVersionID'),'[Name]','@EName'),'[ProcessElementKey]','@EKey'),'[Configuration]','@EConfig') +
        N' FROM Process_ProcessElements WHERE ProcessElementID = 2272; SET @outID = SCOPE_IDENTITY();';
    SET @ENameVal = N'Step ' + CAST(@Seq AS NVARCHAR(10)) + N': ' + @FeatureCode;
    SET @EKeyVal = N'node-p2-step' + CAST(@Seq AS NVARCHAR(10)) + N'-' + @FeatureCode;
    EXEC sp_executesql @sql, N'@NewVersionID INT, @EName NVARCHAR(300), @EKey NVARCHAR(100), @EConfig NVARCHAR(MAX), @outID INT OUTPUT',
        @NewVersionID = @NewVersionID, @EName = @ENameVal, @EKey = @EKeyVal,
        @EConfig = @Config, @outID = @EsElementID OUTPUT;

    -- Wire prev.success/main -> this.main (clone connection shape from 1267)
    SELECT @connCols = STRING_AGG(QUOTENAME(COLUMN_NAME), ',') WITHIN GROUP (ORDER BY ORDINAL_POSITION)
    FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Process_Connections' AND COLUMN_NAME NOT IN ('ConnectionID');
    SET @connSql = N'INSERT INTO Process_Connections (' + @connCols + N') SELECT ' +
        REPLACE(REPLACE(@connCols,'[SourceProcessElementID]','@Src'),'[TargetProcessElementID]','@Tgt') +
        N' FROM Process_Connections WHERE ConnectionID = 1267; SET @outID = SCOPE_IDENTITY();';
    EXEC sp_executesql @connSql, N'@Src INT, @Tgt INT, @outID INT OUTPUT',
        @Src = @PrevElementID, @Tgt = @EsElementID, @outID = @NewConnectionID OUTPUT;

    PRINT N'Step ' + CAST(@Seq AS NVARCHAR(10)) + N' (' + @FeatureCode + N'): ProcessElementID=' + CAST(@EsElementID AS NVARCHAR(20)) + N' Conn=' + CAST(@NewConnectionID AS NVARCHAR(20));

    SET @PrevElementID = @EsElementID;
    FETCH NEXT FROM cur INTO @Seq, @FeatureCode, @Config;
END

CLOSE cur;
DEALLOCATE cur;

PRINT N'=== Phase 2 build complete ===';
PRINT N'ProcessID=' + CAST(@NewProcessID AS NVARCHAR(20)) + N' ProcessThreadID=' + CAST(@NewThreadID AS NVARCHAR(20)) + N' ProcessThreadVersionID=' + CAST(@NewVersionID AS NVARCHAR(20)) + N' TriggerElementID=' + CAST(@TriggerElementID AS NVARCHAR(20));
