# Observability in Nodes - how the config is applied, and what the observe panels show

Research only (2026-09-21). No code, script, database or git change was made. Everything below was read from source
or from the local DB `data-ocean-platform-prod` (read-only sqlcmd). Anything not verified is labelled "unverified".

Path shorthand used in this file (all under `C:\BizFirstGO_FI_AI`):

| Short | Full path |
|---|---|
| `PE.Domain` | `BizFirstPayrollV3\src\mvc-server\AI\ProcessEngine\BizFirst.Ai.ProcessEngine.Domain` |
| `PE.Service` | `BizFirstPayrollV3\src\mvc-server\AI\ProcessEngine\BizFirst.Ai.ProcessEngine.Service` |
| `BNE` | `PE.Service\06_BaseNodeExecutor` |
| `UAM` | `BNE\Reporting\UnifiedActivityManagement` |
| `FS` | `BizFirstAiStudio\src\flow-studio\packages` |
| `FORM` | `BizFirstFiDB\BizFirstFiV3DB\BizFirstFiV3DB\dbo\Data\AtlasForms\02_Common\05_Observability\Atlas_Forms_11109_common_observability.data.sql` |

## 0. Executive answer (read this first)

1. The C# side IS built to change node behaviour from an `observability` settings object: `NodeObservabilitySettingsInfo`
   (PE.Domain `Node\Configuration\Settings\Base\NodeObservabilitySettingsInfo.cs`) is loaded from the config sub-object
   named `"observability"` (`BaseNodeExecutorSettings.cs:547`) and exposed on every executor as `obs`
   (`BNE\Config\BaseNodeExecutor.Config.cs:421-424`).
2. BUT the form (FormID 11109) does not write that object. The Flow Studio dialog saves control values FLAT, keyed by
   control `id`, onto the ProcessElement `Configuration` root (and again under `nodeFormValues`). Proven in the local DB:
   `Process_ProcessElements` 2264 and 2310 contain `"enabled":false,"logLevel":"Debug","slowThresholdMs":5000,...` at the
   root and have NO `"observability"` key (0 of 133 elements have one). The runtime therefore never sees anything the user
   sets in the form. **Today every node runs on the C# defaults, whatever the form says.**
3. The C# defaults (key absent) turn EVERYTHING on: `enabled` defaults to TRUE in code (form default is false), and all
   lifecycle / internal / HIL events default to true. So the effective behaviour is "full lifecycle events for every node".
4. Even if the keys were nested correctly, only 8 of the 14 switches would gate real code (all of them gate progress-event
   emission only). `slowThresholdMs`, `logOnlySummary`, `maskSensitiveData` have readers that are dead code or hard-coded
   stubs; `logLevel` is only used as an "== Debug" gate, not a log level.
5. Node input/output capture that feeds the panels and the DB (`Process_NodeActivityLogs`, SignalR `inputData`/`outputData`)
   is NOT controlled by these settings at all, and part of it is unmasked.

## 1. PART 1 - The form and its controls

### 1.1 Form identity

| Item | Value | Evidence |
|---|---|---|
| FormID / Name | 11109 / `NodeForm_Common_Observability` | FORM:189, DB row exists, Deleted=0, DisplayOrder 9084 (VERIFIED by SQL) |
| Tier | Common (Tier-3): `PrimaryUsage='node-form-Common'`, `NodeUsage='Common'`, `NodeSubUsage='DesignTime'` | FORM:196-198 (header comment on line 5 says NodeUsage=Observability; the INSERT and the DB say `Common` - comment is wrong) |
| Category / type | FormCategoryID 7, FormTypeID 8 | FORM:194 |
| Author / intent | "Maps to NodeObservabilitySettingsInfo. All keys are camelCase matching ReadConfigByKey reads." | FORM:3, 14 |
| Sibling files in `05_Observability` | none (only this file) | ls |
| Sibling folders in `02_Common` | `00_Hil`, `01_GeneralSettings`, `02_OutputPorts`, `03_Capabilities`, `04_MergeSettings`, `06_GuardRails`, `07_Iteration`, `07_NodePolicies`, `08_DataPaths` (no other observability form) | ls |
| Older draft | `Documentation\Team\2026_05_31-May\Shilja\ScafoldedForms\Atlas_Forms_11099_observability.data.sql` and `Documentation\WorkManagement\Individuals\Binoy\code-review-ai-agent\forms-ai-agent\01-observability.md` (the latter states "Config Key `observability` (nested object)" - the shipped form does not do that) | read |

### 1.2 Every control in form 11109 (order = form order)

All controls: `required=false`; binding `{source:"$form", path:"observability.<id>"}`.

| # | control id | type | label | default | options / validation | help text (description) |
|---|---|---|---|---|---|---|
| 0 | `enabled` | switch | Enable Observability Logging | false | - | Enables structured debug log points across the full execution path. |
| 1 | `logLevel` | select | Log Level | "Debug" | Debug / Information / Warning | Minimum log level for observability output. |
| 2 | `slowThresholdMs` | number | Slow Threshold (ms) | 5000 | min 0 | Execution time above which a slow-execution warning is emitted. |
| 3 | `logOnlySummary` | switch | Log Summary Only | false | - | Log up to 200 characters of content for dev inspection. Do not enable in production. |
| 4 | `maskSensitiveData` | switch | Mask Sensitive Data | true | - | Log only character counts instead of content values. Safer than Log Summary Only. |
| 5 | `exposeRawDataInEvents` | switch | Expose Raw Data in Events | false | - | Bypass data scrubbing and expose raw data in observer events. Development/debug only. |
| 6 | `enableNodeInternalEvents` | switch | Enable Node Internal Events | false | - | Log internal node processing events for detailed execution tracing. |
| 7 | `enableNodeInternalRemoteEvents` | switch | Enable Node Internal Remote Events | false | - | Also emit internal node processing events to remote observers (e.g. SignalR), not just local logs. Defaults to the same value as Enable Node Internal Events. |
| 8 | `enableNodeHilEvents` | switch | Enable HIL Events | true | - | Log Human-in-the-Loop (HIL) events such as approval requests, responses, and timeouts. |
| 9 | `section_lifecycle` | header (h3) | Node Lifecycle Events | - | display only, holds no value | - |
| 10 | `enableNodeLifeCycleEvents` | switch | Enable Node Lifecycle Events | true | - | Enable all node lifecycle event tracking (input, success, error). |
| 11 | `enableNodeLifeCycleGenericEvents` | switch | Generic Lifecycle Events | true | - | Log generic node lifecycle events without detailed event data. |
| 12 | `enableNodeLifeCycleInputEvents` | switch | Input Events | true | - | Log node input reception and processing events. |
| 13 | `enableNodeLifeCycleSuccessEvents` | switch | Success Events | true | - | Log successful node completion events. |
| 14 | `enableNodeLifeCycleErrorEvents` | switch | Error Events | true | - | Log node error and failure events. |

