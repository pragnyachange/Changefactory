declare namespace Pqf {
namespace acm {
interface ApiClientInfo {
    application: string;
    appVersion: string;
    appCompany: string;
}
}

namespace acm {
interface ApiTokenAuthorizationRequest {
    tokenId: string;
    clientInfoProvided: acm.ApiClientInfo;
    requestedFromAddress: string;
    yourAddress: string;
    requestedAt: Date;
}
}

namespace acm {
interface ApiTokenLog extends pf.Reference {
    clientInfoProvided: acm.ApiClientInfo;
    authorizedAt: Date;
    lastAccessAddress: string;
    lastAccessAt: Date;
    expiry: Date;
}
}

namespace acm {
interface ApiTokenWithAuthUrl {
    apiToken: string;
    authorizationUrl: string;
    authorizationDeadline: Date;
}
}

namespace acm {
interface AuthenticationState {
    tenant: boolean;
    preAuthenticated: boolean;
    fullyAuthenticated: boolean;
}
}

namespace acm {
interface Challenge {
    challengeText: string;
    challengeImageUrl: string;
    challengeType: acm.ChallengeType;
    challengeRegex: string;
    challengeHint: string;
}
}

namespace acm {
interface ChallengeAnswer {
    answer: string;
}
}

namespace acm {
type ChallengeType = unknown;
}

namespace acm {
interface ChangePassword {
    oldpassword: string;
    newpassword: string;
}
}

namespace acm {
type ConfidentialityLevel = unknown;
}

namespace acm {
interface Confidentiality extends pf.VersionedReference {
    confidentiality: acm.ConfidentialityLevel;
}
}

namespace acm {
interface CubeMappingForType {
    relations: pf.RelationType;
    states: lcy.LifecycleState;
    actions: string[];
    byRelationState: acm.CubeMappingItem;
}
}

namespace acm {
interface CubeMappingItem {
    byAction: string[];
    transitions: acm.TransitionPermission;
}
}

namespace acm {
interface CubeViewForId {
    users: acm.User;
    states: lcy.LifecycleState;
    actions: string[];
    byUserState: acm.CubeViewForIdItem;
}
}

namespace acm {
interface CubeViewForType {
    userRoles: acm.UserRole;
    relations: pf.RelationType;
    states: lcy.LifecycleState;
    actions: string[];
    byRoleRelationState: acm.CubeViewForTypeItem;
}
}

namespace acm {
interface CubeViewForIdItem {
    byAction: pf.Grant;
    transitions: acm.TransitionGrant;
}
}

namespace acm {
interface CubeViewForTypeItem {
    byAction: pf.GrantLevel;
    transitions: acm.TransitionGrantLevel;
}
}

namespace acm {
interface FirstFactorAuthority extends pf.Item {
    loginRedirectUrl: string;
}
}

namespace acm {
interface LoginLog {
    timestamp: Date;
    loginLogType: acm.LoginLogType;
    message: string;
}
}

namespace acm {
type LoginLogType = unknown;
}

namespace acm {
interface InteractiveLoginRequest {
    username: string;
    password: string;
    language: string;
    timezone: string;
}
}

namespace acm {
interface LogoutResponse {
    redirectUrl: string;
}
}

namespace acm {
interface Permission extends pf.Reference {
    description: string;
}
}

namespace acm {
interface PermissionWithParents extends Permission {
    parents: string;
}
}

namespace acm {
interface Saml2IdentityProvider extends pf.Item {
    primaryCertificateFingerprint: string;
    secondaryCertificateFingerprint: string;
    signInUrl: string;
    signOutUrl: string;
    eMailField: string;
    userIdField: string;
    realNameField: string;
    mobileNumberField: string;
    groupsField: string;
    userRoleMapping: acm.Saml2UserRoleMapping;
    issuerUrl: string;
    assertionConsumerServiceUrl: string;
    directLoginUrl: string;
    secondAuthorityDefault: string;
    receiveNotificationsDefault: boolean;
    logAssertions: boolean;
    allowInsecureSignatureAlgorithm: boolean;
    logs: acm.LoginLog;
    signRequest: boolean;
    sendAcsUrl: boolean;
    tenantSpecificIssuer: boolean;
    requestPersistentId: boolean;
    certificateInfo: pf.CertificateInfo;
}
}

namespace acm {
interface Saml2UserRoleMapping extends pf.Reference {
    userRoleId: string;
    mode: acm.Saml2UserRoleMappingMode;
    group: string;
}
}

namespace acm {
type Saml2UserRoleMappingMode = unknown;
}

namespace acm {
interface TransitionGrant {
    transition: lcy.LifecycleTransition;
    grant: pf.Grant;
}
}

namespace acm {
interface TransitionGrantLevel {
    transition: lcy.LifecycleTransition;
    grant: pf.GrantLevel;
}
}

namespace acm {
interface TransitionPermission {
    transition: lcy.LifecycleTransition;
    permission: string;
}
}

namespace acm {
interface User extends pf.VersionedReference {
    firstAuthority: string;
    secondAuthority: string;
    name: string;
    resource: pf.Item;
    email: string;
    mobile: string;
    receiveNotifications: boolean;
    language: string;
    timezone: string;
    lastLogin: Date;
    passwordExpiry: Date;
    accountExpiry: Date;
    autoLogout: boolean;
    active: boolean;
}
}

namespace acm {
interface UserAuthorization {
    id: string;
    description: string;
    grantLevel: pf.GrantLevel;
}
}

namespace acm {
interface UserCertificate extends pf.Reference {
    raw: string;
    server: string;
    tenant: string;
    edition: string;
    authority: string;
    userId: string;
    userName: string;
    eMail: string;
    logonUrl: string;
    validity: Date;
    fingerprint: string;
}
}

namespace acm {
interface UserPreferences extends pf.Reference {
    language: string;
    timezone: string;
    currency: string;
}
}

namespace acm {
interface UserRole extends pf.Item {
    parentId: string;
}
}

namespace acm {
interface UserRoleTranslated extends pf.ItemTranslated {
    parentId: string;
}
}

namespace acm {
interface UserRoleAuthorization {
    id: string;
    grant: pf.GrantLevel;
}
}

namespace acm {
interface WelcomeMessage extends pf.Reference {
    sticky: boolean;
    subject: string;
    message: string;
}
}

namespace act {
interface ActualsPeriod extends pf.Reference {
    beg: string;
    end: string;
}
}

namespace act {
interface ProjectTime {
    day: string;
    projectId: string;
    workItemId: string;
    duration: string;
    comment: string;
    combined?: boolean;
}
}

namespace act {
interface ProjectTimeActual extends pf.VersionedReference {
    day: string;
    resourceId: string;
    projectId: string;
    workItemId: string;
    duration: string;
    comment: string;
}
}

namespace act {
interface ResourceActualsPeriod extends ActualsPeriod {
    resourceId: string;
}
}

namespace act {
interface ResourcePresence {
    id: string;
    start: Date;
    end: Date;
    startClocked: Date;
    endClocked: Date;
    overrideStart: boolean;
    overrideEnd: boolean;
    comment: string;
}
}

namespace act {
interface ResourceAbsence {
    duration: string;
    absenceType: string;
}
}

namespace act {
interface ResourceTimeCorrection {
    date: string;
    duration: string;
    comment: string;
    type: string;
}
}

namespace act {
interface TimeBalance {
    duration: string;
    year: number;
}
}

namespace act {
interface ResourceDaySummary {
    target: string;
    sumAbsences: string;
    sumPresences: string;
    absences: act.ResourceAbsence;
}
}

namespace act {
interface ProjectEfforts {
    id: string;
    planned: string;
    actual: string;
    remaining: string;
}
}

namespace act {
interface PhaseEfforts {
    id: string;
    planned: string;
    actual: string;
    remaining: string;
}
}

namespace act {
interface ProjectWithPhasesEfforts {
    id: string;
    planned: string;
    actual: string;
    remaining: string;
    phaseEfforts: act.PhaseEfforts;
}
}

namespace alc {
interface Planning {
    begin: string;
    shifts: alc.ShiftPlanning;
}
}

namespace alc {
type MacroAllocationGrouping = unknown;
}

namespace alc {
interface ShiftPlanning {
    shift: res.ResourceShift;
    slots: alc.PlanningSlot;
}
}

namespace alc {
interface PlanningSlot {
    absence: alc.AbsenceSlot;
    allocation: alc.MicroAllocationSlot;
    presence: boolean;
    model: alc.ModelSlot;
    presenceDesc: string;
}
}

namespace alc {
interface ModelSlot {
    presence: boolean;
    duration: string;
    holiday: string;
}
}

namespace alc {
interface MicroAllocationStatistics {
    absences: alc.MicroAllocationSlotCount;
    projects: alc.MicroAllocationSlotCount;
    available: alc.MicroAllocationSlotCount;
    unavailable: alc.MicroAllocationSlotCount;
}
}

namespace alc {
interface MicroAllocationSlotCount {
    id: string;
    hint: string;
    slotcount: number;
}
}

namespace alc {
interface MicroAllocationSlot {
    projectId: string;
    projectName: string;
    scenarioId: string;
    scenarioName: string;
    phaseId: string;
    phaseName: string;
}
}

namespace alc {
interface ProjectWithPhases extends pf.Item {
    phases: pf.GanttItem;
}
}

namespace alc {
interface MacroAllocationStructure {
    projects: alc.ProjectWithPhases;
}
}

namespace alc {
interface AbsenceSlot {
    absenceType: string;
    absenceName: string;
    absenceColor: string;
    remark: string;
}
}

namespace alc {
interface AllocationHistory extends pf.Reference {
    activeScenarioTimeline: pf.ItemTimelineWithReference;
    absencesTimeline: alc.MicroAllocationTimeline;
    reservationsTimeline: alc.MicroAllocationTimeline;
    workItemTimeline: alc.WorkItemTimeline;
    allocationTimeline: alc.MacroAllocationTimeline;
}
}

namespace alc {
type AllocationWorkflowState = unknown;
}

namespace alc {
interface AvailabilitySlot {
    availability: string;
    capacity: string;
    fte: string;
    ftePercent: number;
}
}

namespace alc {
interface WorkItemTimeline {
    items: alc.WorkItemTimelineEntry;
    ref: pf.Reference;
}
}

namespace alc {
interface WorkItemTimelineEntry {
    current: pm.WorkItem;
    previous: pm.WorkItem;
    pointInTime: Date;
    user: pf.Item;
}
}

namespace alc {
interface MacroAllocationTimeline {
    items: alc.MacroAllocationTimelineEntry;
    ref: pf.Reference;
}
}

namespace alc {
interface MacroAllocationTimelineEntry {
    current: alc.ResourceAllocation;
    previous: alc.ResourceAllocation;
    workItem: pf.Item;
    workItemStart: Date;
    workItemEnd: Date;
    pointInTime: Date;
    user: pf.Item;
}
}

namespace alc {
interface MicroAllocationTimeline {
    items: alc.MicroAllocationTimelineEntry;
}
}

namespace alc {
interface MicroAllocationTimelineEntry extends pf.ItemTimelineEntry {
    date: string;
    shift: string;
}
}

namespace alc {
interface MacroAllocationSlot extends AvailabilitySlot {
    presence: string;
    expectedPresence: string;
    deviationFromOptimum: number;
    forecasts: alc.TimeForecast;
}
}

namespace alc {
interface ProjectAllocation {
    project: pf.ItemWithDeletedFlag;
    projectStatus: pf.Item;
    isActive: boolean;
    planned: string;
    actual: string;
    expectedPending: string;
    remaining: string;
}
}

namespace alc {
interface ProjectAllocations {
    availability: string;
    projects: alc.ProjectAllocation;
}
}

namespace alc {
interface ProjectWorkItemAllocation {
    workItem: pf.Item;
    planned: string;
    actual: string;
    expectedPending: string;
    remaining: string;
}
}

namespace alc {
interface ProjectWorkItemAllocations {
    resource: pf.ItemWithDeletedFlag;
    availability: string;
    workItems: alc.ProjectWorkItemAllocation;
}
}

namespace alc {
interface ResourceAllocation extends pf.VersionedReference {
    projectId: string;
    scenarioId: string;
    workItemId: string;
    resourceType: string;
    resourceId: string;
    state: alc.AllocationWorkflowState;
    amount: number;
    amountMin?: number;
    amountMax?: number;
    amountUnit: string;
    amountType: alc.ResourceAllocationAmountType;
    startEarliest: string;
    startLatest: string;
    endEarliest: string;
    endLatest: string;
    remark: string;
    effectiveDuration: string;
}
}

namespace alc {
type ResourceAllocationAmountType = unknown;
}

namespace alc {
interface ResourceAllocationWorkflowHistory extends pf.Reference {
    state: alc.AllocationWorkflowState;
    timestamp: Date;
    initiatedBy: pf.ItemWithDeletedFlag;
    remark: string;
}
}

namespace alc {
interface TimeForecast {
    planned: string;
    actual: string;
    expectedActual: string;
    remaining: string;
}
}

namespace alc {
interface Workload {
    maxFtePercent: number;
    maxCapacity: string;
    grouping: string[];
    slots: alc.MacroAllocationSlot;
    actualsReportedUntil: string;
    presenceReportedUntil: string;
}
}

namespace alc {
interface WorkloadByResource {
    resource: pf.Reference;
    workload: alc.Workload;
}
}

namespace atm {
interface CompileError {
    source: string;
    line?: number;
    message: string;
}
}

namespace atm {
interface JavaScriptChangeTrigger extends pf.Reference {
    objectType: string;
    objectId: string;
    action: pf.Action;
}
}

namespace atm {
interface JavaScriptConsole {
    logs: atm.JavaScriptConsoleLog;
}
}

namespace atm {
interface JavaScriptConsoleLog {
    timestamp: Date;
    sandboxId: string;
    type: atm.JavaScriptConsoleLogType;
    text: string;
}
}

namespace atm {
type JavaScriptConsoleLogType = unknown;
}

namespace atm {
interface JavaScriptLibrary extends pf.Reference {
    name: string;
    version: string;
    authors: string;
    license: string;
    url: string;
}
}

namespace atm {
interface JavaScriptPerformanceStats {
    successful: number;
    failed: number;
    totalRunTimeMs: number;
    totalApiStats: atm.JavaScriptApiPerformanceStats;
    totalJavaScriptRunTimeMs: number;
}
}

namespace atm {
interface JavaScriptApiPerformanceStats {
    endpoint: string;
    count: number;
    totalRunTimeMs: number;
}
}

namespace atm {
interface JavaScriptQuota {
    max: string;
    used: string;
}
}

namespace atm {
interface JavaScriptSource extends pf.VersionedItem {
    libraries: string;
    shareAsLibrary: boolean;
    permissionOverride: boolean;
    sourceCode: string;
}
}

namespace cht {
interface Baseline extends pf.Item {
    values: string[];
    refs: pf.Item;
    scale: cht.ScalePoint;
}
}

namespace cht {
interface BaselineDayDef {
    from: string;
    to: string;
    unit: string;
}
}

namespace cht {
interface BaselineModel extends pf.Item {
    baselineType: string;
    filterType: string;
    datasetGroups: cht.DatasetModelGroup;
}
}

namespace cht {
interface BaselineLifecycleDef {
    stateIds: string[];
}
}

namespace cht {
interface BaselineProjectDef {
    portfolioId: string;
    portfolioIds: string;
    managementMethodId: string;
    properties: pf.KeyValuePair;
    classifications: pf.KeyValuePair;
    projectIds: string[];
    stateIds: string[];
    indicators: cht.IndicatorFiltersDef;
}
}

namespace cht {
interface BaselineProjectPortfolioDef {
    portfolioId: string;
    portfolioIds: string;
    properties: pf.KeyValuePair;
}
}

namespace cht {
interface IndicatorFiltersDef {
    reportType: string;
    leading: cht.IndicatorSelectorDef;
    dimensions: cht.IndicatorSelectorDef;
    details: cht.IndicatorSelectorDef;
}
}

namespace cht {
interface IndicatorSelectorDef {
    compare: string;
    id: string;
    values: string;
}
}

namespace pf {
interface KeyValuePair {
    key: string;
    value: string;
}
}

namespace cht {
interface Chart {
    baseline: cht.Baseline;
    datasets: cht.Dataset;
}
}

namespace cht {
interface ChartModel extends pf.Reference {
    baselines: cht.BaselineModel;
}
}

namespace cht {
interface Dataset extends pf.Item {
    semantics: string;
    unit: string;
    values: string[];
    scale: cht.ScalePoint;
}
}

namespace cht {
interface DatasetAggregationDef {
    aggregation: pf.Aggregation;
}
}

namespace cht {
interface DatasetDayDef {
    unit: string;
}
}

namespace cht {
interface DatasetLifecycleStateDef {
    stateIds: string[];
    aggregation: pf.Aggregation;
}
}

namespace cht {
interface DatasetModel extends pf.Item {
    datasetType: string;
    filterType: string;
}
}

namespace cht {
interface DatasetModelGroup extends pf.Item {
    datasets: cht.DatasetModel;
}
}

namespace cht {
interface DatasetProjectsDef {
    portfolioId: string;
    portfolioIds: string;
    projectIds: string[];
    stateIds: string[];
    aggregation: pf.Aggregation;
}
}

namespace cht {
interface DatasetProjectPortfoliosDef {
    portfolioId: string;
    portfolioIds: string;
    aggregation: pf.Aggregation;
}
}

namespace cht {
interface DatasetProjectAndCostsDef {
    portfolioId: string;
    portfolioIds: string;
    projectIds: string[];
    stateIds: string[];
    costsContainerIds: string[];
    costsTypeIds: string[];
    aggregation: pf.Aggregation;
}
}

namespace cht {
interface ScalePoint {
    value: string;
    label: pf.Item;
}
}

namespace clf {
interface CockpitWidget extends pf.Item {
    objectType: string;
    widgetType: string;
    definition: string;
    sortIndex: number;
    tags: string[];
    category: string;
}
}

namespace clf {
interface CockpitWidgetTranslated extends pf.ItemTranslated {
    objectType: string;
    widgetType: string;
    definition: string;
    sortIndex: number;
    tags: pf.Translation;
    category: pf.Translation;
    sandboxId: string;
}
}

namespace clf {
interface ObjectStoreReference extends pf.Reference {
    storeId: string;
}
}

namespace clf {
interface ThirdPartyError {
    type: string;
    method: string;
    url: string;
    statusCode: string;
    message: string;
    clientVersion: string;
    details: string;
}
}

namespace clf {
interface NewUuidArray {
    newUuids: string;
}
}

namespace clf {
interface UuidArray {
    uuids: string;
}
}

namespace cls {
interface Classification {
    classificationSchemaId: string;
    data: cls.ClassificationData;
    classificationId: string;
    score?: number;
}
}

namespace cls {
interface ClassificationAttribute extends pf.Item {
    weight: number;
    values: cls.ClassificationAttributeValue;
}
}

namespace cls {
interface ClassificationAttributeTranslated extends pf.ItemTranslated {
    weight: number;
    values: cls.ClassificationAttributeValueTranslated;
}
}

namespace cls {
interface ClassificationAttributeValue extends pf.Item {
    points: number;
}
}

namespace cls {
interface ClassificationAttributeValueTranslated extends pf.ItemTranslated {
    points: number;
}
}

namespace cls {
interface ClassificationClass extends pf.Item {
    minPoints: number;
}
}

namespace cls {
interface ClassificationClassTranslated extends pf.ItemTranslated {
    minPoints: number;
}
}

namespace cls {
interface ClassificationData {
    attributeId: string;
    valueId: string;
    description: string;
}
}

namespace cls {
type ClassificationPresentation = unknown;
}

namespace cls {
interface ClassificationSchema extends pf.Item {
    objectType: string;
    classes: cls.ClassificationClass;
    attributes: cls.ClassificationAttribute;
    sortIndex: number;
    presentation: cls.ClassificationPresentation;
    precision: number;
    customCalculationRule: string;
}
}

namespace cls {
interface ClassificationSchemaTranslated extends pf.ItemTranslated {
    objectType: string;
    classes: cls.ClassificationClassTranslated;
    attributes: cls.ClassificationAttributeTranslated;
    sortIndex: number;
    presentation: cls.ClassificationPresentation;
    precision: number;
    customCalculationRule: string;
}
}

namespace clu {
interface ClusterState extends State {
    totalNodes: number;
    runningNodes: number;
    nodes: clu.NodeState;
}
}

namespace clu {
type NodeState = unknown;
}

namespace clu {
interface State {
    state: clu.States;
    responseTime?: number;
    load?: number;
}
}

namespace clu {
type States = unknown;
}

namespace dgn {
interface ServerEnvironment {
    snapshot: Date;
    osName: string;
    osArch: string;
    osVersion: string;
    processorCount: number;
    memorySize: number;
    java: string;
    time: Date;
    datastore: dgn.ServerEnvironmentDataStore;
}
}

namespace dgn {
interface ServerEnvironmentDataStore {
    productName: string;
    productVersion: string;
    host: string;
    location: string;
    settings: dgn.KeyValuePair;
}
}

namespace dgn {
interface KeyValuePair {
    key: string;
    value: string;
}
}

namespace dgn {
interface ErrorLog {
    tenant: string;
    alias: string;
    id: string;
    subsystem: string;
    type: string;
    method: string;
    url: string;
    statusCode: string;
    message: string;
    details: string;
    serverVersion: string;
    clientVersion: string;
    browser: string;
    clientIp: string;
    firstOccurrence: Date;
    lastOccurrence: Date;
}
}

namespace dgn {
interface PerformanceIndicators {
    snapshot: Date;
    memorySize: number;
    heapSize: number;
    processorLoad: number;
    memoryLoad: number;
    heapLoad: number;
    startUp: Date;
    counters1h: dgn.PerformanceCounter;
    counters24h: dgn.PerformanceCounter;
    events24h: dgn.EventHistory;
    queues24h: dgn.QueueHistory;
    gcInfo: dgn.PerformanceGcInfo;
}
}

namespace dgn {
interface PerformanceCounter {
    func: string;
    count: number;
    avg: number;
    min: number;
    max: number;
}
}

namespace dgn {
interface EventHistory {
    func: string;
    timeline: number;
}
}

namespace dgn {
interface QueueHistory {
    func: string;
    timeline: dgn.MinMax;
}
}

namespace dgn {
interface MinMax {
    min: number;
    max: number;
}
}

namespace dgn {
interface PerformanceGcInfo {
    lastRun: dgn.PerformanceGcLastRun;
    stats1h: dgn.PerformanceCounter;
    stats24h: dgn.PerformanceCounter;
}
}

namespace dgn {
interface PerformanceGcLastRun {
    name: string;
    cause: string;
    action: string;
    usedBefore: number;
    usedAfter: number;
    at: Date;
}
}

namespace doc {
type ExportType = unknown;
}

namespace doc {
interface ExportViewConfiguration {
    id: string;
    name: string;
    description: string;
    options: string;
    exportTemplates: string;
    objectTypes: string;
}
}

namespace doc {
type ExportViewType = unknown;
}

namespace doc {
interface ExportRequestView {
    exportViewType: doc.ExportViewType;
    options: string;
    configurationViewId: string;
    appendixTemplateId: string;
}
}

namespace doc {
interface ExportTemplate {
    id: string;
    name: string;
    description: string;
    view: string;
    type: string;
    fileType: string;
    template: string;
}
}

namespace doc {
interface ExportConfigurationRequest {
    name: string;
    description: string;
    view: string;
    options: string;
    exportTemplates: string;
    objectTypes: string;
}
}

namespace doc {
interface ExportRequest {
    type: string;
    format: string;
    templateId: string;
    view: doc.ExportRequestView;
}
}

namespace doc {
interface AvailableExport {
    exportType: string;
    exportFileType: string;
}
}

namespace dpo {
interface DispoAuthorization extends pf.Authorizations {
    changeMacroPlanning: boolean;
}
}

namespace dpo {
interface DispoPhase extends pf.GanttItem {
    progress: number;
    budget: string;
    planned: string;
    assigned: string;
    assignedActual: string;
    assignedExpectedPending: string;
    assignedRemaining: string;
    phaseAssigned: string;
    phaseActual: string;
    phaseExpectedPending: string;
    phaseRemaining: string;
    state: alc.AllocationWorkflowState;
    shared: boolean;
    parentPhaseId: string;
    authorizations: dpo.DispoAuthorization;
}
}

namespace dpo {
interface ProjectWithPhases extends pf.GanttItem {
    stateId: string;
    phases: dpo.DispoPhase;
}
}

namespace dpo {
interface ResourceAllocationWithPhasesAndAbsences {
    projects: dpo.ProjectWithPhases;
    absences: pf.GanttItem;
}
}

namespace exp {
interface JavaScriptExportDefinition extends pf.VersionedItem {
    attachmentId: string;
    sandboxId: string;
    objectTypes: string;
    features: string;
    includeInBackup: boolean;
}
}

namespace fco {
interface Currency extends pf.Item {
    sortIndex: number;
}
}

namespace fco {
interface CurrencyAmount {
    amount: number;
    currency: string;
}
}

namespace fco {
interface ConvertedCurrencyAmount {
    original: fco.CurrencyAmount;
    converted: fco.CurrencyAmount;
}
}

namespace fco {
interface CurrencyExchangeRate {
    validityStart: string;
    rate: number;
}
}

namespace fco {
interface CurrencyExchangeRates extends pf.VersionedReference {
    rates: fco.CurrencyExchangeRate;
}
}

namespace fco {
interface BudgetCalculated {
    budgetAmount: fco.CurrencyAmount;
    assignedAmount: fco.CurrencyAmount;
    bufferAmount: fco.CurrencyAmount;
}
}

namespace fco {
interface BudgetPosition extends pf.VersionedItemWithProperties {
    budgetAmount: fco.CurrencyAmount;
    assignedAmount: fco.CurrencyAmount;
    bufferAmount: fco.CurrencyAmount;
    costsType: pf.NamedReference;
    sortIndex: number;
    source: fco.BudgetSource;
}
}

namespace fco {
interface BudgetPositionsByReference {
    ref: pf.Reference;
    positions: fco.BudgetPosition;
}
}

namespace fco {
interface BudgetSource {
    projectPortfolioId: string;
    originId: string;
}
}

namespace fco {
interface CostsActual extends pf.VersionedReference {
    name: string;
    code: string;
    description: string;
    iconRef: string;
    color: string;
    validityStart: string;
    validityEnd: string;
    properties: pf.Property;
    timeOfPayment: string;
    plannedAmount: fco.ConvertedCurrencyAmount;
    sortIndex: number;
}
}

namespace fco {
interface CostsActualGroup {
    group: pf.NamedReference;
    actuals: fco.CostsActual;
}
}

namespace fco {
type CostsDimension = unknown;
}

namespace fco {
type CostsFlow = unknown;
}

namespace fco {
interface CostsForecast extends CostsForecastCalculated {
    type: pf.NamedReference;
}
}

namespace fco {
interface CostsForecastCalculated {
    planned: fco.CurrencyAmount;
    actual: fco.CurrencyAmount;
    expectedPending: fco.CurrencyAmount;
    remaining: fco.CurrencyAmount;
}
}

namespace fco {
interface CostsForecasts {
    forecasts: fco.CostsForecast;
    forecastTotal: fco.CostsForecastCalculated;
    forecast: fco.CurrencyAmount;
}
}

namespace fco {
interface CostsForecastGroup extends CostsForecasts {
    typeGroup: pf.NamedReference;
}
}

namespace fco {
interface CostsForecastsGroups {
    forecasts: fco.CostsForecastGroup;
    forecastTotal: fco.CostsForecastCalculated;
    forecast: fco.CurrencyAmount;
}
}

namespace fco {
interface CostsMatrix extends CostsMatrixGroup {
    calendar: pf.Calendar;
    hierarchy: fco.CostsMatrixHierarchy;
}
}

namespace fco {
interface CostsMatrixGroup {
    layers: fco.CostsMatrixLayer;
    groups: fco.CostsMatrixGroup;
    total: fco.CurrencyAmount;
}
}

namespace fco {
interface CostsMatrixHierarchy {
    dimension: fco.CostsDimension;
    label: string;
    items: pf.Item;
}
}

namespace fco {
interface CostsMatrixLayer {
    rangeToToday: fco.CurrencyAmount;
    rangeFromToday: fco.CurrencyAmount;
    ranges: fco.CurrencyAmount;
}
}

namespace fco {
interface CostsOverview {
    reference: pf.Reference;
    budgets: fco.BudgetPosition;
    budgetsInForeignObjs: fco.BudgetCalculated;
    budgetsInSubObjs: fco.BudgetCalculated;
    managedBudgetTotal: fco.BudgetCalculated;
    budgetsInExternalObjsTotal: fco.BudgetCalculated;
    managedBudgetWithSubObjsTotal: fco.BudgetCalculated;
    budgetTotal: fco.BudgetCalculated;
    forecasts: fco.CostsForecastGroup;
    forecastTotal: fco.CostsForecastCalculated;
    forecast: fco.CurrencyAmount;
    plannedDiffBudget: fco.CurrencyAmount;
    plannedDiffAssignedBudget: fco.CurrencyAmount;
    actualDiffPlanned: fco.CurrencyAmount;
    forecastDiffPlanned: fco.CurrencyAmount;
    forecastDiffBudget: fco.CurrencyAmount;
    forecastDiffAssignedBudget: fco.CurrencyAmount;
}
}

namespace fco {
interface CostsPosition extends pf.VersionedReference {
    name: string;
    code: string;
    description: string;
    iconRef: string;
    color: string;
    validityStart: string;
    validityEnd: string;
    properties: pf.Property;
    costsType: pf.NamedReference;
    costsCenter: pf.NamedReference;
    payPlan: pf.NamedReference;
    plannedAmount: fco.ConvertedCurrencyAmount;
    supplementaryAmount: fco.ConvertedCurrencyAmount;
    remainingAmount: fco.ConvertedCurrencyAmount;
    provisionalAmount: fco.CurrencyAmount;
    actualAmount: fco.CurrencyAmount;
    availableAmount: fco.CurrencyAmount;
    obligo: boolean;
    sortIndex: number;
    forecastScheme: fco.ForecastSchema;
}
}

namespace fco {
interface CostsType extends pf.Item {
    group: fco.CostsTypeGroup;
    payPlan: string;
    sortIndex: number;
}
}

namespace fco {
interface CostsTypeTranslated extends pf.ItemTranslated {
    groupId: string;
    payPlan: string;
    sortIndex: number;
}
}

namespace fco {
interface CostsTypeGroup extends pf.Item {
    sortIndex: number;
}
}

namespace fco {
interface CostsTypeGroupTranslated extends pf.ItemTranslated {
    sortIndex: number;
}
}

namespace fco {
interface ExternalBudget {
    budget: pf.NamedReference;
    portfolio: pf.NamedReference;
    amount: fco.CurrencyAmount;
}
}

namespace fco {
type ForecastSchema = unknown;
}

namespace fco {
interface ProjectCostsPosition extends CostsPosition {
    assignedWorkItems: pf.Item;
}
}

namespace fco {
interface ProjectCostsPositionWithActuals extends ProjectCostsPosition {
    actuals: fco.CostsActual;
}
}

namespace lcy {
interface ItemWithLifecycle extends pf.Item {
    lifecycleState: lcy.LifecycleStateWithSubState;
}
}

namespace lcy {
type LifecycleCategory = unknown;
}

namespace lcy {
interface LifecycleHistory extends pf.Reference {
    version: string;
    state: lcy.LifecycleStateWithSubState;
    transition: lcy.LifecycleTransition;
    timestamp: Date;
    initiatedBy: pf.ItemWithDeletedFlag;
    remark: string;
}
}

namespace lcy {
interface LifecycleHistoryArrayWithObjId {
    objectId: string;
    history: lcy.LifecycleHistory;
}
}

namespace lcy {
interface LifecycleState extends LifecycleStateBase {
    subStates: lcy.LifecycleSubState;
}
}

namespace lcy {
interface LifecycleStateArrayWithObjId {
    objectId: string;
    states: lcy.LifecycleState;
}
}

namespace lcy {
interface LifecycleStateBase extends pf.ItemWithProperties {
    category: lcy.LifecycleCategory;
    isDecision: boolean;
    sortIndex: number;
    posX?: number;
    posY?: number;
    radius?: number;
}
}

namespace lcy {
interface LifecycleStateTranslated extends pf.ItemTranslatedWithProperties {
    category: lcy.LifecycleCategory;
    isDecision: boolean;
    sortIndex: number;
    posX?: number;
    posY?: number;
    radius?: number;
}
}

namespace lcy {
interface LifecycleStateWithSubState extends LifecycleStateBase {
    subState: lcy.LifecycleSubState;
}
}

namespace lcy {
interface LifecycleStateWithSubStateReference extends pf.Reference {
    subState: pf.Reference;
}
}

namespace lcy {
interface LifecycleStateWithSubStateAndObjId extends LifecycleStateWithSubState {
    objectId: string;
}
}

namespace lcy {
type LifecycleSubState = unknown;
}

namespace lcy {
interface LifecycleSubStateTranslated extends pf.ItemTranslated {
    sortIndex: number;
}
}

namespace lcy {
interface LifecycleTransition extends pf.ItemWithProperties {
    from: lcy.LifecycleStateWithSubState;
    to: lcy.LifecycleStateWithSubState;
}
}

namespace lcy {
interface LifecycleTransitionTranslated extends pf.ItemTranslatedWithProperties {
    from: lcy.LifecycleStateWithSubStateReference;
    to: lcy.LifecycleStateWithSubStateReference;
}
}

namespace lcy {
interface LifecycleTransitionArrayWithObjId {
    objectId: string;
    transitions: lcy.LifecycleTransition;
}
}

namespace lcy {
interface ObjectReferencesInLifecycleState extends LifecycleStateWithSubStateReference {
    objects: pf.Reference;
}
}

namespace lcy {
interface ReferenceWithLifecycle extends pf.Reference {
    lifecycleState: string;
}
}

namespace lic {
interface License {
    tenant: string;
    license: string;
}
}

namespace lic {
interface LicenseQuota {
    type: pf.NamedReference;
    usage: number;
    limit?: number;
}
}

namespace lic {
interface LicenseStatus extends pf.Reference {
    company: string;
    admin: string;
    edition: string;
    validUntil: Date;
    usage: lic.LicenseQuota;
}
}

namespace lic {
interface LicenseUsage {
    tenant: string;
    objects: lic.LicenseUsageAmount;
    authorisations: lic.LicenseUsageAmount;
}
}

namespace lic {
interface LicenseUsageAmount {
    id: string;
    count: number;
}
}

namespace main {
interface ServerStatus {
    application: main.StatusItem;
    database: main.StatusItem;
    mail: main.StatusItem;
}
}

namespace main {
type StatusItem = unknown;
}

namespace main {
interface Versions {
    productName: string;
    productVersion: string;
    apiGeneration: string;
    apiVersion: string;
    apiFingerprint: string;
}
}

namespace msg {
interface MessageForwardRule extends pf.Reference {
    subjectRegEx: string;
    bodyRegEx: string;
    sourceTypeRegEx: string;
    sourceIdRegEx: string;
    addresseesShownRegEx: string;
    triggerRegEx: string;
    sortIndex: number;
}
}

namespace msg {
interface Message extends pf.Reference {
    subject: string;
    body: string;
    source: pf.Reference;
    addresseesShown: pf.Item;
    trigger: string;
    urgency: msg.MessageUrgency;
    privacy: msg.MessagePrivacy;
    validityStart: string;
    validityUntil: string;
    createdAt: Date;
    createdBy: pf.Item;
    readAt: Date;
    forwardedAt: Date;
}
}

namespace msg {
interface MessageContent {
    subject: string;
    body: string;
    addressees: string[];
    urgency: msg.MessageUrgency;
    privacy: msg.MessagePrivacy;
    validityStart: string;
    validityUntil: string;
}
}

namespace msg {
type MessagePrivacy = unknown;
}

namespace msg {
type MessageUrgency = unknown;
}

namespace mtg {
interface Meeting extends pf.VersionedItemWithProperties {
    groupId: string;
    location: string;
    timeStart: Date;
    timeEnd: Date;
}
}

namespace mtg {
interface MeetingGroup extends pf.VersionedItemWithProperties {
    parentGroupId: string;
}
}

namespace nav {
interface AddUrlArg {
    url: string;
    behaviour: nav.AddUrlArgBehaviour;
    argumentTypes: string[];
    argumentUrl: string;
    dropPriority: number;
    allowOriginObject: boolean;
    allowOriginLinkType: boolean;
}
}

namespace nav {
type AddUrlArgBehaviour = unknown;
}

namespace nav {
interface DeleteUrl {
    url: string;
    behaviour: nav.DeleteUrlBehaviour;
}
}

namespace nav {
type DeleteUrlBehaviour = unknown;
}

namespace nav {
interface Tab {
    id: string;
    name: string;
    description: string;
    iconRef: string;
    color: string;
}
}

namespace nav {
interface FindLinkQuery extends FindQuery {
    linkType: string;
    forward?: boolean;
}
}

namespace nav {
interface FindMemberRegexQuery {
    member: string;
    regex: string;
}
}

namespace nav {
interface FindMemberTextQuery {
    member: string;
    text: string;
}
}

namespace nav {
interface FindRequest extends FindQuery {
    root: pf.Reference;
}
}

namespace nav {
interface FindQuery {
    objectType: string;
    fulltext: string;
    regex: string;
    ranking?: number;
    memberRegex: nav.FindMemberRegexQuery;
    memberText: nav.FindMemberTextQuery;
    link: nav.FindLinkQuery;
}
}

namespace nav {
interface LinkTypeInfo {
    linktype: string;
    forward: boolean;
    name: string;
    description: string;
    imageUrl: string;
    color: string;
    deleteUrls: nav.DeleteUrl;
    addUrl: string;
    addUrlsArg: nav.AddUrlArg;
    sortIndex: number;
    inheritWorkload: boolean;
    navigable: boolean;
}
}

namespace nav {
interface MemberInfo {
    name: string;
    type: string;
    label: string;
}
}

namespace nav {
interface NavigationContext {
    current: nav.NavigationItem;
    links: nav.NavigationLink;
    ancestors: nav.NavigationItem;
}
}

namespace nav {
interface NavigationItem extends pf.ItemWithDeletedFlag {
    readAuth: pf.Grant;
}
}

namespace nav {
interface NavigationLink {
    parent: nav.NavigationItem;
    linktype: string;
    forward: boolean;
    name: string;
    description: string;
    imageUrl: string;
    color: string;
    items: nav.NavigationLinkedItem;
}
}

namespace nav {
interface NavigationLinkedItem {
    linkId: string;
    item: nav.NavigationItem;
}
}

namespace nav {
interface TypeInfo {
    type: string;
    module: pf.Item;
    name: string;
    url: string;
    members: nav.MemberInfo;
    links: nav.LinkTypeInfo;
    features: nav.Tab;
    showParent: boolean;
    ambiguousParent: boolean;
}
}

namespace pf {
interface Access extends Reference {
    access: pf.AccessType;
}
}

namespace pf {
interface AccessConcurrency {
    object: pf.Reference;
    userIds: string[];
}
}

namespace pf {
type AccessType = unknown;
}

namespace pf {
type Action = unknown;
}

namespace pf {
type Aggregation = unknown;
}

namespace pf {
interface AttachmentDetails extends Reference {
    mimeType: string;
    size: number;
    timestamp: Date;
}
}

namespace pf {
interface AttachmentLink extends DocumentLink {
    attachmentId: string;
    timestamp: Date;
}
}

namespace pf {
interface Authorization {
    objectType: string;
    objectId: string;
    action: string;
    transition: string;
    grant: pf.Grant;
}
}

namespace pf {
interface Authorizations {
    view: boolean;
    change: boolean;
    delete: boolean;
}
}

namespace pf {
interface BackupMetadata {
    type: string;
    name: string;
    code: string;
    description: string;
    createdAt: Date;
}
}

namespace pf {
interface Calendar {
    layers: pf.CalendarLayer;
}
}

namespace pf {
type CalendarGranularity = unknown;
}

namespace pf {
interface CalendarLayer extends Item {
    ranges: pf.CalendarRange;
}
}

namespace pf {
interface CalendarRange {
    label: string;
    first: string;
    last: string;
}
}

namespace pf {
interface CertificateInfo {
    serialNumber: string;
    commonName: string;
    expiry: Date;
    fingerprint: string;
}
}

namespace pf {
interface ConnectionInformationSeenFromClient {
    websocketSessionId: string;
}
}

namespace pf {
interface ConnectionInformationSeenFromServer {
    clientPublicIp: string;
    proxy: string;
    deviceType: string;
    operatingSystem: string;
    browser: string;
}
}

namespace pf {
interface Details extends Reference {
    name: string;
    code: string;
    description: string;
    color: string;
    iconRef: string;
    validityStart: string;
    validityEnd: string;
    properties: pf.Property;
}
}

namespace pf {
interface DocumentLink extends VersionedItemWithProperties {
    parentFolder: string;
    url: string;
    mimeType: string;
    size?: number;
    sortIndex: number;
}
}

namespace pf {
interface DocumentFolder extends VersionedItemWithProperties {
    parentFolder: string;
}
}

namespace pf {
interface EnumType extends Item {
    hardcoded: boolean;
}
}

namespace pf {
interface ErrorInformation {
    id: string;
    message: string;
    internalCode: string;
}
}

namespace pf {
interface Feature {
    type: string;
    id: string;
    feature: string;
}
}

namespace pf {
interface FeatureConcurrency {
    feature: string;
    userIds: string[];
}
}

namespace pf {
interface Flag {
    enabled: boolean;
}
}

namespace pf {
interface GanttItem extends PaletteColorItem {
    ganttId: string;
    beg: Date;
    end: Date;
    fixed: boolean;
}
}

namespace pf {
interface GenericObject extends Reference {
    name: string;
    code: string;
    description: string;
    iconRef: string;
    color: string;
    validityStart: string;
    validityEnd: string;
    properties: pf.Property;
}
}

namespace pf {
type Grant = unknown;
}

namespace pf {
type GrantLevel = unknown;
}

namespace pf {
interface Item extends Reference {
    name: string;
    code: string;
    description: string;
    iconRef: string;
    color: string;
    validityStart: string;
    validityUntil: string;
}
}

namespace pf {
interface ItemWithDeletedFlag extends Item {
    isDeleted: boolean;
}
}

namespace pf {
interface ItemWithDeletedFlagAndModifiedAt extends ItemWithDeletedFlag {
    modifiedAt: Date;
    modifiedBy: pf.Item;
}
}

namespace pf {
interface ItemWithDeletedFlagModifiedAtAndParent extends ItemWithDeletedFlagAndModifiedAt {
    parent: pf.Item;
}
}

namespace pf {
interface ItemTranslated extends Reference {
    name: pf.Translation;
    code: string;
    description: pf.Translation;
    iconRef: pf.Translation;
    color: string;
    validityStart: string;
    validityUntil: string;
}
}

namespace pf {
interface ItemTranslatedWithProperties extends ItemTranslated {
    properties: pf.Property;
}
}

namespace pf {
interface ItemWithProperties extends Item {
    properties: pf.Property;
}
}

namespace pf {
interface Jtf {
    mimeType: string;
    type: string;
    id: string;
    code: string;
    name: string;
    description: string;
    iconRef: string;
    color: string;
    createdAt: Date;
    createdBy: string;
    meta: pf.JtfMeta;
    data: string;
    hints: string;
}
}

namespace pf {
interface JtfWithCharts extends Jtf {
    charts: pf.JtfChart;
    initialChart: string;
}
}

namespace pf {
interface JtfChart {
    id: string;
    name: string;
    description: string;
    iconRef: string;
    color: string;
    hidden?: boolean;
    type: pf.JtfChartType;
    baseline: pf.JtfChartBaseline;
    datasets: pf.JtfChartDataset;
    axis: pf.JtfChartAxis;
    showLegend?: boolean;
}
}

namespace pf {
interface JtfChartAxis {
    showAxisName?: boolean;
    x: pf.JtfChartAxisOptions;
    y: pf.JtfChartAxisOptions;
}
}

namespace pf {
interface JtfChartAxisOptions {
    name: string;
    unit: string;
}
}

namespace pf {
interface JtfChartBaseline {
    id: string;
    name: string;
    description: string;
    type: pf.JtfChartDataType;
    format: pf.JtfChartDataFormat;
}
}

namespace pf {
interface JtfChartDataFormat {
    format: string;
    decimal?: number;
    startAndEnd?: boolean;
}
}

namespace pf {
interface JtfChartDataset {
    id: string;
    name: string;
    description: string;
    type: pf.JtfChartDataType;
    color: string;
    aggregation: pf.JtfMetaColumnOptionsAggregation;
    unit: string;
    format: pf.JtfChartDataFormat;
}
}

namespace pf {
type JtfChartDatasetAggregation = unknown;
}

namespace pf {
type JtfChartDataType = unknown;
}

namespace pf {
type JtfChartType = unknown;
}

namespace pf {
interface JtfMeta {
    categories: pf.JtfMetaCategory;
    columns: pf.JtfMetaColumn;
    options: string;
}
}

namespace pf {
interface JtfMetaCategory {
    id: string;
    label: string;
}
}

namespace pf {
interface JtfMetaColumn {
    id: string;
    catid: string;
    type: pf.JtfMetaColumnDataType;
    label: string;
    options: pf.JtfMetaColumnOptions;
    format: string;
    style: string;
}
}

namespace pf {
type JtfMetaColumnDataType = unknown;
}

namespace pf {
interface JtfMetaColumnOptions {
    width?: number;
    fixed: pf.JtfMetaColumnOptionsFixed;
    resizable?: boolean;
    sortable?: boolean;
    groupable?: boolean;
    filterable?: boolean;
    aggregation: pf.JtfMetaColumnOptionsAggregation;
    hidden?: boolean;
}
}

namespace pf {
type JtfMetaColumnOptionsAggregation = unknown;
}

namespace pf {
type JtfMetaColumnOptionsFixed = unknown;
}

namespace pf {
interface LicenseFeatures {
    features: string;
}
}

namespace pf {
interface LinearFunction {
    a: number;
    b: number;
}
}

namespace pf {
interface Log extends Item {
    createdAt: Date;
    createdBy: pf.Item;
    modifiedAt: Date;
    modifiedBy: pf.Item;
}
}

namespace pf {
interface NamedReference extends Reference {
    name: string;
}
}

namespace pf {
interface ChangeNotification {
    action: pf.ChangeNotificationAction;
    data: pf.Reference;
    parent: pf.Reference;
}
}

namespace pf {
type ChangeNotificationAction = unknown;
}

namespace pf {
interface PaletteColorItem extends Reference {
    name: string;
    code: string;
    description: string;
    iconRef: string;
    color: string;
    validityStart: string;
    validityUntil: string;
}
}

namespace pf {
interface Property {
    key: string;
    value: string;
}
}

namespace pf {
interface PropertyConstraint {
    basetype: string;
    properties: pf.PropertyConstraintAttribute;
}
}

namespace pf {
interface PropertyConstraintAttribute {
    key: string;
    value: string;
}
}

namespace pf {
interface PropertyDefinition extends Reference {
    objectType: string;
    sortIndex: number;
    label: string;
    identifier: string;
    hint: string;
    constraint: pf.PropertyConstraint;
}
}

namespace pf {
interface PropertyDefinitionTranslated extends Reference {
    objectType: string;
    sortIndex: number;
    label: pf.Translation;
    identifier: pf.Translation;
    hint: pf.Translation;
    constraint: string;
}
}

namespace pf {
interface PropertyRef {
    key: string;
    version: string;
}
}

namespace pf {
interface PropertyRefs extends Reference {
    properties: pf.PropertyRef;
}
}

namespace pf {
interface Reference {
    type: string;
    id: string;
}
}

namespace pf {
interface Relation extends Reference {
    relationType: string;
    explicit: boolean;
    name: string;
    source: pf.Reference;
    target: pf.Reference;
}
}

namespace pf {
interface RelationType extends Reference {
    nameForward: string;
    nameBackward: string;
    description: string;
    iconRef: string;
    color: string;
}
}

namespace pf {
interface ExplicitRelationTypeTranslated extends VersionedReference {
    nameForward: pf.Translation;
    nameBackward: pf.Translation;
    description: pf.Translation;
    iconRef: pf.Translation;
    color: string;
    sourceTypes: string[];
    sourcesUrl: string;
    createTargetFromSourceUrl: string;
    targetTypes: string[];
    targetsUrl: string;
    createSourceFromTargetUrl: string;
    sortIndexForward: number;
    sortIndexBackward: number;
    navigable: boolean;
    autoSet: boolean;
}
}

namespace pf {
interface RelationTypeWithConstraints extends RelationType {
    explicit: boolean;
    sourceTypes: string[];
    targetTypes: string[];
    sourcesUrl: string;
    targetsUrl: string;
    sortIndexForward: number;
    sortIndexBackward: number;
}
}

namespace pf {
interface SessionInfo {
    sessionId: string;
}
}

namespace pf {
interface SessionMessageClientToServer {
    feature: pf.Feature;
    access: pf.Access;
}
}

namespace pf {
interface SessionMessageServerToClient {
    sessionInfo: pf.SessionInfo;
    dataChange: pf.ChangeNotification;
    featureConcurrency: pf.FeatureConcurrency;
    accessConcurrency: pf.AccessConcurrency;
}
}

namespace pf {
interface Software {
    name: string;
    version: string;
}
}

namespace pf {
interface SubObject extends VersionedReference {
    properties: pf.Property;
}
}

namespace pf {
interface Timeline {
    slots: pf.TimelineSlot;
}
}

namespace pf {
interface TimelineSlot {
    at: Date;
    count: number;
}
}

namespace pf {
interface ItemTimelineWithReference extends ItemTimeline {
    ref: pf.Reference;
}
}

namespace pf {
interface ItemTimeline {
    items: pf.ItemTimelineEntry;
}
}

namespace pf {
interface ItemTimelineEntry {
    obj: pf.Item;
    pointInTime: Date;
    user: pf.Item;
}
}

namespace pf {
interface ParallelRequestsLimit {
    limit: number;
}
}

namespace pf {
interface RecoveryResult {
    status: string;
    item: pf.Item;
    elements: pf.RecoveryResultElement;
}
}

namespace pf {
interface RecoveryResultElement {
    type: string;
    recovered: number;
    ignored: number;
}
}

namespace pf {
interface Tenant extends Reference {
    alias: string;
    company: string;
    color: string;
    iconRef: string;
    languages: string[];
}
}

namespace pf {
interface TenantWithAdditionalData extends Tenant {
    adminEMail: string;
}
}

namespace pf {
interface Translation {
    code: string;
    text: string;
}
}

namespace pf {
interface UndeleteLimit {
    days: number;
}
}

namespace pf {
interface UniqueReadableCodeDef extends Reference {
    pattern: string;
    readOnly: boolean;
}
}

namespace pf {
interface Unit extends Reference {
    abbr: string;
    name: string;
}
}

namespace pf {
interface UnitPreference {
    preferredUnits: string;
}
}

namespace pf {
interface UnitFactor {
    unit: string;
    factor: number;
}
}

namespace pf {
interface UserAgent {
    browser: pf.Software;
    os: pf.Software;
    device: string;
    languages: string[];
    userAgentString: string;
}
}

namespace pf {
interface ValueWithUnit {
    value: number;
    unit: pf.Unit;
}
}

namespace pf {
interface VersionedDetails extends VersionedReference {
    name: string;
    code: string;
    description: string;
    color: string;
    iconRef: string;
    validityStart: string;
    validityEnd: string;
    properties: pf.Property;
}
}

namespace pf {
interface VersionedItem extends VersionedReference {
    name: string;
    code: string;
    description: string;
    iconRef: string;
    color: string;
    validityStart: string;
    validityUntil: string;
}
}

namespace pf {
interface VersionedItemTranslated extends VersionedReference {
    name: pf.Translation;
    code: string;
    description: pf.Translation;
    iconRef: pf.Translation;
    color: string;
    validityStart: string;
    validityUntil: string;
}
}

namespace pf {
interface VersionedItemWithProperties extends VersionedItem {
    properties: pf.Property;
}
}

namespace pf {
interface VersionedReference extends Reference {
    createdAt: Date;
    createdBy: pf.Item;
    modifiedAt: Date;
    modifiedBy: pf.Item;
    version: string;
    historic: boolean;
}
}

namespace pf {
interface WebSocketInfo {
    url: string;
    validUntil: Date;
}
}

namespace pi {
interface ProjectItem extends pf.VersionedReference {
    name: string;
    code: string;
    description: string;
    iconRef: string;
    validityStart: string;
    validityEnd: string;
    state: lcy.LifecycleStateWithSubState;
    sortIndex: number;
    color: string;
    marker: string;
    properties: pf.Property;
}
}

namespace pi {
interface ProjectItemSummary extends ProjectItem {
    relations: pf.Relation;
    lifecycleHistory: lcy.LifecycleHistory;
    possibleLifecycleTransitions: lcy.LifecycleTransition;
}
}

namespace pi {
interface ProjectItemType extends pf.Reference {
    name: string;
    description: string;
    iconRef: string;
    color: string;
    markerEnumType: string;
}
}

namespace pm {
type ExplicitProjectConstraintType = unknown;
}

namespace pm {
interface ShiftPattern {
    shift: res.ResourceShift;
    pattern: boolean;
}
}

namespace pm {
interface ShiftPlan {
    shifts: pm.ShiftPattern;
}
}

namespace pm {
interface ReferenceFactor extends pf.Reference {
    factor: number;
}
}

namespace pm {
interface ProjectBackup {
    project: pm.Project;
    lifecycle: lcy.LifecycleHistory;
    subObjs: pf.SubObject;
    scenarios: pm.ProjectScenarioBackup;
    risks: rsk.ProjectRisk;
    costsPositions: fco.ProjectCostsPositionWithActuals;
    reports: pm.ProjectReportBackup;
    properties: pf.PropertyRefs;
}
}

namespace pm {
interface ProjectReportBackup {
    report: pm.ProjectReport;
    lifecycle: lcy.LifecycleHistory;
}
}

namespace pm {
interface ProjectScenarioBackup {
    scenario: pm.ProjectScenario;
    lifecycle: lcy.LifecycleHistory;
    workItemTree: pm.ProjectWorkItemBackup;
    resourceAllocations: alc.ResourceAllocation;
    costsPositionAssignments: pm.CostsPositionAssignmentBackup;
    constraints: pm.ProjectConstraint;
    properties: pf.PropertyRefs;
    timingVersion: number;
}
}

namespace pm {
interface CostsPositionAssignmentBackup {
    workItemId: string;
    assignedCostsPositions: string[];
}
}

namespace pm {
interface ProjectPortfolio extends pf.VersionedDetails {
    parentPortfolioId: string;
}
}

namespace pm {
interface ProjectPortfolioMilestone extends pf.VersionedDetails {
    projectPortfolioId: string;
    position: string;
}
}

namespace pm {
interface IndicatorSelections extends pf.Reference {
    dimensions: pm.IndicatorDimensionSelection;
}
}

namespace pm {
interface IndicatorDimensionDef extends pf.Reference {
    projectReportTypeId: string;
    name: string;
    description: string;
    iconRef: string;
    code: string;
    color: string;
    statusClassId: string;
    trendClassId: string;
    sortIndex: number;
}
}

namespace pm {
interface IndicatorDimensionDefTranslated extends pf.Reference {
    projectReportTypeId: string;
    name: pf.Translation;
    description: pf.Translation;
    iconRef: pf.Translation;
    code: string;
    color: string;
    statusClassId: string;
    trendClassId: string;
    sortIndex: number;
}
}

namespace pm {
interface IndicatorDetailDef extends pf.Reference {
    projectReportTypeId: string;
    name: string;
    description: string;
    iconRef: string;
    code: string;
    color: string;
    valueType: pf.PropertyConstraint;
    inputActual: pm.InputBehaviour;
    inputRemaining: pm.InputBehaviour;
    inputForecast: pm.InputBehaviour;
    statusClassId: string;
    trendClassId: string;
    dimension: string;
    semantics: pm.IndicatorSemantics;
    accumulation: pf.Aggregation;
    projectManagementMethodPhase: string;
    sortIndex: number;
}
}

namespace pm {
interface IndicatorDetailDefTranslated extends pf.Reference {
    projectReportTypeId: string;
    name: pf.Translation;
    description: pf.Translation;
    iconRef: pf.Translation;
    code: string;
    color: string;
    aggregationRule: string;
    statusClassId: string;
    trendClassId: string;
    dimension: string;
    sortIndex: number;
}
}

namespace pm {
interface IndicatorDetailSelectionHistoric {
    at: Date;
    obj: pm.IndicatorDetailSelection;
}
}

namespace pm {
interface IndicatorDetailSelectionHistory {
    history: pm.IndicatorDetailSelectionHistoric;
}
}

namespace pm {
interface IndicatorClassificationSchemeValue extends pf.Reference {
    name: string;
    description: string;
    iconRef: string;
    code: string;
    color: string;
    valueStart: number;
    rating: number;
}
}

namespace pm {
interface IndicatorClassificationScheme extends pf.Reference {
    name: string;
    description: string;
    iconRef: string;
    code: string;
    color: string;
    values: pm.IndicatorClassificationSchemeValue;
}
}

namespace pm {
interface IndicatorClassificationSchemeValueTranslated extends pf.Reference {
    name: pf.Translation;
    description: pf.Translation;
    iconRef: pf.Translation;
    code: string;
    color: string;
    valueStart: number;
    rating: number;
}
}

namespace pm {
interface IndicatorClassificationSchemeTranslated extends pf.Reference {
    name: pf.Translation;
    description: pf.Translation;
    iconRef: pf.Translation;
    code: string;
    color: string;
    values: pm.IndicatorClassificationSchemeValueTranslated;
}
}

namespace pm {
interface IndicatorCollection {
    dimensions: pm.IndicatorDimension;
    leading: pm.IndicatorDimension;
    riskSum: number;
    riskClassSum: number;
}
}

namespace pm {
interface IndicatorDetail {
    selection: pm.IndicatorDetailSelection;
    actualValueCalculated: string;
    actualValueManual: string;
    remainingValueCalculated: string;
    remainingValueManual: string;
    forecastValueCalculated: string;
    forecastValueManual: string;
    statusClassCalculated: pf.Item;
    statusClass: pf.Item;
    trendClassCalculated: pf.Item;
    trendClass: pf.Item;
    remark: string;
}
}

namespace pm {
interface IndicatorDetailSelection {
    typeId: string;
    targetValue: string;
    showValues: boolean;
    projectSpecificName: string;
    remark: string;
    createdAt: Date;
    createdBy: pf.Item;
    modifiedAt: Date;
    modifiedBy: pf.Item;
    version: string;
    historic: boolean;
}
}

namespace pm {
interface IndicatorDimension {
    selection: pm.IndicatorDimensionSelection;
    indicators: pm.IndicatorDetail;
    total: pm.IndicatorDetail;
    targetTotal: string;
    riskEstimation: pm.IndicatorRiskEstimation;
}
}

namespace pm {
interface IndicatorDimensionSelection {
    dimension: string;
    showValues: boolean;
    showRiskEstimation: boolean;
    isLeading: boolean;
    remark: string;
    details: pm.IndicatorDetailSelection;
    isReportExport: boolean;
}
}

namespace pm {
interface IndicatorRiskEstimation extends rsk.RiskRating {
    remark: string;
}
}

namespace pm {
type IndicatorSemantics = unknown;
}

namespace pm {
type InputBehaviour = unknown;
}

namespace pm {
interface PositionProposal {
    objectId: string;
    proposedPosition: string;
}
}

namespace pm {
interface MovePattern {
    objectId: string;
    defaultMove: pf.LinearFunction;
    segments: pm.MovePatternSegment;
}
}

namespace pm {
interface MovePatternSegment extends pf.LinearFunction {
    minX: number;
}
}

namespace pm {
interface Project extends pf.VersionedItemWithProperties {
    status: string;
    portfolios: pf.Item;
    classification: cls.Classification;
}
}

namespace pm {
interface ProjectConstraint extends pf.VersionedReference {
    constraintType: pm.ExplicitProjectConstraintType;
    predecessorMilestoneId: string;
    successorMilestoneId: string;
    minDistance?: number;
    maxDistance?: number;
}
}

namespace pm {
interface ProjectDependency extends pf.VersionedReference {
    constraintType: pm.ExplicitProjectConstraintType;
    predecessorMilestone: pm.ProjectDependencyReference;
    predecessorMilestoneParents: lcy.ReferenceWithLifecycle;
    successorMilestone: pm.ProjectDependencyReference;
    successorMilestoneParents: lcy.ReferenceWithLifecycle;
    minDistance?: number;
    maxDistance?: number;
}
}

namespace pm {
interface ProjectDependencyReference extends pf.Reference {
    position: string;
    name: string;
    color: string;
    milestoneType: pm.ProjectDependencyReferenceType;
}
}

namespace pm {
type ProjectDependencyReferenceType = unknown;
}

namespace pm {
type ProjectManagementMethod = unknown;
}

namespace pm {
interface ProjectManagementMethodTimeline {
    managementMethod: pf.Item;
    plannedStart: string;
    started: Date;
    phases: pm.ProjectManagementMethodPhaseTimeline;
    currentPhase: string;
}
}

namespace pm {
type ProjectManagementMethodTranslated = unknown;
}

namespace pm {
interface ProjectManagementMethodPhase extends pf.VersionedItem {
    sortIndex: number;
}
}

namespace pm {
interface ProjectManagementMethodPhaseTimeline {
    managementMethodPhase: pf.Item;
    plannedFinish: string;
    finished: Date;
}
}

namespace pm {
interface ProjectManagementMethodPhaseTranslated extends pf.VersionedItemTranslated {
    sortIndex: number;
}
}

namespace pm {
interface ProjectManagementMethodPhaseLifecycleAssignment {
    phaseId: string;
    lifecycleSubStateId: string;
    priority: number;
}
}

namespace pm {
interface ProjectReport extends pf.VersionedReference {
    name: string;
    code: string;
    description: string;
    iconRef: string;
    color: string;
    validityStart: string;
    validityEnd: string;
    properties: pf.Property;
    projectId: string;
    indicators: pm.IndicatorCollection;
    risks: rsk.ProjectRisk;
    currency: string;
}
}

namespace pm {
interface ProjectPortfolioReport extends pf.VersionedReference {
    name: string;
    code: string;
    description: string;
    iconRef: string;
    color: string;
    validityStart: string;
    validityEnd: string;
    properties: pf.Property;
    projectPortfolioId: string;
}
}

namespace pm {
interface ReportInterval {
    unit: pm.ReportIntervalUnit;
    amount: number;
    offset: number;
}
}

namespace pm {
type ReportIntervalUnit = unknown;
}

namespace pm {
interface ProjectReportType extends pf.Item {
    interval: pm.ReportInterval;
    autoCreate: boolean;
    sortIndex: number;
    hasValidity: boolean;
    canRefresh: boolean;
    jsDataSourceId: string;
}
}

namespace pm {
interface ProjectPortfolioReportType extends pf.Item {
    interval: pm.ReportInterval;
    autoCreate: boolean;
    sortIndex: number;
    hasValidity: boolean;
}
}

namespace pm {
interface ProjectScenario extends pf.VersionedItemWithProperties {
    projectId: string;
    status: string;
    owner: pf.Item;
}
}

namespace pm {
interface ProjectSummary {
    project: pm.Project;
    subObjects: pf.SubObject;
    activeScenario: pm.ProjectScenario;
    mainPhase: pm.ProjectWorkItem;
    accumulatedValues: pm.ProjectWorkItemAccumulatedValues;
    costsActual: fco.CurrencyAmount;
    costsExpectedPending: fco.CurrencyAmount;
    costsRemaining: fco.CurrencyAmount;
    costsBudget: fco.CurrencyAmount;
    costsPlanned: fco.CurrencyAmount;
    costsForecast: fco.CurrencyAmount;
    relations: pf.Relation;
    managementMethod: pf.Item;
    managementMethodPhase: pf.Item;
    thirdPartyReferences: tdp.ThirdPartyReference;
    latestReports: pm.ProjectReport;
    confidentiality: acm.ConfidentialityLevel;
    lastStateTransition: lcy.LifecycleHistory;
}
}

namespace pm {
interface ProjectWithReports extends pf.Item {
    reports: pm.ProjectReport;
}
}

namespace pm {
interface ProjectPortfolioWithReports extends pf.Item {
    reports: pm.ProjectPortfolioReport;
}
}

namespace pm {
interface ProjectWorkItem extends pf.VersionedReference {
    name: string;
    code: string;
    description: string;
    iconRef: string;
    properties: pf.Property;
    phaseType: pm.ProjectWorkItemType;
    projectId: string;
    scenarioId: string;
    parentPhaseId: string;
    startId: string;
    endId: string;
    sortIndex?: number;
    timeBudget: string;
    costsBudget: fco.CurrencyAmount;
    planned: string;
    beg: Date;
    end: Date;
    fixed: boolean;
    projectCostsPositions: pf.NamedReference;
    owner: pf.ItemWithDeletedFlag;
    requiredSkill: pf.ItemWithDeletedFlag;
    color: string;
    manualProgressOverride?: number;
    projectManagementMethodPhaseId: string;
    dependencies: pm.ProjectWorkItemConstraint;
}
}

namespace pm {
interface ProjectWorkItemBackup extends ProjectWorkItem {
    itemVersion: string;
    structureVersion: string;
}
}

namespace pm {
interface ProjectWorkItemAccumulatedValues {
    projectWorkItemId: string;
    childrenCount: number;
    childrenCountAccumulated: number;
    costsBudget: fco.CurrencyAmount;
    costsBudgetAccumulated: fco.CurrencyAmount;
    costs: fco.CostsForecastsGroups;
    costsAccumulated: fco.CostsForecastsGroups;
    resourceAllocations: string;
    resourceAllocationsAccumulated: string;
    resourceActuals: string;
    resourceActualsAccumulated: string;
    timeBudgetAccumulated: string;
    timePlannedAccumulated: string;
    timeExpectedPending: string;
    timeExpectedPendingAccumulated: string;
    timeRemaining: string;
    timeRemainingAccumulated: string;
    errors: string[];
    errorsAccumulated: string[];
    progress: number;
    progressAccumulated: number;
    manualProgressOverride?: number;
    overloadIndicator: number;
    overloadIndicatorAccumulated: number;
}
}

namespace pm {
type ProjectWorkItemType = unknown;
}

namespace pm {
interface WorkItem extends pf.Item {
    duration: string;
    start: Date;
    finish: Date;
}
}

namespace pm {
interface ProjectWorkItemConstraint extends pf.Reference {
    fromPhaseId: string;
    toPhaseId: string;
    dependencyType: pm.ProjectWorkItemConstraintType;
    minDistance?: number;
    maxDistance?: number;
}
}

namespace pm {
type ProjectWorkItemConstraintType = unknown;
}

namespace pm {
interface ProjectWorkItemRemainingEfforts extends pf.Reference {
    timeline: pm.ProjectWorkItemRemainingEffortWithOverrides;
}
}

namespace pm {
interface ProjectWorkItemRemainingEffort {
    remainingEffort: string;
    remainingEffortSpecified: string;
    progressSpecified?: number;
    remark: string;
    modifiedAt: Date;
    modifiedBy: pf.Item;
}
}

namespace pm {
interface ProjectWorkItemRemainingEffortWithOverrides extends ProjectWorkItemRemainingEffort {
    at: string;
    overidden: pm.ProjectWorkItemRemainingEffort;
}
}

namespace res {
interface ReferenceWithLinkInfo extends pf.Reference {
    linkType: string;
    linkId: string;
    linkValidityStart: string;
    linkValidityUntil: string;
}
}

namespace res {
interface ItemWithAncestors extends pf.Item {
    ancestors: res.ReferenceWithLinkInfo;
}
}

namespace res {
interface AbsenceType extends pf.Item {
    availabilityPercentage: number;
    presencePercentage: number;
    category: number;
}
}

namespace res {
interface Resource extends pf.VersionedDetails {
    eMail: string;
}
}

namespace res {
interface ResourceGroup extends pf.Reference {
    name: string;
    description: string;
    imageUrl: string;
    rootResource: pf.Reference;
}
}

namespace res {
type ResourceKind = unknown;
}

namespace res {
interface ResourceLinkType extends pf.Reference {
    fromResourceTypeId: string;
    toResourceTypeId: string;
    name: string;
    nameReverse: string;
    description: string;
    iconRef: string;
    color: string;
    isHard: boolean;
    targetObjectNeedsParentPermission: boolean;
    targetObjectInheritRelations: boolean;
    implicitRelationId: string;
}
}

namespace res {
interface ResourceType extends pf.Reference {
    name: string;
    resourceGroupeId: string;
    costsTypeId: string;
    resourceKind: res.ResourceKind;
}
}

namespace res {
interface ResourceShift extends pf.Reference {
    name: string;
    description: string;
    imageUrl: string;
    color: string;
    duration: string;
    begTime: string;
    endTime: string;
}
}

namespace res {
interface Presence {
    presence: boolean;
    duration: string;
}
}

namespace res {
interface Model {
    shift: res.ResourceShift;
    presencePerDay: res.Presence;
}
}

namespace res {
interface Availability extends pf.Reference {
    definedOn: pf.Reference;
    inheritFromParent: boolean;
    inheritedFrom: pf.Reference;
    validAfter: string;
    holidayLocaleId: string;
    models: res.Model;
    basicLoadPercent: number;
    costPerHour: number;
    costCurrency: string;
    description: string;
    ftePercent: number;
    standardAvails: string;
}
}

namespace res {
interface AvailabilitiesByResource {
    resource: pf.Reference;
    availabilities: res.Availability;
}
}

namespace res {
type CalendarFileFormat = unknown;
}

namespace res {
interface Holiday extends pf.VersionedReference {
    date: string;
    shiftId: string;
    name: string;
}
}

namespace res {
interface ResourceGroupStandardWorktime {
    id: string;
    timePerWeek: string;
    daysPerWeek: number;
}
}

namespace res {
interface WorkdayMapping {
    resource: pf.Reference;
    referenceDay: string;
    mapping: number;
}
}

namespace rsk {
interface ProjectRisk extends Risk {
    projectId: string;
    dimension: string;
}
}

namespace rsk {
interface ProjectRiskWithHistory extends RiskWithHistory {
    projectId: string;
    dimension: string;
}
}

namespace rsk {
interface Risk extends pf.VersionedItemWithProperties {
    rating: rsk.RiskRating;
}
}

namespace rsk {
interface RiskClassification extends pf.Reference {
    name: string;
    description: string;
    imageUrl: string;
    color: string;
    limit: number;
}
}

namespace rsk {
interface RiskClassificationTranslated extends pf.Reference {
    name: pf.Translation;
    description: pf.Translation;
    imageUrl: pf.Translation;
    color: string;
    limit: number;
}
}

namespace rsk {
type RiskHistorySize = unknown;
}

namespace rsk {
interface RiskMatrixAssignment {
    occurrenceProbabilityClassification: string;
    extentOfLossClassification: string;
    riskRatingClassification: string;
}
}

namespace rsk {
interface RiskMatrixDefinition extends pf.Item {
    occurrenceProbabilityClassifications: rsk.RiskClassification;
    extentOfLossClassifications: rsk.RiskClassification;
    riskRatingClassifications: rsk.RiskClassification;
    fields: rsk.RiskMatrixAssignment;
    customCalculationRule: string;
}
}

namespace rsk {
interface RiskMatrixDefinitionTranslated extends pf.ItemTranslated {
    occurrenceProbabilityClassifications: rsk.RiskClassificationTranslated;
    extentOfLossClassifications: rsk.RiskClassificationTranslated;
    riskRatingClassifications: rsk.RiskClassificationTranslated;
    fields: rsk.RiskMatrixAssignment;
    customCalculationRule: string;
}
}

namespace rsk {
interface RiskRating {
    occurrenceProbability: number;
    occurrenceProbabilityClassification: string;
    extentOfLoss: number;
    extentOfLossClassification: string;
    riskRating: number;
    riskRatingClassification: string;
}
}

namespace rsk {
interface RiskRatingHistoric {
    at: Date;
    obj: rsk.RiskRating;
}
}

namespace rsk {
interface RiskWithHistory extends Risk {
    history: rsk.RiskRatingHistoric;
}
}

namespace stg {
interface AchievementRate {
    target?: number;
    actual?: number;
    metric: string;
    rate?: number;
}
}

namespace stg {
interface ProjectContribution extends pf.VersionedReference {
    objectiveId: string;
    projectId: string;
    weight: number;
    remark: string;
    progress?: number;
    progressOverride?: number;
    sortIndex: number;
    properties: pf.Property;
}
}

namespace stg {
interface FieldOfAction extends pf.VersionedDetails {
    visionId: string;
    achievementRate?: number;
    progressByContributionState: stg.ProgressByState;
    progress?: number;
    indicatorStatuses: stg.ObjectiveIndicatorStatus;
    sortIndex: number;
}
}

namespace stg {
interface Objective extends pf.VersionedDetails {
    foaId: string;
    weight: number;
    achievementRate: stg.AchievementRate;
    progressByContributionState: stg.ProgressByState;
    progress?: number;
    indicatorStatuses: stg.ObjectiveIndicatorStatus;
    sortIndex: number;
}
}

namespace stg {
interface ObjectiveIndicator extends pf.VersionedItem {
    objectiveId: string;
    targetType: stg.ObjectiveIndicatorTargetType;
    target: string;
    actual: string;
    unit: string;
    remark: string;
    weight: number;
    statusClass: string;
    sortIndex: number;
    properties: pf.Property;
}
}

namespace stg {
type ObjectiveIndicatorTargetType = unknown;
}

namespace stg {
interface ObjectiveIndicatorStatus {
    statusClass: string;
    accumulatedWeights: number;
}
}

namespace stg {
interface ProgressByState {
    stateId: string;
    weight: number;
    progress: number;
}
}

namespace stg {
type Strategy = unknown;
}

namespace stg {
interface Vision extends pf.VersionedDetails {
    strategyId: string;
    sortIndex: number;
}
}

namespace tdp {
interface ThirdPartyReference extends ThirdPartyReferenceAssignment {
    foreignName: string;
    foreignCode: string;
    foreignDescription: string;
    foreignImageUrl: string;
}
}

namespace tdp {
interface ThirdPartyReferenceAssignment extends pf.Reference {
    foreignKey: string;
    pqforceId: string;
}
}

namespace tdp {
interface ThirdPartyReferenceType extends pf.Reference {
    typeId: string;
    maxCount?: number;
}
}

namespace tdp {
interface ThirdPartyReferenceWithOwnData extends ThirdPartyReference {
    pqforceName: string;
    pqforceCode: string;
    pqforceDescription: string;
    pqforceImageUrl: string;
    additionalData: string;
}
}

namespace acm {
    export function acceptChallenge(obj:ChallengeAnswer);
}
namespace acm {
    export function changePassword(obj:ChangePassword);
}
namespace acm {
    export function createNewApiToken(tenantalias?:string, obj:ApiClientInfo): acm.ApiTokenWithAuthUrl;
}
namespace acm {
    export function getApiTokenAuthorizationRequest(tokenid:string): acm.ApiTokenAuthorizationRequest;
}
namespace acm {
    export function apiTokenAuthorize(tokenid:string, expiry?:Date);
}
namespace acm {
    export function getApiTokenInfo(): acm.ApiClientInfo;
}
namespace acm {
    export function putApiTokenInfo(obj:ApiClientInfo);
}
namespace acm {
    export function apiTokenUnauthorize(tokenid:string, userId?:string);
}
namespace acm {
    export function getAuthorizedApiTokens(userId?:string): acm.ApiTokenLog[];
}
namespace acm {
    export function getAuthorizedApiToken(tokenId:string, userId?:string): acm.ApiTokenLog;
}
namespace acm {
    export function getAuthenticationState(): acm.AuthenticationState;
}
namespace acm {
    export function getAuthorizationByPerm(permissionId:string): acm.UserAuthorization;
}
namespace acm {
    export function getAuthorizationByObj(objectType:string, objectId:string, action?:string, transition?:string): pf.Authorization;
}
namespace acm {
    export function getAuthorizationsByObj(objectType:string, objectId:string): pf.Authorization[];
}
namespace acm {
    export function getCreateAuthorizationByObj(objectType:string, objectId:string, createObjectType:string): pf.Authorization;
}
namespace acm {
    export function getCurrentUserReceiveNotifications(): pf.Flag;
}
namespace acm {
    export function putCurrentUserReceiveNotifications(obj:pf.Flag);
}
namespace acm {
    export function getChallenge(): acm.Challenge;
}
namespace acm {
    export function getConfidentiality(objectType:string, objectId:string): acm.Confidentiality;
}
namespace acm {
    export function putConfidentiality(objectType:string, objectId:string, obj:Confidentiality);
}
namespace acm {
    export function getCurrentUser(): acm.User;
}
namespace acm {
    export function getFirstFactorAuthorities(lang?:string, timezone?:string): acm.FirstFactorAuthority[];
}
namespace acm {
    export function getFirstFactorAuthority(authorityId:string, lang?:string, timezone?:string): acm.FirstFactorAuthority;
}
namespace acm {
    export function getSaml2Issuer();
}
namespace acm {
    export function getSaml2IdentityProviders(): acm.Saml2IdentityProvider[];
}
namespace acm {
    export function addSaml2IdentityProvider(): pf.Reference;
}
namespace acm {
    export function getSaml2IdentityProvider(authid:string): acm.Saml2IdentityProvider;
}
namespace acm {
    export function putSaml2IdentityProvider(authid:string, obj:Saml2IdentityProvider);
}
namespace acm {
    export function delSaml2IdentityProvider(authid:string);
}
namespace acm {
    export function getSaml2IdentityProviderRequestSignCertificate(authid:string, format?:string): unknown;
}
namespace acm {
    export function renewSaml2IdentityProviderRequestSignCertificate(authid:string, algorithm?:string, keysize?:number, expiry?:Date);
}
namespace acm {
    export function getSecondFactorAuthorities(): pf.Item[];
}
namespace acm {
    export function getSecondFactorAuthority(authorityId:string): pf.Item;
}
namespace acm {
    export function getUser(userId:string): acm.User;
}
namespace acm {
    export function putUser(userId:string, obj:User);
}
namespace acm {
    export function delUser(userId:string);
}
namespace acm {
    export function getUserIdentification(userId:string): pf.Item;
}
namespace acm {
    export function getUserSecondFactorStatus(userId:string): pf.Item;
}
namespace acm {
    export function resetPassword(userId:string);
}
namespace acm {
    export function resetSecondFactor(userId:string);
}
namespace acm {
    export function getCurrentUserRelations(targetType?:string, targetId?:string): pf.Relation[];
}
namespace acm {
    export function requestPasswordResetToken(email?:string, username?:string, lang?:string);
}
namespace acm {
    export function authorizePasswordReset(token?:string, lang?:string);
}
namespace acm {
    export function getPermissions(): acm.Permission[];
}
namespace acm {
    export function getPermission(permissionId:string): acm.Permission;
}
namespace acm {
    export function getPermissionCubeMappingsForType(objectType:string, includenoncore?:boolean): acm.CubeMappingForType;
}
namespace acm {
    export function getPermissionCubeForType(objectType:string, includenoncore?:boolean): acm.CubeViewForType;
}
namespace acm {
    export function getPermissionCubeForObject(objectType:string, objectId:string, includeallstates?:boolean): acm.CubeViewForId;
}
namespace acm {
    export function getPermissionCubeForId(objectType:string, objectId:string, includenoncore?:boolean): acm.CubeViewForId;
}
namespace acm {
    export function getPermissionsGraph(objecttype?:string): acm.PermissionWithParents[];
}
namespace acm {
    export function interactiveLogin(obj:InteractiveLoginRequest);
}
namespace acm {
    export function logout(): acm.LogoutResponse;
}
namespace acm {
    export function getCurrentUserAuthorizations(): acm.UserAuthorization[];
}
namespace acm {
    export function getUserAuthorizations(userId:string): acm.UserAuthorization[];
}
namespace acm {
    export function getUserCertificateBinary(): unknown;
}
namespace acm {
    export function getUserCertificate(): acm.UserCertificate;
}
namespace acm {
    export function getUsers(name?:string, resourceId?:string, firstAuthorityId?:string, email?:string, active?:boolean): acm.User[];
}
namespace acm {
    export function addUser(firstAuthority:string, resourceid?:string): acm.User;
}
namespace acm {
    export function getCurrentUserPreferences(allowunspecified?:boolean): acm.UserPreferences;
}
namespace acm {
    export function putCurrentUserPreferences(obj:UserPreferences);
}
namespace acm {
    export function getUserRelations(userId:string, targetType?:string, targetId?:string): pf.Relation[];
}
namespace acm {
    export function getUserRoles(): acm.UserRole[];
}
namespace acm {
    export function getUserRole(userRoleId:string): acm.UserRole;
}
namespace acm {
    export function getUserRolesTranslated(): acm.UserRoleTranslated[];
}
namespace acm {
    export function getUserRoleTranslated(userRoleId:string): acm.UserRoleTranslated;
}
namespace acm {
    export function putUserRoleTranslated(userRoleId:string, obj:UserRoleTranslated);
}
namespace acm {
    export function delUserRoleTranslated(userRoleId:string);
}
namespace acm {
    export function getUserRoleAuthorizations(userRoleId:string): acm.UserRoleAuthorization[];
}
namespace acm {
    export function putUserRoleAuthorizations(userRoleId:string, obj:UserRoleAuthorization[]);
}
namespace acm {
    export function delUserRoleAuthorizations(userRoleId:string);
}
namespace acm {
    export function getUserRoleAssignments(userId:string): acm.UserRole[];
}
namespace acm {
    export function putUserRoleAssignments(userId:string, obj:UserRole[]);
}
namespace acm {
    export function getWelcomeMessage(): acm.WelcomeMessage;
}
namespace act {
    export function getActualsPeriod(periodId:string): act.ActualsPeriod;
}
namespace act {
    export function getActualsPeriodByDay(day?:string): act.ActualsPeriod;
}
namespace act {
    export function getActualsPeriods(): act.ActualsPeriod[];
}
namespace act {
    export function getResourceActualsPeriod(resourceId:string, periodId:string): act.ResourceActualsPeriod;
}
namespace act {
    export function getResourceActualsPeriodByDay(resourceId:string, day?:string): act.ResourceActualsPeriod;
}
namespace act {
    export function getResourceActualsPeriods(resourceId:string): act.ResourceActualsPeriod[];
}
namespace act {
    export function getResourceProjectTimes(resourceId:string, periodId:string): act.ProjectTime[];
}
namespace act {
    export function getProjectTimeActuals(projectId:string, from?:string, to?:string): act.ProjectTimeActual[];
}
namespace act {
    export function getResourceProjectTimeActuals(resourceId:string, periodId:string): act.ProjectTimeActual[];
}
namespace act {
    export function getResourceProjectTimeActual(resourceId:string, ptaId:string): act.ProjectTimeActual;
}
namespace act {
    export function putResourceProjectTimeActual(resourceId:string, ptaId:string, obj:ProjectTimeActual);
}
namespace act {
    export function delResourceProjectTimeActual(resourceId:string, ptaId:string);
}
namespace act {
    export function getResourceProjectTime(resourceId:string, day:string, projectId:string): act.ProjectTime;
}
namespace act {
    export function putResourceProjectTime(resourceId:string, day:string, projectId:string, obj:ProjectTime);
}
namespace act {
    export function delResourceProjectTime(resourceId:string, day:string, projectId:string);
}
namespace act {
    export function getResourceProjectPhaseTime(resourceId:string, day:string, projectId:string, workItemId:string): act.ProjectTime;
}
namespace act {
    export function putResourceProjectPhaseTime(resourceId:string, day:string, projectId:string, workItemId:string, obj:ProjectTime);
}
namespace act {
    export function delResourceProjectPhaseTime(resourceId:string, day:string, projectId:string, workItemId:string);
}
namespace act {
    export function getResourcePresences(resourceId:string, periodId:string): act.ResourcePresence[];
}
namespace act {
    export function addResourcePresence(resourceId:string, obj:ResourcePresence);
}
namespace act {
    export function putResourcePresence(resourceId:string, presenceId:string, obj:ResourcePresence);
}
namespace act {
    export function delResourcePresence(resourceId:string, presenceId:string);
}
namespace act {
    export function clockResourcePresence(resourceId:string, time:Date);
}
namespace act {
    export function getResourceTimeCorrections(resourceId:string): act.ResourceTimeCorrection[];
}
namespace act {
    export function putResourceTimeCorrection(resourceId:string, type:string, date:string, obj:ResourceTimeCorrection);
}
namespace act {
    export function delResourceTimeCorrection(resourceId:string, type:string, date:string);
}
namespace act {
    export function getTimeBalance(resourceId:string, year:number): act.TimeBalance;
}
namespace act {
    export function getDaySummary(resourceId:string, beg?:string, end?:string): act.ResourceDaySummary[];
}
namespace act {
    export function getMidMonthSummary(resourceId:string, target?:string): act.ResourceDaySummary;
}
namespace act {
    export function getAbsencesBalance(resourceId:string, year:number): act.ResourceAbsence[];
}
namespace act {
    export function getProjectEfforts(resourceId:string, projectid:string): act.ProjectEfforts;
}
namespace act {
    export function getProjectsEfforts(resourceId:string, projectids:string[]): act.ProjectEfforts[];
}
namespace act {
    export function getProjectWithPhasesEfforts(resourceId:string, projectid:string): act.ProjectWithPhasesEfforts;
}
namespace act {
    export function getProjectsWithPhasesEfforts(resourceId:string, projectids:string[]): act.ProjectWithPhasesEfforts[];
}
namespace alc {
    export function getAbsenceSlots(resourceId:string, beg?:string, end?:string): alc.Planning;
}
namespace alc {
    export function updateAbsenceSlots(resourceId:string, obj:Planning);
}
namespace alc {
    export function getAvailabilitySlot(resourceId:string, beg?:string, end?:string): alc.AvailabilitySlot;
}
namespace alc {
    export function getAbsenceTypes(): res.AbsenceType[];
}
namespace alc {
    export function getAbsenceType(absenceTypeId:string): res.AbsenceType;
}
namespace alc {
    export function putAbsenceType(absenceTypeId:string, obj:res.AbsenceType);
}
namespace alc {
    export function delAbsenceType(absenceTypeId:string);
}
namespace alc {
    export function getInvolvedProjects(resourceId:string): pf.Item[];
}
namespace alc {
    export function getInvolvedResources(projectId:string): pf.Item[];
}
namespace alc {
    export function getMacroAllocationHistory(resourceId:string, beg?:string, end?:string, until?:Date): alc.AllocationHistory;
}
namespace alc {
    export function getMacroAllocationSlot(resourceId:string, beg?:string, end?:string, projectId?:string, scenarioId?:string, groupBy?:string, fewerWorkWeight?:number): alc.Workload;
}
namespace alc {
    export function getMacroAllocationSlots(resourceId:string, beg?:string, end?:string, zoom?:string, projectId?:string, scenarioId?:string, groupBy?:string, fewerWorkWeight?:number): alc.Workload;
}
namespace alc {
    export function getMacroAllocationSlotsByResource(resourceIds?:string[], beg?:string, end?:string, zoom?:string, projectId?:string, scenarioId?:string, groupBy?:string, fewerWorkWeight?:number): alc.WorkloadByResource[];
}
namespace alc {
    export function getScenarioAllocationSlots(resourceId:string, scenarioId:string, beg?:string, end?:string, zoom?:string, fewerWorkWeight?:number): alc.Workload;
}
namespace alc {
    export function getProjectAllocationSlots(resourceId:string, projectId:string, beg?:string, end?:string, zoom?:string, fewerWorkWeight?:number): alc.Workload;
}
namespace alc {
    export function getMicroAllocationSlots(resourceId:string, beg?:string, end?:string): alc.Planning;
}
namespace alc {
    export function updateMicroAllocationSlots(resourceId:string, obj:Planning);
}
namespace alc {
    export function getPlanningSlots(resourceId:string, beg?:string, end?:string): alc.Planning;
}
namespace alc {
    export function getPlanningSlotStats(resourceId:string, beg?:string, end?:string): alc.MicroAllocationStatistics;
}
namespace alc {
    export function getProjectAllocationsByResource(resourceId:string, beg?:string, end?:string, includeInactive?:boolean): alc.ProjectAllocations;
}
namespace alc {
    export function getProjectAndPhaseAllocationsByResource(resourceId:string, beg?:string, end?:string): alc.MacroAllocationStructure;
}
namespace alc {
    export function getProjectPhaseAllocations(projectId:string, beg?:string, end?:string): alc.ProjectWorkItemAllocations[];
}
namespace alc {
    export function getProjectPhaseAllocationsByResource(projectId:string, resourceId:string, beg?:string, end?:string): alc.ProjectWorkItemAllocations;
}
namespace alc {
    export function getScenarioPhaseAllocations(scenarioId:string, beg?:string, end?:string): alc.ProjectWorkItemAllocations[];
}
namespace alc {
    export function getScenarioPhaseAllocationsByResource(scenarioId:string, resourceId:string, beg?:string, end?:string): alc.ProjectWorkItemAllocations;
}
namespace alc {
    export function requestResourceAllocation(allocationId:string, remark?:string, autoapprove?:boolean);
}
namespace alc {
    export function rejectResourceAllocation(allocationId:string, remark?:string);
}
namespace alc {
    export function approveResourceAllocation(allocationId:string, remark?:string);
}
namespace alc {
    export function commentResourceAllocation(allocationId:string, remark?:string);
}
namespace alc {
    export function getResourceAllocationWorkflowHistory(allocationId:string, until?:Date): alc.ResourceAllocationWorkflowHistory[];
}
namespace alc {
    export function getUnoptimizedResourcesByParent(resourceId:string, beg?:string, end?:string, count?:number, fewerWorkWeight?:number): pm.ReferenceFactor[];
}
namespace atm {
    export function clearJavaScriptConsole();
}
namespace atm {
    export function getJavaScriptConsole(): atm.JavaScriptConsole;
}
namespace atm {
    export function clearJavaScriptConsoleOfSandbox(sandboxId:string);
}
namespace atm {
    export function getJavaScriptConsoleOfSandbox(sandboxId:string): atm.JavaScriptConsole;
}
namespace atm {
    export function clearJavaScriptSandboxPerformance(sandboxId:string);
}
namespace atm {
    export function getJavaScriptSandboxPerformance(sandboxId:string): atm.JavaScriptPerformanceStats;
}
namespace atm {
    export function getJavaScriptLibraries(): atm.JavaScriptLibrary[];
}
namespace atm {
    export function getJavaScriptQuota(): atm.JavaScriptQuota;
}
namespace atm {
    export function getJavaScriptSource(sourceId:string, version?:Date): atm.JavaScriptSource;
}
namespace atm {
    export function getJavaScriptSourceTimeline(sourceId:string, beg?:Date, end?:Date, granularity?:string): pf.Timeline;
}
namespace atm {
    export function putJavaScriptSource(sourceId:string, obj:JavaScriptSource);
}
namespace atm {
    export function delJavaScriptSource(sourceId:string);
}
namespace atm {
    export function getJavaScriptSourceCompileErrors(sourceId:string): atm.CompileError[];
}
namespace atm {
    export function runJavaScriptSource(sourceId:string, waitForFinish?:boolean);
}
namespace atm {
    export function triggerJavaScriptSource(sourceId:string);
}
namespace atm {
    export function getJavaScriptSources(): atm.JavaScriptSource[];
}
namespace atm {
    export function getJavaScriptChangeTriggers(sourceId:string): atm.JavaScriptChangeTrigger[];
}
namespace atm {
    export function addJavaScriptChangeTrigger(sourceId:string, objecttype?:string, objectid?:string, action?:string): pf.Reference;
}
namespace atm {
    export function getJavaScriptChangeTrigger(sourceId:string, triggerId:string): atm.JavaScriptChangeTrigger;
}
namespace atm {
    export function delJavaScriptChangeTrigger(sourceId:string, triggerId:string);
}
namespace cht {
    export function getChart(baseline:string, baselinefilter:string): cht.Chart;
}
namespace cht {
    export function getChartMetaModel(): cht.ChartModel;
}
namespace clf {
    export function newUuids(count:number): clf.NewUuidArray;
}
namespace clf {
    export function getCockpitWidgets(): clf.CockpitWidget[];
}
namespace clf {
    export function getCockpitWidget(widgetId:string): clf.CockpitWidget;
}
namespace clf {
    export function getCockpitWidgetsTranslated(): clf.CockpitWidgetTranslated[];
}
namespace clf {
    export function getCockpitWidgetTranslated(widgetId:string): clf.CockpitWidgetTranslated;
}
namespace clf {
    export function calculateScriptedCockpitWidget(widgetId:string, type:string, id:string, obj:unknown): pf.JtfWithCharts;
}
namespace clf {
    export function putCockpitWidgetTranslated(widgetId:string, obj:CockpitWidgetTranslated);
}
namespace clf {
    export function delCockpitWidgetTranslated(widgetId:string);
}
namespace clf {
    export function getGlobalStoreIds(): clf.UuidArray;
}
namespace clf {
    export function getGlobalStore(storeId:string): unknown;
}
namespace clf {
    export function putGlobalStore(storeId:string, obj:unknown);
}
namespace clf {
    export function delGlobalStore(storeId:string);
}
namespace clf {
    export function getObjectStore(objectType:string, objectId:string, storeId:string): unknown;
}
namespace clf {
    export function getObjectStoreIds(objectType?:string[], storeId?:string[]): clf.ObjectStoreReference[];
}
namespace clf {
    export function putObjectStore(objectType:string, objectId:string, storeId:string, obj:unknown);
}
namespace clf {
    export function delObjectStore(objectType:string, objectId:string, storeId:string);
}
namespace clf {
    export function getUserStore(storeId:string, userid?:string): unknown;
}
namespace clf {
    export function getUserStoreIds(userid?:string): clf.UuidArray;
}
namespace clf {
    export function putUserStore(storeId:string, userid?:string, obj:unknown);
}
namespace clf {
    export function delUserStore(storeId:string, userid?:string);
}
namespace clf {
    export function reportClientError(obj:ThirdPartyError): pf.Reference;
}
namespace clf {
    export function reportThirdPartyError(obj:ThirdPartyError): pf.Reference;
}
namespace clf {
    export function sanitizeHtml(obj:unknown): unknown;
}
namespace clf {
    export function getTranslationOverrides(lang:string): unknown;
}
namespace clf {
    export function shareData(obj:unknown): pf.Reference;
}
namespace clf {
    export function getSharedData(dataId:string): unknown;
}
namespace cls {
    export function getSchema(schemaId:string): cls.ClassificationSchema;
}
namespace cls {
    export function getSchemaTranslated(schemaId:string): cls.ClassificationSchemaTranslated;
}
namespace cls {
    export function putSchemaTranslated(schemaId:string, obj:ClassificationSchemaTranslated);
}
namespace cls {
    export function delSchemaTranslated(schemaId:string);
}
namespace cls {
    export function getSchemasForType(typeId:string): cls.ClassificationSchema[];
}
namespace clu {
    export function getClusterState(): clu.ClusterState;
}
namespace dgn {
    export function getErrorLogs(beg?:Date, end?:Date): dgn.ErrorLog[];
}
namespace dgn {
    export function getEnvironment(): dgn.ServerEnvironment;
}
namespace dgn {
    export function getPerformanceIndicators(): dgn.PerformanceIndicators;
}
namespace dgn {
    export function resetPerformanceIndicators();
}
namespace doc {
    export function getExportConfiguration(view:string): doc.ExportViewConfiguration[];
}
namespace doc {
    export function getTemplates(exportType:string): doc.ExportTemplate[];
}
namespace doc {
    export function getAvailableExports(view:string): doc.AvailableExport[];
}
namespace doc {
    export function handleExportRequest(currency?:string, obj:ExportRequest): unknown;
}
namespace doc {
    export function putExportTemplate(id:string, obj:ExportTemplate);
}
namespace doc {
    export function delExportTemplate(id:string);
}
namespace doc {
    export function putExportConfiguration(id:string, obj:ExportConfigurationRequest);
}
namespace doc {
    export function delExportConfiguration(view:string, id:string);
}
namespace dpo {
    export function getAbsenceBlocksByResource(resourceId:string, beg?:string, end?:string): pf.GanttItem[];
}
namespace dpo {
    export function getDispoByResource(resourceId:string, beg?:string, end?:string): dpo.ResourceAllocationWithPhasesAndAbsences;
}
namespace dpo {
    export function moveDispoByResource(resourceId:string, itemType?:string, itemId?:string, beg?:Date, end?:Date, adaptalloc?:boolean);
}
namespace dpo {
    export function assignToOtherResource(resourceId:string, itemType?:string, itemId?:string, targetResourceId?:string, amount?:number, remark?:string);
}
namespace dpo {
    export function delDispoByResource(resourceId:string, itemType?:string, itemId?:string);
}
namespace dpo {
    export function newDispoByResource(resourceId:string, itemType?:string, parentType?:string, parentId?:string, name?:string, beg?:Date, end?:Date): pf.Reference;
}
namespace dpo {
    export function getWorkItem(resourceId:string, itemId:string): pm.ProjectWorkItem;
}
namespace dpo {
    export function putWorkItem(resourceId:string, itemId:string, obj:pm.ProjectWorkItem);
}
namespace dpo {
    export function delWorkItem(resourceId:string, itemId:string);
}
namespace exp {
    export function getAllExportDefinitions(): exp.JavaScriptExportDefinition[];
}
namespace exp {
    export function getExportDefinitionsForObjectType(objectType:string): exp.JavaScriptExportDefinition[];
}
namespace exp {
    export function getExportDefinition(javaScriptExportDefinitionId:string): exp.JavaScriptExportDefinition;
}
namespace exp {
    export function putExportDefinition(javaScriptExportDefinitionId:string, obj:JavaScriptExportDefinition);
}
namespace exp {
    export function delExportDefinition(javaScriptExportDefinitionId:string);
}
namespace exp {
    export function handleJavaScriptExportRequest(javaScriptExportDefinitionId:string, objectType:string, objectId:string, name?:string): unknown;
}
namespace exp {
    export function handleJavaScriptExportRequestWithSettings(javaScriptExportDefinitionId:string, objectType:string, objectId:string, name?:string, obj:unknown): unknown;
}
namespace fco {
    export function getCostsCenters(): pf.Item[];
}
namespace fco {
    export function getCostsCenter(costsCenterId:string): pf.Item;
}
namespace fco {
    export function getPayPlans(): pf.Item[];
}
namespace fco {
    export function getPayPlan(payPlanId:string): pf.Item;
}
namespace fco {
    export function getCostsTypes(): fco.CostsType[];
}
namespace fco {
    export function getCostsType(costsTypeId:string): fco.CostsType;
}
namespace fco {
    export function getCostsTypesTranslated(): fco.CostsTypeTranslated[];
}
namespace fco {
    export function putCostsTypesTranslated(obj:CostsTypeTranslated[]);
}
namespace fco {
    export function getCostsTypeTranslated(costsTypeId:string): fco.CostsTypeTranslated;
}
namespace fco {
    export function putCostsTypeTranslated(costsTypeId:string, obj:CostsTypeTranslated);
}
namespace fco {
    export function delCostsTypeTranslated(costsTypeId:string);
}
namespace fco {
    export function getCostsTypeGroups(): fco.CostsTypeGroup[];
}
namespace fco {
    export function getCostsTypeGroup(costsTypeGroupId:string): fco.CostsTypeGroup;
}
namespace fco {
    export function getCostsTypeGroupsTranslated(): fco.CostsTypeGroupTranslated[];
}
namespace fco {
    export function putCostsTypeGroupsTranslated(obj:CostsTypeGroupTranslated[]);
}
namespace fco {
    export function getCostsTypeGroupTranslated(costsTypeGroupId:string): fco.CostsTypeGroupTranslated;
}
namespace fco {
    export function putCostsTypeGroupTranslated(costsTypeGroupId:string, obj:CostsTypeGroupTranslated);
}
namespace fco {
    export function delCostsTypeGroupTranslated(costsTypeGroupId:string);
}
namespace fco {
    export function getCurrencies(): fco.Currency[];
}
namespace fco {
    export function getHomeCurrency(): fco.Currency;
}
namespace fco {
    export function convertCurrency(currencyId:string, amount:number, currency?:string, at?:string): fco.CurrencyAmount;
}
namespace fco {
    export function calculateSum(currency?:string, at?:string, obj:CurrencyAmount[]): fco.CurrencyAmount;
}
namespace fco {
    export function getCurrency(currencyId:string): fco.Currency;
}
namespace fco {
    export function putCurrency(currencyId:string, obj:Currency);
}
namespace fco {
    export function delCurrency(currencyId:string);
}
namespace fco {
    export function getCurrencyExchangeRates(currencyId:string, reciprocal?:boolean): fco.CurrencyExchangeRates;
}
namespace fco {
    export function getTodaysCurrencyExchangeRate(currencyId:string, reciprocal?:boolean): fco.CurrencyExchangeRate;
}
namespace fco {
    export function getCurrencyExchangeRateAt(currencyId:string, date:string, reciprocal?:boolean): fco.CurrencyExchangeRate;
}
namespace fco {
    export function putCurrencyExchangeRateAt(currencyId:string, date:string, reciprocal?:boolean, obj:CurrencyExchangeRate);
}
namespace fco {
    export function delCurrencyExchangeRateAt(currencyId:string, date:string);
}
namespace fco {
    export function getPortfolioCostsOverview(ppfId:string, refid?:string, beg?:string, end?:string, currency?:string): fco.CostsOverview;
}
namespace fco {
    export function getPortfoliosCostsOverviews(portfolioid?:string[], refid?:string, beg?:string, end?:string, currency?:string): fco.CostsOverview[];
}
namespace fco {
    export function getPortfolioCostsTimeline(ppfId:string, beg?:string, end?:string, zoom?:string[], grouping?:string[], currency?:string, filterFlow?:string[], filterType?:string[], filterTypeGroup?:string[], filterContainer?:string[], filterProject?:string[], filterPosition?:string[], filterMgmtPhase?:string[]): fco.CostsMatrix;
}
namespace fco {
    export function getProjectCostsOverview(prjId:string, refid?:string, beg?:string, end?:string, currency?:string): fco.CostsOverview;
}
namespace fco {
    export function getProjectsCostsOverviews(projectid?:string[], refid?:string, beg?:string, end?:string, currency?:string): fco.CostsOverview[];
}
namespace fco {
    export function getProjectCostsTimeline(projectId:string, beg?:string, end?:string, zoom?:string[], grouping?:string[], currency?:string, filterFlow?:string[], filterType?:string[], filterTypeGroup?:string[], filterContainer?:string[], filterPosition?:string[], filterMgmtPhase?:string[]): fco.CostsMatrix;
}
namespace fco {
    export function getProjectCostsPositionCostsTimeline(projectId:string, positionId:string, beg?:string, end?:string, zoom?:string[], grouping?:string[], currency?:string, filterFlow?:string[], filterType?:string[], filterTypeGroup?:string[], filterContainer?:string[], filterMgmtPhase?:string[]): fco.CostsMatrix;
}
namespace fco {
    export function getProjectScenarioCostsTimeline(projectScenarioId:string, beg?:string, end?:string, zoom?:string[], grouping?:string[], currency?:string, filterFlow?:string[], filterType?:string[], filterTypeGroup?:string[], filterContainer?:string[], filterPosition?:string[], filterMgmtPhase?:string[]): fco.CostsMatrix;
}
namespace fco {
    export function getProjectScenarioCostsOverview(projectScenarioId:string, refid?:string, beg?:string, end?:string, currency?:string): fco.CostsOverview;
}
namespace fco {
    export function getPortfolioExternalBudgets(ppfId:string, refid?:string, beg?:string, end?:string, currency?:string): fco.ExternalBudget[];
}
namespace fco {
    export function getPortfolioForeignBudgets(ppfId:string, refid?:string, beg?:string, end?:string, currency?:string): fco.ExternalBudget[];
}
namespace fco {
    export function getPortfolioSubObjBudgets(ppfId:string, refid?:string, beg?:string, end?:string, currency?:string): fco.ExternalBudget[];
}
namespace fco {
    export function getPortfolioBudgetPositions(ppfId:string): fco.BudgetPosition[];
}
namespace fco {
    export function getPortfoliosBudgetPositions(portfolioid?:string[]): fco.BudgetPositionsByReference[];
}
namespace fco {
    export function addPortfolioBudgetPosition(ppfId:string, pos?:number, inheritFrom?:string, currency?:string, amount?:number): pf.Reference;
}
namespace fco {
    export function getPortfolioBudgetPosition(ppfId:string, bupId:string): fco.BudgetPosition;
}
namespace fco {
    export function getPortfolioBudgetPositionParent(bupId:string): pf.Reference;
}
namespace fco {
    export function getPortfolioBudgetAssignmentParents(assId:string): pf.Reference[];
}
namespace fco {
    export function getProjectBudgetAssignmentParents(assId:string): pf.Reference[];
}
namespace fco {
    export function getPortfolioBudgetPositionTimeline(ppfId:string, bupId:string, beg?:Date, end?:Date, granularity?:string, currency?:string): pf.Timeline;
}
namespace fco {
    export function putPortfolioBudgetPosition(ppfId:string, bupId:string, obj:BudgetPosition);
}
namespace fco {
    export function delPortfolioBudgetPosition(ppfId:string, bupId:string);
}
namespace fco {
    export function getProjectExternalBudgets(prjid:string, refid?:string, beg?:string, end?:string, currency?:string): fco.ExternalBudget[];
}
namespace fco {
    export function getProjectForeignBudgets(prjid:string, refid?:string, beg?:string, end?:string, currency?:string): fco.ExternalBudget[];
}
namespace fco {
    export function getProjectSubObjBudgets(prjid:string, refid?:string, beg?:string, end?:string, currency?:string): fco.ExternalBudget[];
}
namespace fco {
    export function getProjectBudgetPositions(projectId:string): fco.BudgetPosition[];
}
namespace fco {
    export function getProjectsBudgetPositions(projectid?:string[]): fco.BudgetPositionsByReference[];
}
namespace fco {
    export function addProjectBudgetPosition(projectId:string, ppfId?:string, budgetId?:string, currency?:string, amount?:number): pf.Reference;
}
namespace fco {
    export function getProjectBudgetPosition(projectId:string, bupId:string): fco.BudgetPosition;
}
namespace fco {
    export function putProjectBudgetPosition(projectId:string, bupId:string, obj:BudgetPosition);
}
namespace fco {
    export function delProjectBudgetPosition(projectId:string, bupId:string);
}
namespace fco {
    export function getProjectCostsPositions(projectId:string, currency?:string): fco.ProjectCostsPosition[];
}
namespace fco {
    export function addProjectCostsPosition(projectId:string, pos?:number, currency?:string, amount?:number, forecastScheme?:string): pf.Reference;
}
namespace fco {
    export function getProjectCostsPosition(projectId:string, positionId:string, currency?:string): fco.ProjectCostsPosition;
}
namespace fco {
    export function getProjectCostsPositionParents(positionId:string): pf.Reference[];
}
namespace fco {
    export function putProjectCostsPosition(projectId:string, positionId:string, obj:ProjectCostsPosition);
}
namespace fco {
    export function delProjectCostsPosition(projectId:string, positionId:string);
}
namespace fco {
    export function getProjectCostsActuals(projectId:string, currency?:string): fco.CostsActualGroup[];
}
namespace fco {
    export function getProjectCostsPositionActuals(projectId:string, posId:string, currency?:string): fco.CostsActual[];
}
namespace fco {
    export function addProjectCostsPositionActual(projectId:string, posId:string, currency?:string, amount?:number, timeofpayment?:string, pos?:number): pf.Reference;
}
namespace fco {
    export function getProjectCostsPositionActual(projectId:string, posId:string, actualId:string, currency?:string): fco.CostsActual;
}
namespace fco {
    export function getProjectCostsPositionActualParents(actualId:string): pf.Reference[];
}
namespace fco {
    export function putProjectCostsPositionActual(projectId:string, posId:string, actualId:string, obj:CostsActual);
}
namespace fco {
    export function delProjectCostsPositionActual(projectId:string, posId:string, actualId:string);
}
namespace fco {
    export function moveCostsPositionActual(projectId:string, posId:string, actualId:string, targetId?:string): pf.Reference;
}
namespace fco {
    export function getProjectPhasePlannedCosts(phaseId:string, recursive?:boolean, currency?:string): fco.CostsForecasts;
}
namespace fco {
    export function getMacroAllocationPlannedCosts(macroAllocationId:string, currency?:string): fco.CostsForecast;
}
namespace lcy {
    export function getStates(): lcy.LifecycleState[];
}
namespace lcy {
    export function getState(stateId:string): lcy.LifecycleState;
}
namespace lcy {
    export function getStatesTranslated(): lcy.LifecycleStateTranslated[];
}
namespace lcy {
    export function getStateTranslated(stateId:string): lcy.LifecycleStateTranslated;
}
namespace lcy {
    export function putStateTranslated(stateId:string, obj:LifecycleStateTranslated);
}
namespace lcy {
    export function delStateTranslated(stateId:string);
}
namespace lcy {
    export function getSubStateTranslated(stateId:string, subStateId:string): lcy.LifecycleSubStateTranslated;
}
namespace lcy {
    export function getSubStatesTranslated(stateId:string): lcy.LifecycleSubStateTranslated[];
}
namespace lcy {
    export function putSubStateTranslated(stateId:string, subStateId:string, obj:LifecycleSubStateTranslated);
}
namespace lcy {
    export function delSubStateTranslated(stateId:string, subStateId:string);
}
namespace lcy {
    export function getStateTransitions(stateId:string): lcy.LifecycleTransition[];
}
namespace lcy {
    export function getStateReachableStates(stateId:string): lcy.LifecycleState[];
}
namespace lcy {
    export function getTransitions(): lcy.LifecycleTransition[];
}
namespace lcy {
    export function getTransition(transitionId:string): lcy.LifecycleTransition;
}
namespace lcy {
    export function getTransitionTranslated(transitionId:string): lcy.LifecycleTransitionTranslated;
}
namespace lcy {
    export function putTransitionTranslated(transitionId:string, obj:LifecycleTransitionTranslated);
}
namespace lcy {
    export function delTransitionTranslated(transitionId:string);
}
namespace lcy {
    export function getStuckObjects(objtype:string): lcy.ObjectReferencesInLifecycleState[];
}
namespace lcy {
    export function migrateObjects(objtype:string, sourceStateId:string, sourceSubStateId:string, targetStateId:string, targetSubStateId:string, remark?:string): pf.Reference[];
}
namespace lcy {
    export function getTypeReachableStates(objtype:string): lcy.LifecycleState[];
}
namespace lcy {
    export function getInitialStates(): lcy.LifecycleStateWithSubState[];
}
namespace lcy {
    export function getTypeInitialState(objtype:string): lcy.LifecycleStateWithSubState;
}
namespace lcy {
    export function putTypeInitialState(objtype:string, obj:LifecycleStateWithSubStateReference);
}
namespace lcy {
    export function delTypeInitialState(objtype:string);
}
namespace lcy {
    export function getObjectsByState(stateId:string, objType:string): pf.Reference[];
}
namespace lcy {
    export function getObjectState(objtype:string, objid:string): lcy.LifecycleStateWithSubState;
}
namespace lcy {
    export function getObjectReachableStates(objtype:string, objid:string): lcy.LifecycleState[];
}
namespace lcy {
    export function getObjectTransitions(objtype:string, objid:string): lcy.LifecycleTransition[];
}
namespace lcy {
    export function getObjectHistory(objtype:string, objid:string): lcy.LifecycleHistory[];
}
namespace lcy {
    export function getObjectsStates(objtype:string, objids:string[]): lcy.LifecycleStateWithSubStateAndObjId[];
}
namespace lcy {
    export function getObjectsReachableStates(objtype:string, objids:string[]): lcy.LifecycleStateArrayWithObjId[];
}
namespace lcy {
    export function getObjectsTransitions(objtype:string, objids:string[]): lcy.LifecycleTransitionArrayWithObjId[];
}
namespace lcy {
    export function getObjectsHistories(objtype:string, objids:string[]): lcy.LifecycleHistoryArrayWithObjId[];
}
namespace lcy {
    export function upgradeObject(objtype:string, objid:string, transition:string, remark?:string): lcy.LifecycleStateWithSubState;
}
namespace lic {
    export function getLicenseStatus(): lic.LicenseStatus;
}
namespace lic {
    export function getLicenses(): lic.License[];
}
namespace lic {
    export function putLicenses(obj:License[]);
}
namespace lic {
    export function getUsages(): lic.LicenseUsage[];
}
namespace lic {
    export function initTenants();
}
namespace main {
    export function getVersion(): main.Versions;
}
namespace main {
    export function getOpenApi3Json(modules?:string[]): unknown;
}
namespace main {
    export function getOpenApi3Yaml(modules?:string[]): unknown;
}
namespace main {
    export function getStartUrl(): unknown;
}
namespace main {
    export function getObjectUrl(type:string, id:string): unknown;
}
namespace main {
    export function getServerStatus(): main.ServerStatus;
}
namespace msg {
    export function getMessageForwardRule(forwardRuleId:string): msg.MessageForwardRule;
}
namespace msg {
    export function putMessageForwardRule(forwardRuleId:string, obj:MessageForwardRule);
}
namespace msg {
    export function delMessageForwardRule(forwardRuleId:string);
}
namespace msg {
    export function getMessageForwardRules(): msg.MessageForwardRule[];
}
namespace msg {
    export function getMessageForwardRuleOfResource(resourceId:string, forwardRuleId:string): msg.MessageForwardRule;
}
namespace msg {
    export function putMessageForwardRuleOfResource(resourceId:string, forwardRuleId:string, obj:MessageForwardRule);
}
namespace msg {
    export function delMessageForwardRuleOfResource(resourceId:string, forwardRuleId:string);
}
namespace msg {
    export function getMessageForwardRulesOfResource(resourceId:string): msg.MessageForwardRule[];
}
namespace msg {
    export function getMessages(includeread?:boolean): msg.Message[];
}
namespace msg {
    export function getMessage(messageId:string): msg.Message;
}
namespace msg {
    export function delMessage(messageId:string);
}
namespace msg {
    export function readMessage(messageId:string);
}
namespace msg {
    export function postMessage(obj:MessageContent): pf.Reference;
}
namespace msg {
    export function getMessageTriggers(): pf.NamedReference[];
}
namespace msg {
    export function postMaintenanceMessageAll(obj:MessageContent);
}
namespace msg {
    export function postMaintenanceMessageSingle(tenant:string, obj:MessageContent);
}
namespace msg {
    export function sendMail(tos?:string[], ccs?:string[], bccs?:string[], subject?:string, body?:string, html?:boolean, wait?:boolean): unknown;
}
namespace msg {
    export function sendMailByTemplate(templateId:string, tos?:string[], ccs?:string[], bccs?:string[], subject?:string, lang?:string, wait?:boolean, obj:unknown): unknown;
}
namespace mtg {
    export function getMeeting(meetingId:string): mtg.Meeting;
}
namespace mtg {
    export function putMeeting(meetingId:string, obj:Meeting);
}
namespace mtg {
    export function delMeeting(meetingId:string);
}
namespace mtg {
    export function getMeetings(state?:string): mtg.Meeting[];
}
namespace mtg {
    export function moveMeeting(meetingId:string, dest?:string);
}
namespace mtg {
    export function copyMeeting(meetingId:string, dest?:string): pf.Reference;
}
namespace mtg {
    export function getMeetingGroups(): mtg.MeetingGroup[];
}
namespace mtg {
    export function getMeetingGroup(groupId:string): mtg.MeetingGroup;
}
namespace mtg {
    export function putMeetingGroup(groupId:string, obj:MeetingGroup);
}
namespace mtg {
    export function delMeetingGroup(groupId:string);
}
namespace mtg {
    export function addMeetingGroup(copy?:string, copyrels?:boolean): pf.Reference;
}
namespace mtg {
    export function getMeetingsOfGroup(groupid:string, state?:string): mtg.Meeting[];
}
namespace mtg {
    export function addMeeting(groupid:string, copy?:string, copyrels?:boolean): pf.Reference;
}
namespace mtg {
    export function getSubGroups(groupid:string): mtg.MeetingGroup[];
}
namespace mtg {
    export function addMeetingGroupSubGroup(groupid:string, copy?:string, copyrels?:boolean): pf.Reference;
}
namespace mtg {
    export function moveGroup(groupid:string, parentGroupId:string);
}
namespace mtg {
    export function moveGroupToTop(groupid:string);
}
namespace mtg {
    export function getMeetingsByRef(reltype:string, reftype:string, refid:string, state?:string): mtg.Meeting[];
}
namespace nav {
    export function findObjects(obj:FindRequest): nav.NavigationItem[];
}
namespace nav {
    export function getTypeInfos(language?:string): nav.TypeInfo[];
}
namespace nav {
    export function getRootContext(deleted?:boolean): nav.NavigationContext;
}
namespace nav {
    export function getContext(type:string, id:string, parentType?:string, parentId?:string, deleted?:boolean): nav.NavigationContext;
}
namespace nav {
    export function getObject(type:string, id:string, deleted?:boolean): nav.NavigationItem;
}
namespace nav {
    export function getContextSearch(type:string, id:string, query?:string, regex?:string, recursive?:number, ranking?:number, followrelations?:boolean): nav.NavigationLink[];
}
namespace nav {
    export function getSearch(type:string, query?:string, regex?:string, ranking?:number): nav.NavigationItem[];
}
namespace nav {
    export function getMemberTextSearch(type:string): nav.NavigationItem[];
}
namespace nav {
    export function getMemberRangeSearch(type:string): nav.NavigationItem[];
}
namespace nav {
    export function getMemberRegexSearch(type:string): nav.NavigationItem[];
}
namespace pf {
    export function getAttachment(attachmentId:string, name?:string): unknown;
}
namespace pf {
    export function getAttachmentDetails(attachmentId:string): pf.AttachmentDetails;
}
namespace pf {
    export function getAttachmentBinary(attachmentId:string): unknown;
}
namespace pf {
    export function getAttachmentText(attachmentId:string, encoding?:string): unknown;
}
namespace pf {
    export function getAttachmentJson(attachmentId:string): unknown;
}
namespace pf {
    export function addAttachment(obj:unknown): pf.AttachmentDetails;
}
namespace pf {
    export function addAttachmentAndLink(objType:string, objId:string, name?:string, code?:string, description?:string, sortindex?:number, folder?:string, obj:unknown): pf.AttachmentLink;
}
namespace pf {
    export function addAttachmentBinary(mimeType:string, obj:unknown): pf.AttachmentDetails;
}
namespace pf {
    export function addAttachmentBinaryAndLink(objType:string, objId:string, mimeType:string, name?:string, code?:string, description?:string, sortindex?:number, folder?:string, obj:unknown): pf.AttachmentLink;
}
namespace pf {
    export function addAttachmentText(mimeType:string, encoding?:string, obj:unknown): pf.AttachmentDetails;
}
namespace pf {
    export function addAttachmentTextAndLink(objType:string, objId:string, mimeType:string, name?:string, code?:string, description?:string, sortindex?:number, folder?:string, encoding?:string, obj:unknown): pf.AttachmentLink;
}
namespace pf {
    export function addAttachmentJson(mimeType:string, obj:unknown): pf.AttachmentDetails;
}
namespace pf {
    export function extractBackupMetadata(obj:unknown): pf.BackupMetadata;
}
namespace pf {
    export function addAttachmentJsonAndLink(objType:string, objId:string, mimeType:string, name?:string, code?:string, description?:string, sortindex?:number, folder?:string, obj:unknown): pf.AttachmentLink;
}
namespace pf {
    export function getConfig(configId:string): unknown;
}
namespace pf {
    export function putConfig(configId:string, obj:unknown);
}
namespace pf {
    export function delConfig(configId:string);
}
namespace pf {
    export function getCurrentTenant(): pf.Tenant;
}
namespace pf {
    export function getCurrentTenantWithAdditionalData(): pf.TenantWithAdditionalData;
}
namespace pf {
    export function getCurrentTenantLicenseFeatures(): pf.LicenseFeatures;
}
namespace pf {
    export function getEnumType(typeId:string): pf.EnumType;
}
namespace pf {
    export function getEnumTypeTranslated(typeId:string): pf.ItemTranslated;
}
namespace pf {
    export function putEnumTypeTranslated(typeId:string, obj:ItemTranslated);
}
namespace pf {
    export function delEnumTypeTranslated(typeId:string);
}
namespace pf {
    export function getEnumTypes(): pf.EnumType[];
}
namespace pf {
    export function getEnumValue(typeId:string, valueId:string, deleted?:boolean): pf.ItemWithDeletedFlag;
}
namespace pf {
    export function getEnumValues(typeId:string, deleted?:boolean): pf.ItemWithDeletedFlag[];
}
namespace pf {
    export function putEnumValues(typeId:string, obj:Item[]);
}
namespace pf {
    export function getEnumValuesTranslated(typeId:string): pf.ItemTranslated[];
}
namespace pf {
    export function putEnumValuesTranslated(typeId:string, obj:ItemTranslated[]);
}
namespace pf {
    export function delEnumValuesTranslated(typeId:string);
}
namespace pf {
    export function getEnumValueTranslated(typeId:string, valueId:string): pf.ItemTranslated;
}
namespace pf {
    export function putEnumValueTranslated(typeId:string, valueId:string, obj:ItemTranslated);
}
namespace pf {
    export function delEnumValueTranslated(typeId:string, valueId:string);
}
namespace pf {
    export function getServerConfig(configKey:string): unknown;
}
namespace pf {
    export function getMaxParallelRequests(): pf.ParallelRequestsLimit;
}
namespace pf {
    export function getUserAgent(): pf.UserAgent;
}
namespace pf {
    export function getDefaultIcon(objType:string, name?:string, code?:string): unknown;
}
namespace pf {
    export function getDocumentFolders(objType:string, objId:string, folder?:string, recursive?:boolean): pf.DocumentFolder[];
}
namespace pf {
    export function getDocumentLinks(objType:string, objId:string, folder?:string, recursive?:boolean): pf.DocumentLink[];
}
namespace pf {
    export function getDocumentLink(objType:string, objId:string, linkId:string): pf.DocumentLink;
}
namespace pf {
    export function putDocumentLink(objType:string, objId:string, linkId:string, obj:DocumentLink);
}
namespace pf {
    export function delDocumentLink(objType:string, objId:string, linkId:string);
}
namespace pf {
    export function moveDocumentLink(objType:string, objId:string, linkId:string, folder?:string);
}
namespace pf {
    export function getDocumentLinkParent(linkId:string): pf.Reference;
}
namespace pf {
    export function getDocumentFolder(objType:string, objId:string, folderId:string): pf.DocumentFolder;
}
namespace pf {
    export function putDocumentFolder(objType:string, objId:string, folderId:string, obj:DocumentFolder);
}
namespace pf {
    export function addDocumentFolder(objType:string, objId:string, folder?:string): pf.Reference;
}
namespace pf {
    export function moveDocumentFolder(objType:string, objId:string, folderId:string, folder?:string);
}
namespace pf {
    export function delDocumentFolder(objType:string, objId:string, folderId:string);
}
namespace pf {
    export function getDocumentFolderParent(folderId:string): pf.Reference;
}
namespace pf {
    export function addExplicitRelation(relationType:string, sourcetype?:string, sourceid?:string, targettype?:string, targetid?:string): pf.Reference;
}
namespace pf {
    export function getExplicitRelation(relationType:string, relationId:string): pf.Relation;
}
namespace pf {
    export function delExplicitRelation(relationType:string, relationId:string);
}
namespace pf {
    export function delExplicitRelationByRef(relationType:string, sourcetype?:string, sourceid?:string, targettype?:string, targetid?:string);
}
namespace pf {
    export function getExplicitRelationTypesTranslated(): pf.ExplicitRelationTypeTranslated[];
}
namespace pf {
    export function getExplicitRelationTypeTranslated(relationType:string): pf.ExplicitRelationTypeTranslated;
}
namespace pf {
    export function putExplicitRelationTypeTranslated(relationType:string, obj:ExplicitRelationTypeTranslated);
}
namespace pf {
    export function delExplicitRelationTypeTranslated(relationType:string);
}
namespace pf {
    export function getQrCode(text?:string): unknown;
}
namespace pf {
    export function getDataMatrix(text?:string): unknown;
}
namespace pf {
    export function inspectConnection(obj:ConnectionInformationSeenFromClient): pf.ConnectionInformationSeenFromServer;
}
namespace pf {
    export function getPropertyDefinition(definitionId:string): pf.PropertyDefinition;
}
namespace pf {
    export function getPropertyDefinitionTypes(): pf.NamedReference[];
}
namespace pf {
    export function getPropertyDefinitions(objectType:string): pf.PropertyDefinition[];
}
namespace pf {
    export function getPropertyDefinitionsTranslated(objectType:string): pf.PropertyDefinitionTranslated[];
}
namespace pf {
    export function putPropertyDefinitionsTranslated(objectType:string, obj:PropertyDefinitionTranslated[]);
}
namespace pf {
    export function getRelationType(relationType:string): pf.RelationTypeWithConstraints;
}
namespace pf {
    export function getRelationTypes(): pf.RelationTypeWithConstraints[];
}
namespace pf {
    export function getAllRelationTypesForType(objectType:string): pf.RelationTypeWithConstraints[];
}
namespace pf {
    export function getForwardRelationTypesForType(objectType:string): pf.RelationTypeWithConstraints[];
}
namespace pf {
    export function getBackwardRelationTypesForType(objectType:string): pf.RelationTypeWithConstraints[];
}
namespace pf {
    export function getAllRelations(objectType:string, objectId:string, desttype?:string, destid?:string, type?:string, includeimplicit?:boolean): pf.Relation[];
}
namespace pf {
    export function getForwardRelations(sourceType:string, sourceId:string, targettype?:string, targetid?:string, type?:string, includeimplicit?:boolean): pf.Relation[];
}
namespace pf {
    export function getBackwardRelations(targetType:string, targetId:string, sourcetype?:string, sourceid?:string, type?:string, includeimplicit?:boolean): pf.Relation[];
}
namespace pf {
    export function getCurrentUserAllRelations(desttype?:string, destid?:string, type?:string, includeimplicit?:boolean): pf.Relation[];
}
namespace pf {
    export function getCurrentUserForwardRelations(targettype?:string, targetid?:string, type?:string, includeimplicit?:boolean): pf.Relation[];
}
namespace pf {
    export function getCurrentUserBackwardRelations(sourcetype?:string, sourceid?:string, type?:string, includeimplicit?:boolean): pf.Relation[];
}
namespace pf {
    export function getUndeleteLimit(): pf.UndeleteLimit;
}
namespace pf {
    export function getUniqueReadableCodeDefs(): pf.UniqueReadableCodeDef[];
}
namespace pf {
    export function getUniqueReadableCodeDef(typeId:string): pf.UniqueReadableCodeDef;
}
namespace pf {
    export function putUniqueReadableCodeDef(typeId:string, obj:UniqueReadableCodeDef);
}
namespace pf {
    export function delUniqueReadableCodeDef(typeId:string);
}
namespace pf {
    export function convertUnit(systemId:string, source?:string, dest?:string, value?:number): pf.ValueWithUnit;
}
namespace pf {
    export function getUnit(systemId:string, unitId:string): pf.Unit;
}
namespace pf {
    export function getUnits(systemId:string): pf.Unit[];
}
namespace pf {
    export function getUnitsFactors(systemId:string, ref?:string): pf.UnitFactor[];
}
namespace pf {
    export function putUnitsFactors(systemId:string, obj:UnitFactor[]);
}
namespace pf {
    export function getUnitsPreference(systemId:string): pf.UnitPreference;
}
namespace pf {
    export function putUnitsPreference(systemId:string, obj:UnitPreference);
}
namespace pf {
    export function getNewWebSocketConnection(): pf.WebSocketInfo;
}
namespace pi {
    export function getProjectItemTypes(): pi.ProjectItemType[];
}
namespace pi {
    export function getProjectItemType(type:string): pi.ProjectItemType;
}
namespace pi {
    export function getProjectItems(type:string, state?:string[], lateststatechange?:Date): pi.ProjectItem[];
}
namespace pi {
    export function getProjectItem(type:string, itemId:string): pi.ProjectItem;
}
namespace pi {
    export function putProjectItem(type:string, itemId:string, obj:ProjectItem);
}
namespace pi {
    export function delProjectItem(type:string, itemId:string);
}
namespace pi {
    export function addProjectItem(type:string, copy?:string, name?:string, description?:string, adddocs?:boolean, addrelations?:boolean, addbwdrelations?:boolean): pf.Reference;
}
namespace pi {
    export function getProjectItemsByRef(type:string, reltype:string, reftype:string, refid:string, state?:string[], lateststatechange?:Date): pi.ProjectItem[];
}
namespace pi {
    export function getProjectItemSummariesByRef(type:string, reltype:string, reftype:string, refid:string, state?:string[], lateststatechange?:Date): pi.ProjectItemSummary[];
}
namespace pi {
    export function addProjectItemByRef(type:string, reltype:string, reftype:string, refid:string, copy?:string, name?:string, description?:string, forward?:boolean, adddocs?:boolean, addrelations?:boolean, addbwdrelations?:boolean): pf.Reference;
}
namespace pm {
    export function copyWorkItemTree(workItemId:string, targetId?:string, sortIndex?:number, includeLogs?:boolean, includeDocumentLinks?:boolean, includeShiftPlans?:boolean, includeDependencies?:boolean, includeAllocations?:boolean, includePlannedCosts?:boolean, includeTodoLinks?:boolean, includeTodos?:boolean): pf.Reference;
}
namespace pm {
    export function backupProject(projectId:string): unknown;
}
namespace pm {
    export function recoverProject(obj:unknown): pf.RecoveryResult;
}
namespace pm {
    export function getMacroAllocation(macroAllocationId:string, currency?:string, version?:Date): alc.ResourceAllocation;
}
namespace pm {
    export function putMacroAllocation(macroAllocationId:string, obj:alc.ResourceAllocation);
}
namespace pm {
    export function delMacroAllocation(macroAllocationId:string);
}
namespace pm {
    export function moveWorkItem(workItemId:string, to?:string, strategy?:string, resourceid?:string);
}
namespace pm {
    export function moveWorkItemEnd(workItemId:string, to?:string, strategy?:string, resourceid?:string);
}
namespace pm {
    export function proposeWorkItemEnd(workItemId:string, maxmove?:number, fewerWorkWeight?:number): pm.PositionProposal;
}
namespace pm {
    export function moveWorkItemStart(workItemId:string, to?:string, strategy?:string, resourceid?:string);
}
namespace pm {
    export function proposeWorkItemStart(workItemId:string, maxmove?:number, fewerWorkWeight?:number): pm.PositionProposal;
}
namespace pm {
    export function getMovePatternByWorkItem(workItemId:string, strategy?:string, resourceid?:string): pm.MovePattern[];
}
namespace pm {
    export function getMovePatternByWorkItemEnd(workItemId:string, strategy?:string, resourceid?:string): pm.MovePattern[];
}
namespace pm {
    export function getMovePatternByWorkItemStart(workItemId:string, strategy?:string, resourceid?:string): pm.MovePattern[];
}
namespace pm {
    export function getPmMethods(): pm.ProjectManagementMethod[];
}
namespace pm {
    export function getPmMethod(methodId:string): pm.ProjectManagementMethod;
}
namespace pm {
    export function getPmMethodTranslated(methodId:string): pm.ProjectManagementMethodTranslated;
}
namespace pm {
    export function putPmMethodTranslated(methodId:string, obj:ProjectManagementMethodTranslated);
}
namespace pm {
    export function delPmMethodTranslated(methodId:string);
}
namespace pm {
    export function getPmMethodPhases(methodId:string): pm.ProjectManagementMethodPhase[];
}
namespace pm {
    export function getPmMethodPhase(methodId:string, phaseId:string): pm.ProjectManagementMethodPhase;
}
namespace pm {
    export function getPmMethodPhaseTranslated(methodId:string, phaseId:string): pm.ProjectManagementMethodPhaseTranslated;
}
namespace pm {
    export function putPmMethodPhaseTranslated(methodId:string, phaseId:string, obj:ProjectManagementMethodPhaseTranslated);
}
namespace pm {
    export function delPmMethodPhaseTranslated(methodId:string, phaseId:string);
}
namespace pm {
    export function getPmMethodPhaseLifecycleAssignment(methodId:string): pm.ProjectManagementMethodPhaseLifecycleAssignment[];
}
namespace pm {
    export function getPmMethodsPhaseLifecycleAssignment(): pm.ProjectManagementMethodPhaseLifecycleAssignment[];
}
namespace pm {
    export function putPmMethodsPhaseLifecycleAssignment(obj:ProjectManagementMethodPhaseLifecycleAssignment[]);
}
namespace pm {
    export function getPortfolioScenarios(): pf.GenericObject[];
}
namespace pm {
    export function addPortfolioScenario(): pf.Reference;
}
namespace pm {
    export function getPortfolioScenario(pfScenarioId:string): pf.GenericObject;
}
namespace pm {
    export function putPortfolioScenario(pfScenarioId:string, obj:pf.GenericObject);
}
namespace pm {
    export function delPortfolioScenario(pfScenarioId:string);
}
namespace pm {
    export function getProject(projectId:string, version?:Date): pm.Project;
}
namespace pm {
    export function putProject(projectId:string, obj:Project);
}
namespace pm {
    export function delProject(projectId:string);
}
namespace pm {
    export function undelProject(projectId:string);
}
namespace pm {
    export function getProjectTimeline(projectId:string, beg?:Date, end?:Date, granularity?:string): pf.Timeline;
}
namespace pm {
    export function moveProject(projectId:string, fromPortfolio?:string, toPortfolio?:string);
}
namespace pm {
    export function linkProject(projectId:string, portfolio?:string);
}
namespace pm {
    export function unlinkProject(projectId:string, portfolio?:string);
}
namespace pm {
    export function getProjects(): pm.Project[];
}
namespace pm {
    export function getRecentlyDeletedProjects(): pf.ItemWithDeletedFlagAndModifiedAt[];
}
namespace pm {
    export function getProjectClassification(projectId:string): cls.Classification[];
}
namespace pm {
    export function putProjectClassification(projectId:string, obj:cls.Classification[]);
}
namespace pm {
    export function getProjectConstraint(scenarioId:string, constraintId:string): pm.ProjectConstraint;
}
namespace pm {
    export function putProjectConstraint(scenarioId:string, constraintId:string, movetarget?:boolean, movesource?:boolean, resourceid?:string, obj:ProjectConstraint);
}
namespace pm {
    export function delProjectConstraint(scenarioId:string, constraintId:string);
}
namespace pm {
    export function getProjectConstraints(scenarioId:string, predecessorId?:string, successorId?:string, milestoneId?:string, workItemId?:string): pm.ProjectConstraint[];
}
namespace pm {
    export function getAllProjectDependencies(version?:Date): pm.ProjectDependency[];
}
namespace pm {
    export function getProjectDependency(dependencyId:string, version?:Date): pm.ProjectDependency;
}
namespace pm {
    export function putProjectDependency(dependencyId:string, obj:ProjectDependency);
}
namespace pm {
    export function delProjectDependency(dependencyId:string);
}
namespace pm {
    export function addProjectDependency(predecessortype?:string, predecessorid?:string, successortype?:string, successorid?:string): pf.Reference;
}
namespace pm {
    export function getProjectDependencies(projectId:string, version?:Date): pm.ProjectDependency[];
}
namespace pm {
    export function getProjectDetails(projectId:string): pf.VersionedDetails;
}
namespace pm {
    export function putProjectDetails(projectId:string, obj:pf.VersionedDetails);
}
namespace pm {
    export function getProjectIdentification(projectId:string): lcy.ItemWithLifecycle;
}
namespace pm {
    export function getProjectIdentifications(): lcy.ItemWithLifecycle[];
}
namespace pm {
    export function getProjectsWithMissingReport(projectstate?:string[], reportstate?:string[], reporttype?:string[]): pm.Project[];
}
namespace pm {
    export function getProjectManagementMethod(projectId:string): pm.ProjectManagementMethod;
}
namespace pm {
    export function getProjectManagementMethodPhase(projectId:string): pm.ProjectManagementMethodPhase;
}
namespace pm {
    export function getProjectManagementMethodTimeline(projectId:string): pm.ProjectManagementMethodTimeline;
}
namespace pm {
    export function getProjectScenarioManagementMethodTimeline(scenarioId:string): pm.ProjectManagementMethodTimeline;
}
namespace pm {
    export function getProjectPortfolios(): pm.ProjectPortfolio[];
}
namespace pm {
    export function getRootProjectPortfolios(): pm.ProjectPortfolio[];
}
namespace pm {
    export function addProjectPortfolio(): pf.Reference;
}
namespace pm {
    export function getProjectPortfolio(portfolioId:string): pm.ProjectPortfolio;
}
namespace pm {
    export function putProjectPortfolio(portfolioId:string, obj:ProjectPortfolio);
}
namespace pm {
    export function delProjectPortfolio(portfolioId:string);
}
namespace pm {
    export function getProjectPortfolioDependencies(portfolioId:string): pm.ProjectDependency[];
}
namespace pm {
    export function getProjectPortfolioSubPortfolios(portfolioId:string): pm.ProjectPortfolio[];
}
namespace pm {
    export function addProjectPortfolioSubPortfolio(portfolioId:string): pf.Reference;
}
namespace pm {
    export function getProjectPortfolioProjects(portfolioId:string): pm.Project[];
}
namespace pm {
    export function addProjectPortfolioProject(portfolioId:string, copy?:string, includeLogs?:boolean, includeDocumentLinks?:boolean, includeShiftPlans?:boolean, includeDependencies?:boolean, includeAllocations?:boolean, includeTodoLinks?:boolean, includeTodos?:boolean): pf.Reference;
}
namespace pm {
    export function uploadProjectPortfolioProject(portfolioId:string, format?:string, obj:unknown): pf.Reference;
}
namespace pm {
    export function moveProjectPortfolio(portfolioId:string, portfolio?:string);
}
namespace pm {
    export function moveProjectPortfolioToTop(portfolioId:string);
}
namespace pm {
    export function getProjectPortfolioMilestones(portfolioId:string, includeparent?:boolean): pm.ProjectPortfolioMilestone[];
}
namespace pm {
    export function addProjectPortfolioMilestone(portfolioId:string, at?:string): pf.Reference;
}
namespace pm {
    export function getProjectPortfolioMilestone(portfolioId:string, milestoneId:string): pm.ProjectPortfolioMilestone;
}
namespace pm {
    export function putProjectPortfolioMilestone(portfolioId:string, milestoneId:string, obj:ProjectPortfolioMilestone);
}
namespace pm {
    export function delProjectPortfolioMilestone(portfolioId:string, milestoneId:string);
}
namespace pm {
    export function getProjectReportsByType(projectId:string, reportType:string): pm.ProjectReport[];
}
namespace pm {
    export function getProjectReports(projectId:string, reporttype?:string[]): pm.ProjectReport[];
}
namespace pm {
    export function addProjectReport(projectId:string, reportType:string, copy?:string, currency?:string): pf.Reference;
}
namespace pm {
    export function getLatestProjectReport(projectId:string, reportType:string, state?:string[], skip?:number): pm.ProjectReport;
}
namespace pm {
    export function getProjectReport(reportType:string, reportId:string, recalculate?:boolean, currency?:string): pm.ProjectReport;
}
namespace pm {
    export function putProjectReport(reportType:string, reportId:string, currency?:string, obj:ProjectReport);
}
namespace pm {
    export function delProjectReport(reportType:string, reportId:string);
}
namespace pm {
    export function getAllProjectReports(reportType:string[], state?:string[]): pm.ProjectReport[];
}
namespace pm {
    export function getAllProjectPortfoliosWithLatestReports(state?:string[], reporttype?:string[]): pm.ProjectPortfolioWithReports[];
}
namespace pm {
    export function getProjectPortfolioReportsByType(projectPortfolioId:string, reportType:string): pm.ProjectPortfolioReport[];
}
namespace pm {
    export function getProjectPortfolioReports(projectPortfolioId:string, reporttype?:string[]): pm.ProjectPortfolioReport[];
}
namespace pm {
    export function addProjectPortfolioReport(projectPortfolioId:string, reportType:string, copy?:string): pf.Reference;
}
namespace pm {
    export function getLatestProjectPortfolioReport(projectPortfolioId:string, reportType:string, state?:string[], skip?:number): pm.ProjectPortfolioReport;
}
namespace pm {
    export function getProjectPortfolioReport(reportType:string, reportId:string): pm.ProjectPortfolioReport;
}
namespace pm {
    export function putProjectPortfolioReport(reportType:string, reportId:string, obj:ProjectPortfolioReport);
}
namespace pm {
    export function delProjectPortfolioReport(reportType:string, reportId:string);
}
namespace pm {
    export function getAllProjectPortfolioReports(reportType:string[], state?:string[]): pm.ProjectPortfolioReport[];
}
namespace pm {
    export function getAllProjectsWithLatestReports(state?:string[], reporttype?:string[]): pm.ProjectWithReports[];
}
namespace pm {
    export function getProjectPortfolioReportType(reportTypeId:string): pm.ProjectPortfolioReportType;
}
namespace pm {
    export function putProjectPortfolioReportType(reportTypeId:string, obj:ProjectPortfolioReportType);
}
namespace pm {
    export function delProjectPortfolioReportType(reportTypeId:string);
}
namespace pm {
    export function getProjectPortfolioReportTypes(): pm.ProjectPortfolioReportType[];
}
namespace pm {
    export function getProjectReportType(reportTypeId:string): pm.ProjectReportType;
}
namespace pm {
    export function putProjectReportType(reportTypeId:string, obj:ProjectReportType);
}
namespace pm {
    export function delProjectReportType(reportTypeId:string);
}
namespace pm {
    export function getProjectReportTypes(): pm.ProjectReportType[];
}
namespace pm {
    export function getProjectActiveScenario(projectId:string, singleinactive?:boolean): pm.ProjectScenario;
}
namespace pm {
    export function getProjectActiveScenarioHistory(projectId:string, singleinactive?:boolean, until?:Date): pf.ItemTimeline;
}
namespace pm {
    export function getProjectsWithActiveScenario(singleinactive?:boolean): pm.Project[];
}
namespace pm {
    export function getProjectSummary(projectId:string, currency?:string, state?:string[], reporttype?:string[]): pm.ProjectSummary;
}
namespace pm {
    export function getProjectSummaries(projectid?:string[], currency?:string, state?:string[], reporttype?:string[]): pm.ProjectSummary[];
}
namespace pm {
    export function getProjectAccumulatedValues(projectId:string, beg?:string, end?:string, currency?:string): pm.ProjectWorkItemAccumulatedValues[];
}
namespace pm {
    export function getProjectWorkItemProgressCorrections(workItemId:string): pm.ProjectWorkItemRemainingEfforts;
}
namespace pm {
    export function getProjectWorkItemProgressCorrection(workItemId:string, at?:string): pm.ProjectWorkItemRemainingEfforts;
}
namespace pm {
    export function delProjectWorkItemProgressCorrection(workItemId:string, at?:string, deleteoverride?:boolean);
}
namespace pm {
    export function updateProjectWorkItemProgressCorrection(workItemId:string, at?:string, progress?:number, remainingeffort?:string, remark?:string, includestimebased?:boolean, deleteoverride?:boolean);
}
namespace pm {
    export function getProjectScenarioProgressCorrections(scenarioId:string): pm.ProjectWorkItemRemainingEfforts[];
}
namespace pm {
    export function getScenarioAccumulatedValues(scenarioId:string, beg?:string, end?:string, currency?:string): pm.ProjectWorkItemAccumulatedValues[];
}
namespace pm {
    export function getWorkItemAccumulatedValues(workItemId:string, beg?:string, end?:string, currency?:string): pm.ProjectWorkItemAccumulatedValues;
}
namespace pm {
    export function getScenarioWorkItems(scenarioId:string, tree?:boolean, version?:Date): pm.ProjectWorkItem[];
}
namespace pm {
    export function getProjectScenario(scenarioId:string, version?:Date): pm.ProjectScenario;
}
namespace pm {
    export function getProjectScenarioChangesTimeline(scenarioId:string, beg?:Date, end?:Date, granularity?:string): pf.Timeline;
}
namespace pm {
    export function putProjectScenario(scenarioId:string, obj:ProjectScenario);
}
namespace pm {
    export function delProjectScenario(scenarioId:string);
}
namespace pm {
    export function undelProjectScenario(scenarioId:string);
}
namespace pm {
    export function getProjectScenarioDependencies(scenarioId:string, version?:Date): pm.ProjectDependency[];
}
namespace pm {
    export function getProjectScenarioMacroAllocations(scenarioId:string, version?:Date): alc.ResourceAllocation[];
}
namespace pm {
    export function downloadProjectScenario(scenarioId:string, format?:string): unknown;
}
namespace pm {
    export function getProjectScenarios(projectId:string): pm.ProjectScenario[];
}
namespace pm {
    export function getRecentlyDeletedProjectScenarios(): pf.ItemWithDeletedFlagModifiedAtAndParent[];
}
namespace pm {
    export function addProjectScenario(projectId:string, copy?:string, includeLogs?:boolean, includeDocumentLinks?:boolean, includeShiftPlans?:boolean, includeDependencies?:boolean, includeAllocations?:boolean, includePlannedCosts?:boolean, includeTodoLinks?:boolean, includeTodos?:boolean): pf.Reference;
}
namespace pm {
    export function uploadProjectScenario(projectId:string, format?:string, obj:unknown): pf.Reference;
}
namespace pm {
    export function getProjectSubObjTypes(): pf.Item[];
}
namespace pm {
    export function getProjectSubObjs(projectId:string): pf.SubObject[];
}
namespace pm {
    export function getProjectSubObj(projectId:string, subObjectType:string, version?:Date): pf.SubObject;
}
namespace pm {
    export function putProjectSubObj(projectId:string, subObjectType:string, obj:pf.SubObject);
}
namespace pm {
    export function getProjectSubObjTimeline(projectId:string, subObjectType:string, beg?:Date, end?:Date, granularity?:string): pf.Timeline;
}
namespace pm {
    export function getWorkItemSubWorkItems(workItemId:string, version?:Date): pm.ProjectWorkItem[];
}
namespace pm {
    export function addWorkItemSubWorkItem(workItemId:string, obj:ProjectWorkItem): pf.Reference;
}
namespace pm {
    export function getWorkItem(workItemId:string, version?:Date): pm.ProjectWorkItem;
}
namespace pm {
    export function putWorkItem(workItemId:string, updateDependencies?:boolean, obj:ProjectWorkItem);
}
namespace pm {
    export function delWorkItem(workItemId:string);
}
namespace pm {
    export function getWorkItemLogs(workItemId:string): pf.Log[];
}
namespace pm {
    export function getWorkItemLog(workItemId:string, logId:string): pf.Log;
}
namespace pm {
    export function getWorkItemLogParent(logId:string): pf.Reference;
}
namespace pm {
    export function putWorkItemLog(workItemId:string, logId:string, obj:pf.Log);
}
namespace pm {
    export function delWorkItemLog(workItemId:string, logId:string);
}
namespace pm {
    export function addWorkItemMacroAllocation(workItemId:string, argid?:string, amount?:number, amountUnit?:string, amountType?:string): pf.Reference;
}
namespace pm {
    export function delWorkItemMacroAllocation(workItemId:string, refid?:string);
}
namespace pm {
    export function getWorkItemMacroAllocations(workItemId:string, version?:Date): alc.ResourceAllocation[];
}
namespace pm {
    export function getWorkItemProject(workItemId:string): pm.Project;
}
namespace pm {
    export function splitWorkItem(workItemId:string, at?:Date);
}
namespace pm {
    export function getWorkItemShiftPlan(workItemId:string): pm.ShiftPlan;
}
namespace pm {
    export function putWorkItemShiftPlan(workItemId:string, obj:ShiftPlan);
}
namespace pm {
    export function delWorkItemShiftPlan(workItemId:string);
}
namespace pm {
    export function assignWorkItemShiftPlan(workItemId:string, res?:string, force?:boolean);
}
namespace pm {
    export function delMicroAllocations(workItemId:string, res?:string);
}
namespace pm {
    export function getIndicatorDetailDefs(projectReportTypeId:string): pm.IndicatorDetailDef[];
}
namespace pm {
    export function getIndicatorDetailDef(projectReportTypeId:string, detailId:string): pm.IndicatorDetailDef;
}
namespace pm {
    export function getIndicatorIntlDetailDef(projectReportTypeId:string, detailId:string): pm.IndicatorDetailDefTranslated;
}
namespace pm {
    export function putIndicatorIntlDetailDef(projectReportTypeId:string, detailId:string, obj:IndicatorDetailDefTranslated);
}
namespace pm {
    export function delIndicatorIntlDetailDef(projectReportTypeId:string, detailId:string);
}
namespace pm {
    export function getIndicatorDimensionDefs(projectReportTypeId:string): pm.IndicatorDimensionDef[];
}
namespace pm {
    export function getIndicatorDimensionDef(projectReportTypeId:string, dimensionId:string): pm.IndicatorDimensionDef;
}
namespace pm {
    export function getIndicatorIntlDimensionDef(projectReportTypeId:string, dimensionId:string): pm.IndicatorDimensionDefTranslated;
}
namespace pm {
    export function putIndicatorIntlDimensionDef(projectReportTypeId:string, dimensionId:string, obj:IndicatorDimensionDefTranslated);
}
namespace pm {
    export function delIndicatorIntlDimensionDef(projectReportTypeId:string, dimensionId:string);
}
namespace pm {
    export function getIndicatorClassifications(): pm.IndicatorClassificationScheme[];
}
namespace pm {
    export function getIndicatorClassification(classificationId:string): pm.IndicatorClassificationScheme;
}
namespace pm {
    export function getIndicatorClassificationValue(classificationId:string): pm.IndicatorClassificationSchemeValue;
}
namespace pm {
    export function getIndicatorIntlClassification(classificationId:string): pm.IndicatorClassificationSchemeTranslated;
}
namespace pm {
    export function putIndicatorIntlClassification(classificationId:string, obj:IndicatorClassificationSchemeTranslated);
}
namespace pm {
    export function delIndicatorIntlClassification(classificationId:string);
}
namespace pm {
    export function getIndicatorSelections(projectId:string, projectReportTypeId:string): pm.IndicatorSelections;
}
namespace pm {
    export function putIndicatorSelections(projectId:string, projectReportTypeId:string, obj:IndicatorSelections);
}
namespace pm {
    export function getIndicatorSelectionDetail(projectId:string, projectReportTypeId:string, detid:string): pm.IndicatorDetailSelection;
}
namespace pm {
    export function getIndicatorSelectionDetailTimeline(projectId:string, projectReportTypeId:string, detid:string, beg?:Date, end?:Date, granularity?:string): pf.Timeline;
}
namespace pm {
    export function getIndicatorSelectionDetailHistory(projectId:string, projectReportTypeId:string, detid:string, beg?:Date, end?:Date, granularity?:string): pm.IndicatorDetailSelectionHistory;
}
namespace res {
    export function addResourceChild(parentResourceId:string, linkType?:string): pf.Reference;
}
namespace res {
    export function getResource(resourceId:string, version?:Date): res.Resource;
}
namespace res {
    export function putResource(resourceId:string, obj:Resource);
}
namespace res {
    export function delResource(resourceId:string, recursive?:boolean);
}
namespace res {
    export function undelResource(resourceId:string);
}
namespace res {
    export function getRecentlyDeletedResources(): pf.ItemWithDeletedFlagModifiedAtAndParent[];
}
namespace res {
    export function getResourceIdentification(resourceId:string): res.ItemWithAncestors;
}
namespace res {
    export function getResourceChildren(resourceId:string): res.Resource[];
}
namespace res {
    export function getResourceChildrenIdentification(resourceId:string): res.ItemWithAncestors[];
}
namespace res {
    export function getResourceAncestors(resourceId:string, deleted?:boolean): res.Resource[];
}
namespace res {
    export function getResourceTimeline(resourceId:string, beg?:Date, end?:Date, granularity?:string): pf.Timeline;
}
namespace res {
    export function getAvailabilities(resourceId:string): res.Availability[];
}
namespace res {
    export function getAvailabilitiesByResource(resourceIds:string[]): res.AvailabilitiesByResource[];
}
namespace res {
    export function getAvailability(resourceId:string, availabilityId:string): res.Availability;
}
namespace res {
    export function putAvailability(resourceId:string, availabilityId:string, obj:Availability);
}
namespace res {
    export function delAvailability(resourceId:string, availabilityId:string);
}
namespace res {
    export function getResources(): res.Resource[];
}
namespace res {
    export function getResourceHierarchy(): res.ItemWithAncestors[];
}
namespace res {
    export function addResourceLink(fromId:string, linkType?:string, toId?:string): pf.Reference;
}
namespace res {
    export function getResourceLink(linkType:string, linkId:string): pf.VersionedDetails;
}
namespace res {
    export function putResourceLink(linkType:string, linkId:string, obj:pf.VersionedDetails);
}
namespace res {
    export function delResourceLink(linkType:string, linkId:string);
}
namespace res {
    export function getResourceLinkTypes(): res.ResourceLinkType[];
}
namespace res {
    export function getResourceLinkType(linkTypeId:string): res.ResourceLinkType;
}
namespace res {
    export function getResourceTypes(): res.ResourceType[];
}
namespace res {
    export function getResourceType(typeId:string): res.ResourceType;
}
namespace res {
    export function getResourcesByType(typeId:string): res.Resource[];
}
namespace res {
    export function getResourcesByTypes(typeIds:string): res.Resource[];
}
namespace res {
    export function getResourceHierarchyByType(typeId:string): res.ItemWithAncestors[];
}
namespace res {
    export function getResourceGroups(): res.ResourceGroup[];
}
namespace res {
    export function getResourceGroup(groupId:string): res.ResourceGroup;
}
namespace res {
    export function getResourcesByGroup(groupId:string): pf.Item[];
}
namespace res {
    export function getResourceGroupWorktimeUnits(groupId:string): pf.Unit[];
}
namespace res {
    export function getResourceGroupWorktimeUnitFactors(groupId:string): pf.UnitFactor[];
}
namespace res {
    export function getResourceKinds(): pf.NamedReference[];
}
namespace res {
    export function getResourceKind(kindId:string): pf.NamedReference;
}
namespace res {
    export function getResourcesByKind(kindId:string): pf.Item[];
}
namespace res {
    export function getResourcesByKinds(kindIds:string): pf.Item[];
}
namespace res {
    export function getHolidayLocales(): pf.VersionedItem[];
}
namespace res {
    export function addHolidayLocale(copyFromId?:string): pf.Reference;
}
namespace res {
    export function getHolidayLocale(locid:string): pf.VersionedItem;
}
namespace res {
    export function putHolidayLocale(locid:string, obj:pf.VersionedItem);
}
namespace res {
    export function delHolidayLocale(locid:string);
}
namespace res {
    export function getHolidayLocaleObj(locid:string): pf.VersionedItem;
}
namespace res {
    export function putHolidayLocaleObj(locid:string, obj:pf.VersionedItem);
}
namespace res {
    export function getHolidayLocaleDetails(locid:string): pf.Details;
}
namespace res {
    export function putHolidayLocaleDetails(locid:string, obj:pf.Details);
}
namespace res {
    export function getHolidays(locid:string, beg?:string, end?:string): res.Holiday[];
}
namespace res {
    export function getHoliday(locid:string, holid:string): res.Holiday;
}
namespace res {
    export function putHoliday(locid:string, holid:string, obj:Holiday);
}
namespace res {
    export function delHoliday(locid:string, holid:string);
}
namespace res {
    export function getHolidaysBulk(locid:string, holids:string[]): res.Holiday[];
}
namespace res {
    export function putHolidaysBulk(locid:string, holids:string[], obj:Holiday[]);
}
namespace res {
    export function delHolidaysBulk(locid:string, holids:string[]);
}
namespace res {
    export function importHolidays(locid:string, format?:string, filter?:string[], obj:unknown);
}
namespace res {
    export function previewHolidays(format?:string, obj:unknown): res.Holiday[];
}
namespace res {
    export function getResourceGroupStandardWorktimes(): res.ResourceGroupStandardWorktime[];
}
namespace res {
    export function putResourceGroupStandardWorktime(resgrpid:string, obj:ResourceGroupStandardWorktime);
}
namespace res {
    export function getResourceShifts(): res.ResourceShift[];
}
namespace res {
    export function getResourceShift(shiftid:string): res.ResourceShift;
}
namespace res {
    export function getWeekDaysToWorkDaysMapping(resourceId:string, beg?:string, end?:string): res.WorkdayMapping;
}
namespace res {
    export function getWorkDaysToWeekDaysMapping(resourceId:string, beg?:string, end?:string): res.WorkdayMapping;
}
namespace rsk {
    export function getProjectPortfolioRisks(ppfid:string, version?:Date, currency?:string): rsk.ProjectRisk[];
}
namespace rsk {
    export function getProjectPortfolioRisksWithHistory(ppfid:string, history:string, version?:Date, simplify?:string, currency?:string): rsk.ProjectRiskWithHistory[];
}
namespace rsk {
    export function getProjectRisks(prjid:string, version?:Date, currency?:string): rsk.ProjectRisk[];
}
namespace rsk {
    export function getProjectRisksWithHistory(prjid:string, history:string, version?:Date, simplify?:string, currency?:string): rsk.ProjectRiskWithHistory[];
}
namespace rsk {
    export function addProjectRisk(prjid:string): pf.Reference;
}
namespace rsk {
    export function getProjectRisk(prjid:string, riskId:string, version?:Date, currency?:string): rsk.ProjectRisk;
}
namespace rsk {
    export function getProjectRiskWithHistory(prjid:string, riskId:string, history:string, version?:Date, simplify?:string, currency?:string): rsk.ProjectRiskWithHistory;
}
namespace rsk {
    export function putProjectRisk(prjid:string, riskId:string, obj:ProjectRisk);
}
namespace rsk {
    export function delProjectRisk(prjid:string, riskId:string);
}
namespace rsk {
    export function getAllProjectRisks(currency?:string): rsk.ProjectRisk[];
}
namespace rsk {
    export function getProjectRiskById(riskId:string, currency?:string): rsk.ProjectRisk;
}
namespace rsk {
    export function getRiskMatrixDefinition(): rsk.RiskMatrixDefinition;
}
namespace rsk {
    export function getRiskMatrixDefinitionTranslated(): rsk.RiskMatrixDefinitionTranslated;
}
namespace rsk {
    export function putRiskMatrixDefinitionTranslated(obj:RiskMatrixDefinitionTranslated);
}
namespace rsk {
    export function calculateRisk(obj:RiskRating): rsk.RiskRating;
}
namespace stg {
    export function addStrategy(copy?:string, copyrels?:boolean): pf.Reference;
}
namespace stg {
    export function getStrategies(): stg.Strategy[];
}
namespace stg {
    export function getStrategy(strategyId:string): stg.Strategy;
}
namespace stg {
    export function putStrategy(strategyId:string, obj:Strategy);
}
namespace stg {
    export function delStrategy(strategyId:string);
}
namespace stg {
    export function getStrategyHistory(strategyId:string, until?:Date): stg.Strategy[];
}
namespace stg {
    export function getVisions(strategyId:string): stg.Vision[];
}
namespace stg {
    export function getAllVisions(): stg.Vision[];
}
namespace stg {
    export function addVision(strategyId:string, copy?:string, copyrels?:boolean, sortindex?:number): pf.Reference;
}
namespace stg {
    export function getVision(visionId:string): stg.Vision;
}
namespace stg {
    export function getVisionHistory(visionId:string, until?:Date): stg.Vision[];
}
namespace stg {
    export function putVision(visionId:string, obj:Vision);
}
namespace stg {
    export function delVision(visionId:string);
}
namespace stg {
    export function getAllFieldsOfAction(): stg.FieldOfAction[];
}
namespace stg {
    export function getFieldsOfAction(visionId:string): stg.FieldOfAction[];
}
namespace stg {
    export function addFieldOfAction(visionId:string, copy?:string, copyrels?:boolean, sortindex?:number): pf.Reference;
}
namespace stg {
    export function getFieldOfAction(foaId:string): stg.FieldOfAction;
}
namespace stg {
    export function getFieldOfActionHistory(foaId:string, until?:Date): stg.FieldOfAction[];
}
namespace stg {
    export function putFieldOfAction(foaId:string, obj:FieldOfAction);
}
namespace stg {
    export function delFieldOfAction(foaId:string);
}
namespace stg {
    export function getAllObjectives(): stg.Objective[];
}
namespace stg {
    export function getObjectives(foaId:string): stg.Objective[];
}
namespace stg {
    export function addObjective(foaId:string, copy?:string, copyrels?:boolean, sortindex?:number): pf.Reference;
}
namespace stg {
    export function getObjective(objectiveId:string): stg.Objective;
}
namespace stg {
    export function getObjectiveHistory(objectiveId:string, until?:Date): stg.Objective[];
}
namespace stg {
    export function putObjective(objectiveId:string, obj:Objective);
}
namespace stg {
    export function delObjective(objectiveId:string);
}
namespace stg {
    export function getAllObjectiveIndicators(): stg.ObjectiveIndicator[];
}
namespace stg {
    export function getObjectiveIndicators(objectiveId:string): stg.ObjectiveIndicator[];
}
namespace stg {
    export function addObjectiveIndicator(objectiveId:string, sortindex?:number): pf.Reference;
}
namespace stg {
    export function getObjectiveIndicator(indicatorId:string): stg.ObjectiveIndicator;
}
namespace stg {
    export function getObjectiveIndicatorHistory(indicatorId:string): stg.ObjectiveIndicator[];
}
namespace stg {
    export function putObjectiveIndicator(indicatorId:string, obj:ObjectiveIndicator);
}
namespace stg {
    export function delObjectiveIndicator(indicatorId:string);
}
namespace stg {
    export function getAllProjectContributions(): stg.ProjectContribution[];
}
namespace stg {
    export function getProjectContributions(objectiveId:string): stg.ProjectContribution[];
}
namespace stg {
    export function getContributionsByProject(projectId:string): stg.ProjectContribution[];
}
namespace stg {
    export function addProjectContribution(objectiveId:string, projectId?:string, sortindex?:number): pf.Reference;
}
namespace stg {
    export function getProjectContribution(contributionId:string): stg.ProjectContribution;
}
namespace stg {
    export function getProjectContributionHistory(contributionId:string, until?:Date): stg.ProjectContribution[];
}
namespace stg {
    export function putProjectContribution(contributionId:string, obj:ProjectContribution);
}
namespace stg {
    export function delProjectContribution(contributionId:string);
}
namespace tdp {
    export function getForeignKeyAssignments(type:string, id:string): tdp.ThirdPartyReferenceAssignment[];
}
namespace tdp {
    export function putForeignKeyAssignments(type:string, id:string, obj:ThirdPartyReferenceAssignment[]);
}
namespace tdp {
    export function getForeignKeyReference(type:string, foreignkey:string): tdp.ThirdPartyReferenceWithOwnData;
}
namespace tdp {
    export function putForeignKeyReference(type:string, foreignkey:string, obj:ThirdPartyReferenceWithOwnData);
}
namespace tdp {
    export function delForeignKeyReference(type:string, foreignkey:string);
}
namespace tdp {
    export function getReference(type:string, internalId:string): tdp.ThirdPartyReferenceWithOwnData;
}
namespace tdp {
    export function getReferences(type:string, assigned?:boolean, unassigned?:boolean): tdp.ThirdPartyReferenceWithOwnData[];
}
namespace tdp {
    export function getReferenceTypes(): tdp.ThirdPartyReferenceType[];
}
namespace tdp {
    export function getForeignItem(type:string, foreignKey:string): pf.Item;
}
namespace tdp {
    export function getForeignItems(type:string): pf.Item[];
}
}
