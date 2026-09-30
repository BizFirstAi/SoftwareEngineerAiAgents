-- ============================================================================
-- Agentic Testing Nodes — Elasticsearch — Phase 1 build script (isolated workflows)
-- ============================================================================
-- Builds ONE minimal workflow per elasticsearch operation (manual-trigger -> elasticsearch node),
-- direct-DB technique per ..\..\globals.md "How automated testing works for a node" and the proven
-- precedent in Documentation\Employees\agentic-coding\atlas-form-automation-project\STATUS.md
-- ("Done (cont. 7)", ProcessID=1054/1051 direct-DB build).
--
-- RUN AGAINST: sqlcmd -S .\SQLEXPRESS -d data-ocean-platform-prod -E -C -i <this file>
-- (adjust -S/-d if your environment's dev DB connection differs — confirm against
-- BizFirstPayrollV3\src\mvc-server\Solutions\AiUltimate\BizFirst.Ai.Consolidated.WebApi\
-- appsettings.Development.json's "DefaultConnection" first.)
--
-- HOW THIS WORKS (the reusable technique — adapt for any node type, not just elasticsearch):
--   1. Clones Process_Processes / Process_ProcessThreads / Process_ProcessThreadVersions row-shape
--      from a known-good prior workflow (here: ProcessID=1055, itself cloned from Task 5's
--      ProcessID=1054/1051) using dynamic SQL that reads the real column list from
--      INFORMATION_SCHEMA.COLUMNS and does an INSERT...SELECT clone — this avoids hand-typing every
--      column (many are DB-standard audit/tenant columns per the project's own DB conventions:
--      Deleted, Archived, LastModifiedOn/By, CreatedOn/By, SourceAppID, ClientAccountID, AppDomainID,
--      DataDomainID, DataSegmentID, TenantID, ResID) and guarantees every NOT NULL column gets a
--      real value straight from a row the engine already accepts.
--   2. Clones a manual-trigger Process_ProcessElements row (template: ProcessElementID=2271) and an
--      elasticsearch Process_ProcessElements row (template: ProcessElementID=2272), swapping in a new
--      Name/ProcessElementKey/Configuration per feature. To adapt for a different node type: swap the
--      elasticsearch template row for one real ProcessElementID of the node type you're testing, and
--      swap the @Feature table's Config JSON values for that node's real config schema (see that
--      node's own resource.md for its schema).
--   3. Wires trigger -> node via a cloned Process_Connections row (template: ConnectionID=1267,
--      SourcePortKey/TargetPortKey = 'main'/'main' — confirm your node's actual port keys from its
--      Process_ProcessElementTypes.InputPortsSchema/OutputPortsSchema if different).
--
-- RESULT AS RUN 2026-08-23 (elasticsearch node, 9 of the 10 operations — document-search was built
-- separately first as ProcessID=1055, renamed to match this naming convention afterward):
--   index-create      ProcessID=1056  TriggerElementID=2273  EsElementID=2274  ConnectionID=1268
--   index-get         ProcessID=1057  TriggerElementID=2275  EsElementID=2276  ConnectionID=1269
--   index-getMany     ProcessID=1058  TriggerElementID=2277  EsElementID=2278  ConnectionID=1270
--   index-delete      ProcessID=1059  TriggerElementID=2279  EsElementID=2280  ConnectionID=1271
--   document-create   ProcessID=1060  TriggerElementID=2281  EsElementID=2282  ConnectionID=1272
--   document-get      ProcessID=1061  TriggerElementID=2283  EsElementID=2284  ConnectionID=1273
--   document-getMany  ProcessID=1062  TriggerElementID=2285  EsElementID=2286  ConnectionID=1274
--   document-search   ProcessID=1063  TriggerElementID=2287  EsElementID=2288  ConnectionID=1275
--   document-update   ProcessID=1064  TriggerElementID=2289  EsElementID=2290  ConnectionID=1276
--   document-delete   ProcessID=1065  TriggerElementID=2291  EsElementID=2292  ConnectionID=1277
--   (document-search, built first)  ProcessID=1055  TriggerElementID=2271  EsElementID=2272  ConnectionID=1267
-- See ..\resource.md and ..\testround\r1\results.md for how these are used/verified.
--
-- CAUTION: re-running this script as-is creates a SECOND set of 9 workflows (INSERT, not idempotent).
-- Only re-run after changing the @Feature values, or after deleting the rows above first.
-- ============================================================================

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET NOCOUNT ON;

DECLARE @Feature TABLE (Seq INT IDENTITY(1,1), FeatureCode NVARCHAR(60), Config NVARCHAR(MAX));

INSERT INTO @Feature (FeatureCode, Config) VALUES
('index-create',      N'{"resource":"index","operation":"create","host":"https://localhost:9200","username":"elastic","password":"PLACEHOLDER_NOT_A_REAL_CREDENTIAL","allowInsecure":true,"indexName":"agentic-testing-nodes-elasticsearch-20260823","mappings":{"properties":{"title":{"type":"text"}}},"settings":{"number_of_shards":1}}'),
('index-get',         N'{"resource":"index","operation":"get","host":"https://localhost:9200","username":"elastic","password":"PLACEHOLDER_NOT_A_REAL_CREDENTIAL","allowInsecure":true,"indexName":"agentic-testing-nodes-elasticsearch-20260823"}'),
('index-getMany',     N'{"resource":"index","operation":"getMany","host":"https://localhost:9200","username":"elastic","password":"PLACEHOLDER_NOT_A_REAL_CREDENTIAL","allowInsecure":true,"limit":10,"returnAll":false}'),
('index-delete',      N'{"resource":"index","operation":"delete","host":"https://localhost:9200","username":"elastic","password":"PLACEHOLDER_NOT_A_REAL_CREDENTIAL","allowInsecure":true,"indexName":"agentic-testing-nodes-elasticsearch-20260823"}'),
('document-create',   N'{"resource":"document","operation":"create","host":"https://localhost:9200","username":"elastic","password":"PLACEHOLDER_NOT_A_REAL_CREDENTIAL","allowInsecure":true,"indexName":"agentic-testing-nodes-elasticsearch-20260823","fields":{"title":"Agentic Testing Doc","body":"created by agentic-testing-nodes phase 1"}}'),
('document-get',      N'{"resource":"document","operation":"get","host":"https://localhost:9200","username":"elastic","password":"PLACEHOLDER_NOT_A_REAL_CREDENTIAL","allowInsecure":true,"indexName":"agentic-testing-nodes-elasticsearch-20260823","documentID":"agentic-testing-doc-1"}'),
('document-getMany',  N'{"resource":"document","operation":"getMany","host":"https://localhost:9200","username":"elastic","password":"PLACEHOLDER_NOT_A_REAL_CREDENTIAL","allowInsecure":true,"indexName":"agentic-testing-nodes-elasticsearch-20260823","limit":10,"returnAll":false}'),
('document-search',   N'{"resource":"document","operation":"search","host":"https://localhost:9200","username":"elastic","password":"PLACEHOLDER_NOT_A_REAL_CREDENTIAL","allowInsecure":true,"indexName":"agentic-testing-nodes-elasticsearch-20260823","query":{"match_all":{}},"limit":10,"returnAll":false,"simplify":true}'),
('document-update',   N'{"resource":"document","operation":"update","host":"https://localhost:9200","username":"elastic","password":"PLACEHOLDER_NOT_A_REAL_CREDENTIAL","allowInsecure":true,"indexName":"agentic-testing-nodes-elasticsearch-20260823","documentID":"agentic-testing-doc-1","fields":{"title":"Agentic Testing Doc (updated)"}}'),
('document-delete',   N'{"resource":"document","operation":"delete","host":"https://localhost:9200","username":"elastic","password":"PLACEHOLDER_NOT_A_REAL_CREDENTIAL","allowInsecure":true,"indexName":"agentic-testing-nodes-elasticsearch-20260823","documentID":"agentic-testing-doc-1","bulk":false}');

DECLARE @Seq INT, @FeatureCode NVARCHAR(60), @Config NVARCHAR(MAX);
DECLARE @NewProcessID INT, @NewThreadID INT, @NewVersionID INT, @TriggerElementID INT, @EsElementID INT, @NewConnectionID INT;
DECLARE @cols NVARCHAR(MAX), @sql NVARCHAR(MAX);
DECLARE @TKeyVal NVARCHAR(100), @ENameVal NVARCHAR(300), @EKeyVal NVARCHAR(100);

DECLARE cur CURSOR FOR SELECT Seq, FeatureCode, Config FROM @Feature ORDER BY Seq;
OPEN cur;
FETCH NEXT FROM cur INTO @Seq, @FeatureCode, @Config;

WHILE @@FETCH_STATUS = 0
BEGIN
    SELECT @cols = STRING_AGG(QUOTENAME(COLUMN_NAME), ',') WITHIN GROUP (ORDER BY ORDINAL_POSITION)
    FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Process_Processes' AND COLUMN_NAME NOT IN ('ProcessID');
    SET @sql = N'INSERT INTO Process_Processes (' + @cols + N') SELECT ' +
        REPLACE(REPLACE(@cols,'[Name]','@NewName'),'[ResID]','NEWID()') +
        N' FROM Process_Processes WHERE ProcessID = 1055; SET @outID = SCOPE_IDENTITY();';
    EXEC sp_executesql @sql, N'@NewName NVARCHAR(300), @outID INT OUTPUT',
        @NewName = @FeatureCode, @outID = @NewProcessID OUTPUT;

    UPDATE Process_Processes SET Name = N'Agentic Testing - Elasticsearch Phase1 - ' + @FeatureCode,
        Description = N'Isolated single-feature test workflow (Phase 1) for elasticsearch node, feature: ' + @FeatureCode
        WHERE ProcessID = @NewProcessID;

    SELECT @cols = STRING_AGG(QUOTENAME(COLUMN_NAME), ',') WITHIN GROUP (ORDER BY ORDINAL_POSITION)
    FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Process_ProcessThreads' AND COLUMN_NAME NOT IN ('ProcessThreadID');
    SET @sql = N'INSERT INTO Process_ProcessThreads (' + @cols + N') SELECT ' +
        REPLACE(REPLACE(@cols,'[ProcessID]','@NewProcessID'),'[Name]','@NewName') +
        N' FROM Process_ProcessThreads WHERE ProcessThreadID = 1053; SET @outID = SCOPE_IDENTITY();';
    EXEC sp_executesql @sql, N'@NewProcessID INT, @NewName NVARCHAR(300), @outID INT OUTPUT',
        @NewProcessID = @NewProcessID, @NewName = @FeatureCode, @outID = @NewThreadID OUTPUT;

    SELECT @cols = STRING_AGG(QUOTENAME(COLUMN_NAME), ',') WITHIN GROUP (ORDER BY ORDINAL_POSITION)
    FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Process_ProcessThreadVersions' AND COLUMN_NAME NOT IN ('ProcessThreadVersionID');
    SET @sql = N'INSERT INTO Process_ProcessThreadVersions (' + @cols + N') SELECT ' +
        REPLACE(@cols,'[ProcessThreadID]','@NewThreadID') +
        N' FROM Process_ProcessThreadVersions WHERE ProcessThreadID = 1053; SET @outID = SCOPE_IDENTITY();';
    EXEC sp_executesql @sql, N'@NewThreadID INT, @outID INT OUTPUT',
        @NewThreadID = @NewThreadID, @outID = @NewVersionID OUTPUT;

    SELECT @cols = STRING_AGG(QUOTENAME(COLUMN_NAME), ',') WITHIN GROUP (ORDER BY ORDINAL_POSITION)
    FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Process_ProcessElements' AND COLUMN_NAME NOT IN ('ProcessElementID');
    SET @sql = N'INSERT INTO Process_ProcessElements (' + @cols + N') SELECT ' +
        REPLACE(REPLACE(REPLACE(@cols,'[ProcessThreadVersionID]','@NewVersionID'),'[Name]','@TName'),'[ProcessElementKey]','@TKey') +
        N' FROM Process_ProcessElements WHERE ProcessElementID = 2271; SET @outID = SCOPE_IDENTITY();';
    SET @TKeyVal = N'node-p1-' + @FeatureCode + N'-trigger';
    EXEC sp_executesql @sql, N'@NewVersionID INT, @TName NVARCHAR(300), @TKey NVARCHAR(100), @outID INT OUTPUT',
        @NewVersionID = @NewVersionID, @TName = N'Manual Trigger', @TKey = @TKeyVal,
        @outID = @TriggerElementID OUTPUT;

    SET @sql = N'INSERT INTO Process_ProcessElements (' + @cols + N') SELECT ' +
        REPLACE(REPLACE(REPLACE(REPLACE(@cols,'[ProcessThreadVersionID]','@NewVersionID'),'[Name]','@EName'),'[ProcessElementKey]','@EKey'),'[Configuration]','@EConfig') +
        N' FROM Process_ProcessElements WHERE ProcessElementID = 2272; SET @outID = SCOPE_IDENTITY();';
    SET @ENameVal = N'Elasticsearch: ' + @FeatureCode;
    SET @EKeyVal = N'node-p1-' + @FeatureCode + N'-es';
    EXEC sp_executesql @sql, N'@NewVersionID INT, @EName NVARCHAR(300), @EKey NVARCHAR(100), @EConfig NVARCHAR(MAX), @outID INT OUTPUT',
        @NewVersionID = @NewVersionID, @EName = @ENameVal, @EKey = @EKeyVal,
        @EConfig = @Config, @outID = @EsElementID OUTPUT;

    SELECT @cols = STRING_AGG(QUOTENAME(COLUMN_NAME), ',') WITHIN GROUP (ORDER BY ORDINAL_POSITION)
    FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Process_Connections' AND COLUMN_NAME NOT IN ('ConnectionID');
    SET @sql = N'INSERT INTO Process_Connections (' + @cols + N') SELECT ' +
        REPLACE(REPLACE(@cols,'[SourceProcessElementID]','@Src'),'[TargetProcessElementID]','@Tgt') +
        N' FROM Process_Connections WHERE ConnectionID = 1267; SET @outID = SCOPE_IDENTITY();';
    EXEC sp_executesql @sql, N'@Src INT, @Tgt INT, @outID INT OUTPUT',
        @Src = @TriggerElementID, @Tgt = @EsElementID, @outID = @NewConnectionID OUTPUT;

    PRINT @FeatureCode + ': ProcessID=' + CAST(@NewProcessID AS NVARCHAR(20)) + ' TriggerEl=' + CAST(@TriggerElementID AS NVARCHAR(20)) + ' EsEl=' + CAST(@EsElementID AS NVARCHAR(20)) + ' Conn=' + CAST(@NewConnectionID AS NVARCHAR(20));

    FETCH NEXT FROM cur INTO @Seq, @FeatureCode, @Config;
END

CLOSE cur;
DEALLOCATE cur;