(FORM:19-173. 14 value controls + 1 header. The form has a single Save action, FORM:175-177.)

### 1.3 (a) Where the form values are stored on a node

Save path (frontend): `FS\flow-studio-designer\src\components\Modals\ConnectorConfigDialog.tsx` builds a flat map
`{controlID: value}` from all config tabs (`:567-590` no-connector case; `:618-640` connector case) and calls
`onFormValuesSave(values)`. The two callers merge the values onto the Configuration ROOT and also under `nodeFormValues`:

* `FS\flow-studio-designer\src\components\Modals\NodePropertiesModal.tsx:354-370`
* `FS\flow-studio-designer\src\components\Nodes\Base\BaseNode.tsx:826-835`

```
configuration: { ...currentConfig, ...values, nodeFormValues: { ...currentConfig.nodeFormValues, ...values } }
```

The `binding.path` (`observability.enabled`) is NOT used as a storage path by this save code (bindings are only used by
`atlas-forms\packages\form-engine-js\src\DataBindingEngine.ts` to READ data sources). Result - exact JSON paths as stored:

| Control | Stored path on the ProcessElement (Process_ProcessElements.Configuration) | Path the C# reads |
|---|---|---|
| all 14 controls | `$.<controlID>` and `$.nodeFormValues.<controlID>` e.g. `$.enabled`, `$.logLevel` | `$.observability.<controlID>` |

DB proof (VERIFIED, local): element 2264 Configuration contains
`..."enabled":false,"logLevel":"Debug","slowThresholdMs":5000,"logOnlySummary":false,"maskSensitiveData":true,"exposeRawDataInEvents":false,"enableNodeInternalEvents":false,"enableNodeInternalRemoteEvents":false,"enableNodeHilEvents":true,"enableNodeLifeCycleE...`
and `CHARINDEX('"observability"', Configuration) = 0`. Counts: 133 elements total, 0 with `"observability"`, 2 with the flat keys
(2264, 2310), 68 with `nodeFormValues`.

Connector.Configuration: for nodes with a connector the same flat map is also serialised into `Connector.Configuration`
(`ConnectorConfigDialog.tsx:655-660`, `serializeConfiguration`). So a flat copy can also live on the connector; the
Extension layer only holds whatever the extension author put there. No layer stores a nested `observability` object unless
someone hand-writes it (e.g. via JSON edit or the Workflow MCP).

### 1.4 (b) Where the values are read at runtime

Three-layer merge (`PE.Service\50_Configuration\NodeConfigurationResolver.cs`):
Extension dict (`:89`) -> overlaid by Connector dict (`:101-105`) -> overlaid by ProcessElement dict last (`:107-115`,
"MOST specific layer ... overlay it last"). The merge is SHALLOW per top-level key (`merged[kvp.Key] = kvp.Value`), so a
higher layer's whole `observability` object replaces a lower layer's whole object; there is no per-key merge inside it.
`ResolvedNodeConfiguration.ToMergedJson()` (`PE.Domain\Configuration\ResolvedNodeConfiguration.cs:134`) hands that JSON to
the executor.

Settings load: `BNE\Orchestrate\Phases\BaseNodeExecutor.EntryValidate.cs:26-35` (`OnEntryValidateConfig`) and, earlier,
`ProcessElementExecutor.Validation.cs:31` -> `BaseNodeExecutor.ValidateAsync` (`BNE\Config\BaseNodeExecutor.Config.cs:64-82`) ->
`LoadAndValidateConfigAsync` (`:39-46`) -> `LoadConfigAsync` (`:111-140`) which calls `settings.SetConfig(config)`.

Reader chain:

```
BaseNodeExecutorSettings.ObservabilityInfo            PE.Domain ...\Settings\Base\BaseNodeExecutorSettings.cs:542-549
  -> ReadConfigDictionaryByKey("observability")       :547   (top-level key; case-sensitive dictionary copy,
                                                             Go.Essentials ...\SuperBaseDataPropertyBag.cs:56-66)
  -> NodeObservabilitySettingsInfo.CreateInstance -> LoadFrom(reader)   NodeObservabilitySettingsInfo.cs:267-294
BaseNodeExecutor.obs  (fallback: new NodeObservabilitySettingsInfo() => Enabled=false => everything off if settings==null)
                                                       BNE\Config\BaseNodeExecutor.Config.cs:421-424
```

`LoadFrom` key list (NodeObservabilitySettingsInfo.cs:269-286): `enabled, logLevel, slowThresholdMs, logOnlySummary,
maskSensitiveData, exposeRawDataInEvents, enableNodeInternalEvents, enableNodeInternalRemoteEvents, enableNodeHilEvents,
enableNodeLifeCycleGenericEvents, enableNodeLifeCycleEvents, enableNodeLifeCycleInputEvents, enableNodeLifeCycleSuccessEvents,
enableNodeLifeCycleErrorEvents`. These 14 keys match the form's 14 control ids exactly (spelling and casing) - the mismatch
is the NESTING (`observability.` prefix), not the names. No other code in `ProcessEngine.Service`, `.Domain`, `.Api.Base` or
`NodeServer.Service` reads these keys (grep for `"logLevel"`, `"slowThresholdMs"`, `"enableNodeLifeCycle`, `"observability"`
found only `NodeObservabilitySettingsInfo.cs`, `BaseNodeExecutorSettings.cs:547` and the unrelated
`UAM\Configuration\ExecutionActivityDefinitionLoader.cs:138`, which parses an activity-definition JSON, not node config).

### 1.5 (c) Per-control status

Legend for "Runtime consumer": the code that actually changes behaviour if the key were read. "Effective today" = what
happens for a node saved from the form as it is now (flat keys, so the object is empty and defaults apply).
Getter gating in the class: most getters return false/true-safe unless `Enabled && LogLevel=="Debug" && !LogOnlySummary`
(NodeObservabilitySettingsInfo.cs:40-42, 62-64, 85-87, 103-105, 123-125, 164-166; lifecycle children also require
`EnableNodeLifeCycleEvents`, :188, 210, 231, 252).

| Control | Default when key absent (code) | Runtime consumer (file:line) | What it changes | Status (class, if nested) | Effective today (form as saved) |
|---|---|---|---|---|---|
| `enabled` | TRUE (`LoadFrom` uses `EnabledDefault`=true, :269, :15) - form default is false | master gate inside 11 getters; `IsNodeObservabilityEnabled` `BNE\Reporting\Legacy\BaseNodeExecutor.Logging.Core.cs:51` -> `IsDebugEnabled` :57-65 -> `LogDebug` :86-95 (needs `_logger` Debug too) | switches on/off every lifecycle/internal/HIL event and node `LogDebug` output. Publisher's own `IsObservabilityEnabled()` is a hard-coded `true` stub (`UAM\Core\ExecutionActivityPublisher.Observability.cs:135-140`) so publisher paths ignore it | PARTIAL (works for BaseNodeExecutor event gates, not for publisher) | NOT READ (key not under `observability`): always true |
| `logLevel` | "Debug" (`LogLevelDefault` :26-32; field initializer "Information" is overwritten by LoadFrom) | only the literal test `LogLevel != "Debug"` in getters (:41, 63, 86, 104, 124, 165, 191, 211, 232, 253); HIL getter has it commented out (:144) | any value other than Debug silently disables internal, remote, lifecycle events and raw-expose; it does NOT filter `_logger` output (`ReportExecutionProgressAsync` logs at fixed Debug/Error, `ProgressReport.cs:42`) | PARTIAL (works as an on/off side-effect, not as a level) | NOT READ: "Debug" |
| `slowThresholdMs` | 5000 | `BNE\Reporting\Legacy\BaseNodeExecutor.Logging.Observability.cs:83-99` (`CheckAndLogSlowExecution`) and publisher `ExecutionActivityPublisher.Observability.cs:74-96` (threshold hard-coded stub 5000 at :124-129). NEITHER method has a caller (grep in `PE.Service`: only the definitions) | intended: Warning + OTEL `node.slow_execution` event. Actually: nothing | NOT WIRED (reader exists, never invoked) | none |
| `logOnlySummary` | false | Legacy `SafeContent` (`Logging.Observability.cs:65-77`, private, no caller); publisher `IsLogOnlySummaryEnabled()` hard-coded `false` (`ExecutionActivityPublisher.Observability.cs:102-107`); getters use it as a KILL SWITCH: if true, internal/lifecycle/raw events all return false and mask returns true | intended: log <=200 chars. Actually: turning it ON would disable lifecycle events (opposite of "log content") | NOT WIRED as documented; PARTIAL as kill switch | none |
| `maskSensitiveData` | true (getter :57-68) | Legacy `SafeContent` (dead); publisher `IsMaskSensitiveDataEnabled()` hard-coded `true` (:113-118) used by publisher `SafeContent` (:52-67), which IS called for OTEL span tags: `UAM\Core\ExecutionActivityPublisher.Trace.cs:461, 510, 523, 616` | publisher span tags always masked to "[N chars]" regardless of the user's value. Events/`inputData` payloads do not use it at all (they use `SensitiveDataScrubber`, key-name only) | NOT WIRED (setting never reaches the code that masks) | none (always masked in span tags, always key-scrubbed in events) |
| `exposeRawDataInEvents` | false | `BNE\Status\BaseNodeExecutor.Data.cs:23-28` (`ScrubForEvent`), used at `BNE\Orchestrate\BaseNodeExecutor.Orchestrate.cs:97` | picks raw vs `SensitiveDataScrubber.Scrub` for `Metadata["inputData"]` of the Initiated stage event only | PARTIAL (one path; bypassed by `ProcessEngineEventService.cs:632-635`, see 1.8) | none |
| `enableNodeInternalEvents` | code default true (`EnableNodeInternalEventsDefault` :130-136); form default false | `BNE\Reporting\Legacy\BaseNodeExecutor.ProgressReport.cs:116` (`ReportExecutionProgressDoWorkAsync`) | emits "AgentProgress" DoWork progress events (only for nodes that call the DoWork helpers, e.g. `ReportNodeProgress_ResourceOperation*` :89-105) | WIRED | events always on |
| `enableNodeInternalRemoteEvents` | default = effective value of `enableNodeInternalEvents` (:110-116) -> true | `ProgressReport.cs:108` (`ReportExecutionProgressDoWorkByBridgeAsync`) | emits "AgentRemoteProgress" events. NOTE: both flavours go through the same `ReportExecutionProgressAsync` -> SignalR; the "remote only" distinction in the help text is not implemented | WIRED (semantics differ from help text) | always on |
| `enableNodeHilEvents` | true | `ProgressReport.cs:127` (`ReportExecutionProgressHILAsync`) | emits HIL sub-stage progress events. Getter ignores logLevel/summary (:139-149) | WIRED | always on |
| `enableNodeLifeCycleEvents` | true | parent gate only: read by the four children (:188, 210, 231, 252); no direct call site | turns all four lifecycle child switches off | WIRED (via children) | always on |
| `enableNodeLifeCycleGenericEvents` | true | `Orchestrate.cs:101, 104, 107, 113, 117, 120, 123, 129` | gates the 8 stage events Entry, EntryValidate, PreValidationGuardRails, PreProcess, Process, PostProcess, PostValidationGuardRails, Exit | WIRED | always on (8 events per node) |
| `enableNodeLifeCycleInputEvents` | true | `Orchestrate.cs:98` | gates the "Initiated/Starting" event that carries `inputData` | WIRED | always on |
| `enableNodeLifeCycleSuccessEvents` | true | `Orchestrate.cs:56, 79` | gates "Suspended" (HIL) and "Completed.Success" events | WIRED | always on |
| `enableNodeLifeCycleErrorEvents` | true | `Orchestrate.cs:85` | gates "Completed.Error" event | WIRED | always on |

Summary: WIRED (C# gate + real effect) = 8 switches (enableNodeInternalEvents, enableNodeInternalRemoteEvents, enableNodeHilEvents,
enableNodeLifeCycleEvents [parent], Generic, Input, Success, Error); PARTIAL = `enabled`, `logLevel`,
`exposeRawDataInEvents`; NOT WIRED (reader dead or stubbed) = `slowThresholdMs`, `logOnlySummary`, `maskSensitiveData`.
The header `section_lifecycle` is display-only. **None of the 14 is effective today because of the flat-vs-nested key
mismatch (1.3).**

What "WIRED" changes, precisely: each gate wraps `ReportExecutionProgressLifeCycleAsync` -> `ReportExecutionProgressAsync`
(`ProgressReport.cs:14-79`), which (1) mirrors to `ActivityPublisher.ReportExecutionProgressAsync` (:20-30), (2) logs via
`_logger` (:40-47), (3) if `RequiresEventLog`, calls `Processor.RaiseNodeProgressEvent4Async` (:64) ->
`OrchestrationProcessor.ExecutionEvent2Async` (`PE.Service\40_Orchestration\OrchestrationProcessor.Events.cs:112-116`, :36-42)
-> every `IExecutionEventHandler`: `ProcessEngineExecutionHub.OnExecutionEventAsync` (SignalR, `Hubs\ProcessEngineExecutionHub.cs:55`)
and `LoggingEventHandler` (`Services\Event\Service\Events\LoggingEventHandler.cs`, registered `DependencyInjection.cs:311`).
There is no per-event sampling, retention or metrics switch in these settings.

### 1.6 What is NOT controlled by any observability setting (always on)

| Behaviour | Where | Note |
|---|---|---|
| `NodeExecuting` / `NodeExecuted` / error / workflow / process events | `OrchestrationProcessor.Events.cs:75-91, 130-150` | broadcast to SignalR regardless of node settings; they carry `inputData`/`outputData` |
| Node activity record (input snapshot, scrubbed output, logs, duration) | `BNE\Orchestrate\Phases\BaseNodeExecutor.Process.cs:94` -> `BNE\Reporting\Legacy\BaseNodeExecutor.NodeActivity.cs:70-100` -> `WorkflowSignalREventProducer.ProduceNodeActivityAsync` (`Services\Events\WorkflowSignalREventProducer.cs:39-60`) -> `INodeActivityWriter` (`ProcessEngage\...\Repositories\NodeActivityWriter.cs`) -> table `Process_NodeActivityLogs` | `EnableNodeActivity` is a constant `true` (`NodeActivity.cs:43-49`) |
| ConfigResolution event with merged config | `PE.Service\03_Executor\ProcessElementExecutor\ProcessElementExecutor.ConfigResolution.cs:32` (`enableEventDetailedReport = true` hard-coded), :205-207, :222 (`SensitiveDataScrubber.Scrub`) | not linked to a setting |
| Execution tracing to SQL | `SqlExecutionTracingService` (`Process_ExecutionTraces*`), gated by `ProcessEngineOptions.EnableExecutionTracing` default true (`Domain\ProcessEngineOptions.cs:43`, `DependencyInjection.cs:316`) | process-level option, not node-level |
| OTEL span/metric/log via `ObservabilityTarget` | `UAM\Targets\ObservabilityTarget.cs`; only this target is registered, and only if the host calls `AddUnifiedActivityManagement()` (`UAM\Core\DependencyInjection.cs:18-35`); publisher injected by `NodeExecutorFactory.cs:110` (null if not registered) | LiveStream/FlowLog/FlowBroadcast targets deliberately NOT registered (DI comment :18-20). `FlowLogTarget` needs an `IActivityLogRepository` that has no implementation in PE.Service |
| Sampling / retention | `UAM\Core\ExecutionActivityPublisher.Classification.cs:32, 72-74, 95` | driven by activity-classification definitions, not node config |

### 1.7 (d) End-to-end flow

```
DESIGN TIME
  Flow Studio config dialog  --Tier-3 NodeFormResolver (PrimaryUsage='node-form-Common')-->  Atlas form 11109 ("Observability" tab)
  user toggles switches --> ConnectorConfigDialog builds FLAT {enabled,logLevel,...}
      --> NodePropertiesModal/BaseNode.onFormValuesSave
      --> ProcessElement.configuration = { ...root, enabled, logLevel, ..., nodeFormValues:{...same...} }
      --> workflow save --> Process_ProcessElements.Configuration (flat keys)  [and Connector.Configuration flat copy if a connector is bound]

RUN TIME (per node)
  1  ProcessElementExecutor.ResolveConfiguration: NodeConfigurationResolver merges Extension < Connector < ProcessElement (shallow)
  2  ProcessElementExecutor.Validation -> executor.ValidateAsync -> LoadAndValidateConfigAsync(merged JSON) -> settings.SetConfig
  3  BaseNodeExecutor.Execute (Orchestrate.cs:15) -> OnExecute (:91)
  4  obs = settings.ObservabilityInfo = LoadFrom(config["observability"])   <-- keys not found today => code defaults (all ON)
  5  ConfigResolution event (ungated, scrubbed shallow)                 -> SignalR
  6  NodeExecuting event (orchestrator, ungated)                        -> SignalR
  7  Initiated/input event  [obs.EnableNodeLifeCycleInputEvents]        -> ReportExecutionProgressAsync
  8  Entry, EntryValidate, guards, PreProcess, Process, PostProcess, Exit events [obs...GenericEvents]
  9  node DoWork / HIL progress events [obs.EnableNodeInternal*/HilEvents]
 10  Process.cs:94 ReportNodeActivity (ungated): input snapshot + scrubbed output --> SignalR "ReceiveNodeActivity" + INSERT Process_NodeActivityLogs
 11  Completed.Success / Completed.Error / Suspended events [obs...Success/ErrorEvents]
 12  NodeExecuted event (orchestrator, ungated) with ExecutionContext Input/OutputData
 13  each event --> OrchestrationProcessor.OnExecutionEventAsync --> handlers:
        ProcessEngineExecutionHub -> ProcessEngineEventService.BroadcastExecutionEventAsync -> SignalR hub "/hubs/execution"
            (ApiBase\Extensions\ProcessEngineSignalRExtensions.cs:71), group per ExecutionResID, method "ReceiveServerEvent"
            (+ "ReceiveNodeLog", "ReceiveNodeActivity", "ReceiveHilEvent")
        LoggingEventHandler -> ILogger
     optional (host registered AddUnifiedActivityManagement): ActivityPublisher mirror -> ObservabilityTarget -> OTEL (Prometheus/Tempo/Loki)
     SqlExecutionTracingService -> Process_ExecutionTraces* (0 rows locally)

DISPLAY
  Flow Studio: useExecutionSignalR ('ReceiveServerEvent') -> window 'execution-event' -> useFlowObserverSignalR
      -> FlowObserverPanelEngine.pushData(...) -> panel tabs read the 2000-entry buffer (flowObserverPanelStore.ts:22)
  Flow Insights (separate app, port 6132): direct REST to Process_* tables (executions, element executions, node-activity-logs,
      suspended-executions) - NOT the Obs_* tables and NOT SignalR
```

Where records end up:

| Store | Written by | Local row count (VERIFIED) |
|---|---|---|
| SignalR `/hubs/execution` (transient) | `ProcessEngineEventService`, `WorkflowSignalREventProducer` | n/a |
| `Process_NodeActivityLogs` | `NodeActivityWriter` | 280 |
| `Process_ProcessElementExecutions` | engine state persistence | 1386 |
| `Process_ProcessExecutions` | engine | 1123 |
| `Process_SuspendedExecutions` | HIL suspension | 136 |
| `Process_ExecutionLogs` | `SqlExecutionTracingService` parent row | 5 |
| `Process_ExecutionTraces`, `Process_ExecutionTraceNodeTraces` | `SqlExecutionTracingService` | 0, 0 |
| `Obs_NodeExecutionLogs`, `Obs_NodeExecutionStepLogs`, `Obs_AgentExecutionLogs` | nothing in the engine (CRUD API only: `api/v1/obs/node-execution-logs`, `BizFirst.Obs.Api.Base\Controllers\BaseNodeExecutionLogController.cs:7`) | 0, 0, 0 |

The Obs_* tables (`NodeExecLogID, CorrelationId, TraceId, SpanId, NodeKey, ..., LogData`) are NOT populated by the node
observability path. The old idea "logs written to Obs_NodeExecutionLogs / StepLogs" does not exist in code: the only
references are the entity, repository and controller inside `Observability\Obs\...` plus a platform controller wrapper
(`Platform\WebServer\...\Controllers\AI\Obs\NodeExecutionLogController.cs`). No engine class calls
`INodeExecutionLogService` (grep in `AI` and `Platform`).

### 1.8 (e) Gaps and risks

1. **Flat-vs-nested key mismatch (blocking).** Form saves `$.enabled`; C# reads `$.observability.enabled`. Nothing bridges
   them. Result: the Observability tab is form-only (decorative) today.
2. **Default mismatch.** Code: `enabled` default true (`NodeObservabilitySettingsInfo.cs:269,15`), `enableNodeInternalEvents`
   default true (:130-136). Form: both default false. After the mismatch is fixed, nodes opened from the form would flip from
   "all on" to "internal off, master off" the first time they are saved.
3. **`logLevel` is not a log level.** Values other than `Debug` disable event categories; `Warning` gives silence, not
   "warnings only". Form lists 3 options; the older design doc lists 4 (Error). The class field initializer is "Information"
   but `LoadFrom` overrides it to "Debug" when absent (:270).
4. **`logOnlySummary` inverts its meaning** (kill switch). `maskSensitiveData` and `logOnlySummary` are documented as mutually
   exclusive modes (`forms-ai-agent\01-observability.md`), but the class gives summary precedence and forces mask true.
5. **Dead code.** `CheckAndLogSlowExecution` (both copies), Legacy `SafeContent`, `BeginObservabilityScope` (Legacy) have no
   callers; publisher settings accessors are hard-coded stubs with `TODO: Inject INodeSettingsRepository`
   (`ExecutionActivityPublisher.Observability.cs:104, 115, 126, 137`; `ExecutionActivityPublisher.FlowBroadcast.cs:506-514`
   still refers to a non-existent `obs.EnableFlowBroadcast`).
6. **Sensitive data exposure.**
   * `SensitiveDataScrubber` (`BNE\Status\SensitiveDataScrubber.cs:10-42`) redacts by TOP-LEVEL KEY NAME only (substrings
     password, secret, token, credential, apikey, api_key, auth, bearer, private, connectionstring). Nested objects, arrays
     and string VALUES (e.g. a token inside a JSON body) are not inspected. "auth" also over-matches (author, authority).
   * Node activity `InputData = RuntimeInfo.Data.InputSnapshot` is NOT scrubbed (`NodeActivity.cs:91`), only the output is
     (:92); it is persisted to `Process_NodeActivityLogs.InputDataJson`. Local DB: 246 of 280 rows have input JSON, 23
     contain the substrings password/token/apiKey/secret (could be key names, not necessarily secrets), 0 contain "[redacted]",
     max input length 14,806 chars. Not truncated.
   * The SignalR envelope takes `inputData`/`outputData` from `CurrentContext.ProcessElement.ExecutionContext.InputData/OutputData`
     FIRST, and only falls back to the scrubbed event metadata (`PE.Service\Services\Broadcasting\ProcessEngineEventService.cs:632-635`).
     That bypasses both `ScrubForEvent` and `exposeRawDataInEvents` - the user cannot keep raw data out of the panel.
   * `NodeExecuting`/`NodeExecuted` events are emitted whatever the settings say, so "Enable Observability = off" does not
     stop payload capture or broadcast.
   * `ReportExecutionProgressDoWorkByBridgeWithAssisstedLogs` (`ProgressReport.cs:76-98`) calls `WriteDebugJson2(args, ...)`,
     which writes debug JSON to disk before any `obs` check. The definition of `WriteDebugJson2` was not located in the time
     box, so whether it is disabled outside Development is UNVERIFIED.
   * `MaskSensitiveData` does not apply to event payloads at all; it only feeds a stubbed publisher path.
7. **Performance of full capture.** Default (all on) = about 11 progress events per node (Initiated + 8 stage events +
   Completed + NodeExecuting/NodeExecuted) each doing: mirror to publisher, `_logger.Log`, SignalR broadcast, LoggingEventHandler,
   and `ProcessEngineEventService.cs:708` runs `JsonSerializer.Serialize(envelope)` on EVERY message as a "diagnostic probe"
   (a full extra serialisation including input/output). Input/output are embedded in the event and again in the node-activity
   record (2 broadcasts + 1 DB insert per node). Large payloads are neither sampled nor truncated. The frontend keeps a
   2000-entry buffer and `console.log`s the raw JSON of every event (`useFlowObserverSignalR.ts:44`).
8. **Per-node vs workflow-level.** There is no workflow/process-level observability setting in code (no reader found). Order
   of precedence for the node: ProcessElement > Connector > Extension, but as whole-object replacement of `observability`
   (see 1.4), so a partially specified object on the element hides connector-level keys and the defaults (all-on) fill the gaps.
   Process-level options exist only for tracing (`EnableExecutionTracing`).
9. **Generic key names at the config root.** Because values are saved flat, `enabled` and `logLevel` sit next to the node's own
   keys and can collide with another form's control of the same id (unverified how many forms use `enabled`/`logLevel`).
10. **Timing risk.** `obs` returns an all-off object when `settings` is null (`Config.cs:422`). Settings are loaded by the
    validation step (`ProcessElementExecutor.Validation.cs:31`) before `Execute`; if that step is skipped for some path the
    Initiated/Entry events are silently dropped. Not proven either way (UNVERIFIED).

### 1.9 (f) Recommendations (each control drives behaviour)

Design principle: one settings reader, one policy object, one redactor, one publisher hook. Names use "ID" where an
identifier is involved (none of the properties below need it).

1. **Fix the binding (Domain).** Add `NodeObservabilityConfigReader` (SRP: only key resolution) in `PE.Domain\Node\Configuration\`.
   It builds the bag for `NodeObservabilitySettingsInfo.LoadFrom` from: nested `observability` object first, then the flat root
   keys as fallback (or the reverse - decide once), and `BaseNodeExecutorSettings.ObservabilityInfo` (:542-549) calls it
   instead of `ReadConfigDictionaryByKey("observability")`. This works with the 2 saved elements without touching data. Do not
   keep both writers long term: pick one storage shape and document it. Alternative (form-side): namespace the control ids
   (`observabilityEnabled`, ...) or use a container control whose `binding.rootPath` is `observability`
   (`atlas-forms\...\controls\layouts\FormContainerControl.tsx:25` shows `rootPath` support - unverified that save honours it).
2. **Align defaults** in one place: `EnabledDefault`, `EnableNodeInternalEventsDefault` and the form `defaultValue`s must be
   identical (decide: safe default is enabled=false / internal=false / lifecycle=true, then update the class, not the data).
3. **`NodeObservabilityPolicy` (Service, `BNE\Status\`)**: wraps `obs` and exposes `ShouldEmit(eNodeStage)`,
   `PayloadCaptureMode` (enum `None | Summary | MaskedLength | Full`), `MinimumLogLevel` (a real `Microsoft.Extensions.Logging.LogLevel`),
   `SlowExecutionThresholdMs`. Replace the three overlapping booleans (`LogOnlySummary`, `MaskSensitiveData`, `ExposeRawDataInEvents`)
   by `PayloadCaptureMode` at the class level and derive them from the form (or change the form to one select control). Stop using
   `logLevel`/`logOnlySummary` as kill switches inside getters; getters should return the stored value only.
4. **`NodePayloadRedactor` (Service).** Deep (recursive) key-name AND value-pattern redaction, size cap, per-mode formatting
   (Full/200-char/`[N chars]`). Replace `SensitiveDataScrubber.Scrub` call sites (`Data.cs:23-28`, `NodeActivity.cs:91-92`,
   `ConfigResolution.cs:207,222`) and use it in the SignalR envelope builder (`ProcessEngineEventService.cs:632-635` must take the
   already-redacted payload from the event, never `ExecutionContext.InputData/OutputData`).
5. **Slow execution.** New `SlowExecutionDetector` invoked once in `Process.cs` right after `StopAndRead()` (line ~92, before
   `ReportNodeActivity`), reading `SlowExecutionThresholdMs`; delete the two dead `CheckAndLogSlowExecution` copies.
6. **Publisher.** Replace the four `TODO` stubs in `ExecutionActivityPublisher.Observability.cs` with an injected
   `INodeObservabilityAccessor` (set by `BaseNodeExecutor` next to `ActivityPublisher` in `NodeExecutorFactory.cs:110`) so
   `IsObservabilityEnabled`, `SafeContent`, threshold read the node's real policy. Drop the `obs.EnableFlowBroadcast` reference.
7. **Gate the always-on paths.** Wrap `ReportNodeActivity` capture of input/output (`NodeActivity.cs:91-92`) and the orchestrator
   `NodeExecuting/NodeExecuted` payloads with `PayloadCaptureMode`; keep status/duration/error always (panels need them).
8. **Retention/sampling (new, optional).** If the user wants them per node, add `SamplingRate` and `RetentionDays` to the
   settings class and to the form, consumed by `ExecutionActivityPublisher.Classification.cs` (currently definition-driven).
9. **Remove the per-message diagnostic pre-serialisation** (`ProcessEngineEventService.cs:708`) or gate it by
   `MinimumLogLevel <= Debug`.
10. **Tests.** Unit tests on `NodeObservabilityConfigReader` (flat, nested, both, absent) and on each gate (one test per
    control) in `BizFirst.Ai.ProcessEngine.Service.Tests`; a form-contract test asserting every control id in form 11109 has a
    reader key (the audit checklist in `per-node-audit-checklist.md` can reuse it).

## 2. PART 2 - document observability and the observe panels

### 2.1 What was actually found

* `C:\BizFirstGO_FI_AI\Documentation\WorkManagement\observe-panels` exists but is EMPTY (created 2026-09-21 19:22, 0 files).
  There is nothing to read there; every statement about "the docs in that folder" is therefore NOT VERIFIABLE.
* The phrase "document observability" appears in no `.md`/`.json`/`.txt` under `Documentation` (case-insensitive grep). It is
  not a defined term in this repo. Working interpretation used below: the documentation set that describes the Flow Studio
  "Observer / Observe" panels, i.e. the observability of workflow executions as documented. If Binoy meant the Document
  Sharing module (`Doc_*` tables) that is a different feature and was not covered.
* The real documents about the panels (read in full or in their relevant parts) are:

| Document | Path (under `C:\BizFirstGO_FI_AI\Documentation`) |
|---|---|
| Observer Panels project set (README, ARCHITECTURE, DATA-FLOWS, TABS, IMPLEMENTATION, ROADMAP, resources, DESIGN_CONFIG_AND_IO_LOGS, DESIGN_HIL_EVENTS, CRITICAL_REVIEW_FINDINGS, TAB_ARCHITECTURE_PROPOSAL) | `Projects\FlowStudio\ObserverPanels\` (dated 2026-05-29..06-16) |
| FlowObserver design (Sprint 24 Apr 2026) | `Sprints\Sprint_24042026\InspectPanel\design\` (OVERVIEW, flow-observer-panel, flow-observer-contracts, flow-footer, NoteForAswathy) |
| Console Log panel memory | `WorkManagement\Individuals\Binoy\070_DebuggingProcessEngine\ObserverPane.memory.md` |
| Flow Insights build tracker (execution dashboard, Obs finding) | `WorkManagement\Workflow-Execution-UX\BUILD_STATUS.md` |
| Empty placeholder (Binoy2 sample) | `WorkManagement\Individuals\Binoy2\observePanel\SampleData.md` (0 bytes) + `image.png` |

Only README.md and TABS.md and DESIGN_CONFIG_AND_IO_LOGS.md (first ~260 lines), OVERVIEW.md, ObserverPane.memory.md and
BUILD_STATUS.md (execution dashboard + Obs sections) were read closely; ARCHITECTURE, DATA-FLOWS, IMPLEMENTATION, ROADMAP,
resources, DESIGN_HIL_EVENTS, CRITICAL_REVIEW_FINDINGS, TAB_ARCHITECTURE_PROPOSAL, flow-footer, flow-observer-contracts were only
listed (UNVERIFIED content).

### 2.2 What "observability of a run" means here, in plain language

Every workflow run is a Process -> ProcessThread -> ProcessElement (node) hierarchy. As the engine executes, it raises events
(started, stage progressed, completed, failed, HIL waiting). Those events are pushed over SignalR to Flow Studio and shown in
the bottom "Observe" (Observer) panel. Separately, the engine saves durable records (node executions, node activity with
input/output, suspensions) that the Flow Insights app reads later. The per-node "Observability" form is supposed to be the
dial that chooses how much per-node detail (input, stage events, internal events, HIL events) is emitted and whether data is
masked. Today the dial is not connected (Part 1), so panels get the default (full) stream.

### 2.3 The panels (Flow Studio Observer panel)

Registered in `FS\flow-studio-designer\src\components\FlowObserverInit.tsx`; components in `FS\flow-observer-panel\src\components\tabs\`;
data via `FS\flow-observer-core` (`useFlowObserverSignalR.ts`, `FlowObserverPanelEngine.ts`, `flowObserverPanelStore.ts`).

| Panel (tab id) | Shows | Data source | Which node setting must be ON for data | Status (code) | Doc claim vs code |
|---|---|---|---|---|---|
| Dashboard (`dashboard`, FlowObserverInit:18) | totals, event rate, level mix, top sources, entity completions | client buffer of SignalR `ReceiveServerEvent` (SignalR hub `/hubs/execution`) | none for counts; per-stage rows need lifecycle events | BUILT (`DashboardTabContent.tsx`) | TABS.md lists it as Tier 1 built - VERIFIED |
| Execution Status (`execution-status`, :41) | progress bar, node/entity counters, timing | same SignalR stream; backend sends `progress` counters in the event data | none (orchestrator events are ungated) | BUILT (`ExecutionStatusTabContent.tsx`) | VERIFIED |
| Execution Logs (`execution-logs`, :57) | chronological event timeline with filters | SignalR events (`ExecutionLogEntry[]`, 2000 buffer) | `enableNodeLifeCycleEvents` + Generic/Input/Success/Error children give the per-stage rows; NodeExecuting/Executed rows always | BUILT (`ExecutionLogsTabContent.tsx`) | VERIFIED |
| Nodes (`nodes`, :74) + Nodes Hierarchy (`nodes-hierarchy`, :119) | entity tree and node list | SignalR events (`rawDetail.item`) | none | BUILT (`ExecutionNodeListTabContent.tsx`, `NodesHierarchyTabContent.tsx`) | TABS.md says "to be created" - CONTRADICTED (files exist) |
| Node detail / Inspector (`inspector`, :88, `engineState:'hidden'`; `log-detail` :102) | per-node Input / Output / Output Items / Config / Pinned tabs, raw event JSON | Input = Initiated stage entry, Output = Completed entry (`logQuery.ts:165-200`, `NodeDetailPanel.tsx:19-23, 60-62`); Config = `ConfigResolution` event's `resolvedConfiguration` (`logQuery.ts:181-192`) | Input pane needs `enableNodeLifeCycleInputEvents` (and `enabled`, Debug); Output pane needs the Completed event (`enableNodeLifeCycleSuccessEvents`) plus the hub's `outputData`; Config needs nothing (ungated) | BUILT (`NodeInspectorTabContent.tsx`, `NodeDetailPanel.tsx`) | TABS.md / DESIGN_CONFIG_AND_IO_LOGS.md say "NOT YET IMPLEMENTED" for config and I/O - CONTRADICTED (a scrubbed ConfigResolution event and inputData/outputData already flow; the richer ConfigSnapshot with layers, hash, secret refs is NOT built) |
| HIL Actions (`hil-actions`, :142) and footer badge `hil-pending` (:269) | pending / completed approvals, response time | SignalR `ReceiveHilEvent` (`WorkflowSignalREventProducer.cs:120-129`) + `Process_SuspendedExecutions` | `enableNodeHilEvents` (default true) for the HIL sub-stage progress events; suspension events themselves are engine-level | BUILT (`HilActionsDashboard.tsx`); README expands HIL as "Hardware-In-the-Loop" - CONTRADICTED (project term is Human/Actor-In-the-Loop) | see left |
| Error Analysis (`error-analysis`, :161) | failures by stage/entity type | SignalR events with `runState=failed` / error events | `enableNodeLifeCycleErrorEvents` for the "Completed.Error" stage row; engine `NodeError` event ungated | BUILT (`ErrorAnalysisDashboard.tsx`) | TABS.md "to be created" - CONTRADICTED |
| Console Log (`console-log`, :181) | browser Fetch/XHR and SignalR frames (developer tool) | client-side interceptor only (`fetchInterceptor.ts`), localStorage `consoleLog.enabled` | none (no server involvement) | BUILT | ObserverPane.memory.md - VERIFIED |
| Report tabs (`report-stages`, `report-timeline`, `report-performance`) | stage / Gantt / bottleneck reports | (planned) | n/a | PLANNED (not registered in FlowObserverInit) | TABS.md Tier 3 - VERIFIED as not built |
| Activity Stream (`es-activity`, module registry) | edge-stream activity logs | different module (EdgeStream) | n/a | out of scope | `flow-studio-designer\src\modules\moduleRegistry.tsx:58` |

Flow Insights (separate app, `BizFirstAiStudio\src\flow-insights\apps\flow-insights-studio`, port 6132) - execution
dashboard tabs, per `BUILD_STATUS.md:191-197` and code:

| Tab | Endpoint (found in `flow-insights` src) | Table | Needs node observability? | Local rows |
|---|---|---|---|---|
| Overview | `api/v1/process-engine/execution/status`, `api/v1/process/process-executions/search-advanced` | `Process_ProcessExecutions` | no | 1123 |
| Nodes | `api/v1/process/process-element-executions/by-process-thread-execution` | `Process_ProcessElementExecutions` | no | 1386 |
| Activity Log | `api/v1/process/node-activity-logs/by-execution-res-id` | `Process_NodeActivityLogs` | no (written unconditionally) | 280 |
| HIL | `api/v1/process/suspended-executions/by-execution-res-id` | `Process_SuspendedExecutions` | no | 136 |
| Octopus | reuses node-activity-logs filtered to ai-agent node types | `Process_NodeActivityLogs` | no | - |

None of the Flow Insights tabs reads `Obs_*`. Status: Overview/Nodes/HIL "Built & verified"; Activity Log "built, blocked
on a backend 401" per the tracker (not re-tested here); Octopus "scaffolded" (all UNVERIFIED by me except row counts).

### 2.4 Cross-check of doc claims (VERIFIED / NOT VERIFIED / CONTRADICTED)

| # | Claim (source) | Result | Evidence |
|---|---|---|---|
| 1 | "`observe-panels` folder holds the observe-panel docs" (task brief) | CONTRADICTED | folder is empty; docs live in `Projects\FlowStudio\ObserverPanels` and `Sprints\...\InspectPanel\design` |
| 2 | Obs_* tables (`Obs_NodeExecutionLogs`, `Obs_AgentExecutionLogs`, `Obs_NodeExecutionStepLogs`) exist in `data-ocean-platform-prod` and are empty (BUILD_STATUS.md:310-315) | VERIFIED | `sys.tables` lists all three; COUNT(*) = 0 each |
| 3 | Obs module has no engine writer (implied by BUILD_STATUS "never successfully connected") | VERIFIED | only entity/repo/controller references; no caller of `INodeExecutionLogService` in `AI`/`Platform` |
| 4 | Panels consume "Input/Output data (to be added)" (README.md, DATA-FLOWS) | CONTRADICTED | `ProcessEngineEventService.cs:626-666` already ships `inputData`/`outputData`; `logQuery.ts` reads them |
| 5 | Config audit "NOT YET IMPLEMENTED" (DESIGN_CONFIG_AND_IO_LOGS.md line 3) | PARTIAL / CONTRADICTED | `ConfigResolution` event with scrubbed `resolvedConfiguration` + Config tab exist (`ProcessElementExecutor.ConfigResolution.cs:205-229`, `NodeDetailPanel.tsx:62`); layer-by-layer snapshot, hash, secret references NOT built |
| 6 | Tabs HIL Actions / Error Analysis / Inspector / Nodes "to be created" (TABS.md) | CONTRADICTED | components exist and are registered (FlowObserverInit.tsx:74-171) |
| 7 | "2000-entry circular buffer" (README.md) | VERIFIED | `flowObserverPanelStore.ts:22 DEFAULT_BUFFER_SIZE = 2000` |
| 8 | "HIL = Hardware-In-the-Loop" (README.md) | CONTRADICTED | project meaning is Human / Actor-In-the-Loop (memory `project_hil_design`, `hil-*` packages, form 801xxx) |
| 9 | Report tabs (stage/timeline/performance) are future | VERIFIED | not registered |
| 10 | Console Log tab is off by default, persists in `consoleLog.enabled` (ObserverPane.memory.md) | VERIFIED (design) | registered at FlowObserverInit.tsx:181; localStorage key documented; runtime toggle not re-tested |
| 11 | "Observability form maps to `observability` nested object" (forms-ai-agent\01-observability.md) | CONTRADICTED | stored flat (DB elements 2264, 2310) |
| 12 | "Log Summary Only logs up to 200 chars / Mask logs only counts" (form help text) | CONTRADICTED | no live consumer; `logOnlySummary` acts as kill switch (Section 1.5) |
| 13 | Flow Insights Activity Log 401 "Invalid tenant context" (BUILD_STATUS.md:195) | NOT VERIFIED | endpoint not called in this task |
| 14 | Delivery of Flow Insights tabs from `Process_*` tables | VERIFIED (data exists) | row counts above; endpoints found in code |
| 15 | FlowObserver panel design v4 (docked/collapsed/fullscreen/floating/closed modes) | NOT VERIFIED | design doc only read; not checked in code |
| 16 | SignalR channel/method names for panels | VERIFIED | hub `/hubs/execution` (`ProcessEngineSignalRExtensions.cs:71`), methods `ReceiveServerEvent`, `ReceiveNodeLog`, `ReceiveNodeActivity`, `ReceiveHilEvent` (`ProcessEngineEventService.cs:706-718`, `WorkflowSignalREventProducer.cs:60,120-129`) |

### 2.5 How the panels relate to the Part-1 settings (what must be ON)

| To see ... | Setting(s) that must be effectively ON (nested `observability` keys) | Notes |
|---|---|---|
| Any per-stage timeline row for a node | `enabled` + `logLevel=Debug` + `enableNodeLifeCycleEvents` + `enableNodeLifeCycleGenericEvents` | otherwise only NodeExecuting/NodeExecuted and the always-on events |
| Node Input pane | `enabled`, `logLevel=Debug`, `logOnlySummary=false`, `enableNodeLifeCycleEvents`, `enableNodeLifeCycleInputEvents` | shows scrubbed input unless raw is exposed; hub may still send raw input (risk 6) |
| Node Output pane | `enableNodeLifeCycleSuccessEvents` (Completed event) | output comes from the hub envelope |
| Node Config pane | nothing | ungated ConfigResolution event |
| Error rows | `enableNodeLifeCycleErrorEvents` | engine `NodeError` event ungated |
| HIL rows | `enableNodeHilEvents` (default true) | plus engine suspension events |
| Flow Insights tabs | nothing | read Process_* tables |
| Console Log | nothing | client side |
| Raw (unmasked) values in the panel | `exposeRawDataInEvents` (+ enabled, Debug, summary off) | ineffective today; raw leaks anyway via hub |

Since the form values are not read today, every panel currently behaves as if all of the above were ON (defaults), except
that a saved-off switch does nothing.

### 2.6 Open questions

1. Which storage shape is canonical: nested `observability` object, or flat root keys with a reader fallback? (blocks Part 1.)
2. Should default be "on" (current C#) or "off" (form default)? Privacy vs. debuggability.
3. Should node input/output capture (`Process_NodeActivityLogs`, hub envelope) obey the observability mode, and what retention
   applies to `Process_NodeActivityLogs`?
4. Should the Obs_* tables be populated by the engine (Step/Node logs per node) or dropped? Nothing writes them today, and
   the observer panels and Flow Insights do not read them.
5. Is "document observability" the Observer/Observe panels, or Document Sharing (`Doc_*`) observability? The empty
   `observe-panels` folder suggests the intended docs are not written yet.
6. Is `WriteDebugJson2` disk output restricted to development builds? (not located)
7. Do other Atlas forms reuse the control ids `enabled` / `logLevel` (collision at the flat config root)?

## 3. Unverified items (summary)

* Content of ARCHITECTURE, DATA-FLOWS, IMPLEMENTATION, ROADMAP, resources, DESIGN_HIL_EVENTS, CRITICAL_REVIEW_FINDINGS,
  flow-footer, flow-observer-contracts (listed, not read).
* Whether the Studio dialog persists control VALUES of `FormContainerControl` under a nested `rootPath` (only the flat
  behaviour was proven from the two DB rows).
* `WriteDebugJson2` definition and gating.
* Whether `ValidateAsync`/`LoadAndValidateConfigAsync` always runs before `Execute` on every path.
* Runtime behaviour (no workflow was executed; no live SignalR capture was done). All effects above are from code reading.
* Flow Insights Activity Log 401 status and the Octopus tab.
