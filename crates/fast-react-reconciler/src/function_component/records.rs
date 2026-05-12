use fast_react_core::{
    FiberId, HookEffectCallbackHandle, HookEffectDependencies, HookEffectFlags, HookEffectId,
    HookEffectInstanceId, HookListId, HookQueueId, HookSlotId, HookUpdateId, Lanes, StateHandle,
};

use super::{
    FunctionComponentCallbackHandle, FunctionComponentEffectDependencyStatus,
    FunctionComponentEffectPhase, FunctionComponentEffectRegistration,
    FunctionComponentEffectUpdateQueueRecord, FunctionComponentHookRenderPhase,
    FunctionComponentReducerHandle, FunctionComponentReducerHookRecord,
    FunctionComponentRefObjectHandle, FunctionComponentStateDispatchHandle,
    FunctionComponentStateHookRecord,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentStateUpdateRenderLanes {
    pub(super) render_lanes: Lanes,
    pub(super) root_render_lanes: Lanes,
}

impl FunctionComponentStateUpdateRenderLanes {
    #[must_use]
    pub const fn new(render_lanes: Lanes, root_render_lanes: Lanes) -> Self {
        Self {
            render_lanes,
            root_render_lanes,
        }
    }

    #[must_use]
    pub const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub const fn root_render_lanes(self) -> Lanes {
        self.root_render_lanes
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum FunctionComponentMemoDependencyStatus {
    Changed,
    Unchanged,
}

impl FunctionComponentMemoDependencyStatus {
    #[must_use]
    pub const fn reused_previous_value(self) -> bool {
        matches!(self, Self::Unchanged)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentMemoHookRecord {
    pub(super) hook: HookSlotId,
    pub(super) value: StateHandle,
    pub(super) dependencies: HookEffectDependencies,
}

impl FunctionComponentMemoHookRecord {
    #[must_use]
    pub const fn hook(self) -> HookSlotId {
        self.hook
    }

    #[must_use]
    pub const fn value(self) -> StateHandle {
        self.value
    }

    #[must_use]
    pub const fn dependencies(self) -> HookEffectDependencies {
        self.dependencies
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentMemoUpdateRecord {
    pub(super) hook: HookSlotId,
    pub(super) previous_hook: HookSlotId,
    pub(super) previous_value: StateHandle,
    pub(super) previous_dependencies: HookEffectDependencies,
    pub(super) requested_value: StateHandle,
    pub(super) value: StateHandle,
    pub(super) dependencies: HookEffectDependencies,
    pub(super) dependency_status: FunctionComponentMemoDependencyStatus,
}

impl FunctionComponentMemoUpdateRecord {
    #[must_use]
    pub const fn hook(self) -> HookSlotId {
        self.hook
    }

    #[must_use]
    pub const fn previous_hook(self) -> HookSlotId {
        self.previous_hook
    }

    #[must_use]
    pub const fn previous_value(self) -> StateHandle {
        self.previous_value
    }

    #[must_use]
    pub const fn previous_dependencies(self) -> HookEffectDependencies {
        self.previous_dependencies
    }

    #[must_use]
    pub const fn requested_value(self) -> StateHandle {
        self.requested_value
    }

    #[must_use]
    pub const fn value(self) -> StateHandle {
        self.value
    }

    #[must_use]
    pub const fn dependencies(self) -> HookEffectDependencies {
        self.dependencies
    }

    #[must_use]
    pub const fn dependency_status(self) -> FunctionComponentMemoDependencyStatus {
        self.dependency_status
    }

    #[must_use]
    pub const fn reused_previous_value(self) -> bool {
        self.dependency_status.reused_previous_value()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentMemoUpdateDiagnosticRecord {
    pub(super) diagnostic_index: usize,
    pub(super) fiber: FiberId,
    pub(super) current: FiberId,
    pub(super) current_hook_list: HookListId,
    pub(super) hook_list: HookListId,
    pub(super) previous_hook: HookSlotId,
    pub(super) hook: HookSlotId,
    pub(super) render_lanes: Lanes,
    pub(super) previous_value: StateHandle,
    pub(super) previous_dependencies: HookEffectDependencies,
    pub(super) requested_value: StateHandle,
    pub(super) value: StateHandle,
    pub(super) dependencies: HookEffectDependencies,
    pub(super) dependency_status: FunctionComponentMemoDependencyStatus,
}

impl FunctionComponentMemoUpdateDiagnosticRecord {
    #[must_use]
    pub const fn diagnostic_index(self) -> usize {
        self.diagnostic_index
    }

    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn current(self) -> FiberId {
        self.current
    }

    #[must_use]
    pub const fn current_hook_list(self) -> HookListId {
        self.current_hook_list
    }

    #[must_use]
    pub const fn hook_list(self) -> HookListId {
        self.hook_list
    }

    #[must_use]
    pub const fn previous_hook(self) -> HookSlotId {
        self.previous_hook
    }

    #[must_use]
    pub const fn hook(self) -> HookSlotId {
        self.hook
    }

    #[must_use]
    pub const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub const fn previous_value(self) -> StateHandle {
        self.previous_value
    }

    #[must_use]
    pub const fn previous_dependencies(self) -> HookEffectDependencies {
        self.previous_dependencies
    }

    #[must_use]
    pub const fn requested_value(self) -> StateHandle {
        self.requested_value
    }

    #[must_use]
    pub const fn value(self) -> StateHandle {
        self.value
    }

    #[must_use]
    pub const fn dependencies(self) -> HookEffectDependencies {
        self.dependencies
    }

    #[must_use]
    pub const fn dependency_status(self) -> FunctionComponentMemoDependencyStatus {
        self.dependency_status
    }

    #[must_use]
    pub const fn reused_previous_value(self) -> bool {
        self.dependency_status.reused_previous_value()
    }

    #[must_use]
    pub const fn recomputed_value(self) -> bool {
        matches!(
            self.dependency_status,
            FunctionComponentMemoDependencyStatus::Changed
        )
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentCallbackHookRecord {
    pub(super) hook: HookSlotId,
    pub(super) callback: FunctionComponentCallbackHandle,
    pub(super) dependencies: HookEffectDependencies,
}

impl FunctionComponentCallbackHookRecord {
    #[must_use]
    pub const fn hook(self) -> HookSlotId {
        self.hook
    }

    #[must_use]
    pub const fn callback(self) -> FunctionComponentCallbackHandle {
        self.callback
    }

    #[must_use]
    pub const fn dependencies(self) -> HookEffectDependencies {
        self.dependencies
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentCallbackUpdateRecord {
    pub(super) hook: HookSlotId,
    pub(super) previous_hook: HookSlotId,
    pub(super) previous_callback: FunctionComponentCallbackHandle,
    pub(super) previous_dependencies: HookEffectDependencies,
    pub(super) requested_callback: FunctionComponentCallbackHandle,
    pub(super) callback: FunctionComponentCallbackHandle,
    pub(super) dependencies: HookEffectDependencies,
    pub(super) dependency_status: FunctionComponentMemoDependencyStatus,
}

impl FunctionComponentCallbackUpdateRecord {
    #[must_use]
    pub const fn hook(self) -> HookSlotId {
        self.hook
    }

    #[must_use]
    pub const fn previous_hook(self) -> HookSlotId {
        self.previous_hook
    }

    #[must_use]
    pub const fn previous_callback(self) -> FunctionComponentCallbackHandle {
        self.previous_callback
    }

    #[must_use]
    pub const fn previous_dependencies(self) -> HookEffectDependencies {
        self.previous_dependencies
    }

    #[must_use]
    pub const fn requested_callback(self) -> FunctionComponentCallbackHandle {
        self.requested_callback
    }

    #[must_use]
    pub const fn callback(self) -> FunctionComponentCallbackHandle {
        self.callback
    }

    #[must_use]
    pub const fn dependencies(self) -> HookEffectDependencies {
        self.dependencies
    }

    #[must_use]
    pub const fn dependency_status(self) -> FunctionComponentMemoDependencyStatus {
        self.dependency_status
    }

    #[must_use]
    pub const fn reused_previous_callback(self) -> bool {
        self.dependency_status.reused_previous_value()
    }

    #[must_use]
    pub const fn replaced_callback(self) -> bool {
        matches!(
            self.dependency_status,
            FunctionComponentMemoDependencyStatus::Changed
        )
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentCallbackUpdateDiagnosticRecord {
    pub(super) diagnostic_index: usize,
    pub(super) fiber: FiberId,
    pub(super) current: FiberId,
    pub(super) current_hook_list: HookListId,
    pub(super) hook_list: HookListId,
    pub(super) previous_hook: HookSlotId,
    pub(super) hook: HookSlotId,
    pub(super) render_lanes: Lanes,
    pub(super) previous_callback: FunctionComponentCallbackHandle,
    pub(super) previous_dependencies: HookEffectDependencies,
    pub(super) requested_callback: FunctionComponentCallbackHandle,
    pub(super) callback: FunctionComponentCallbackHandle,
    pub(super) dependencies: HookEffectDependencies,
    pub(super) dependency_status: FunctionComponentMemoDependencyStatus,
}

impl FunctionComponentCallbackUpdateDiagnosticRecord {
    #[must_use]
    pub const fn diagnostic_index(self) -> usize {
        self.diagnostic_index
    }

    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn current(self) -> FiberId {
        self.current
    }

    #[must_use]
    pub const fn current_hook_list(self) -> HookListId {
        self.current_hook_list
    }

    #[must_use]
    pub const fn hook_list(self) -> HookListId {
        self.hook_list
    }

    #[must_use]
    pub const fn previous_hook(self) -> HookSlotId {
        self.previous_hook
    }

    #[must_use]
    pub const fn hook(self) -> HookSlotId {
        self.hook
    }

    #[must_use]
    pub const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub const fn previous_callback(self) -> FunctionComponentCallbackHandle {
        self.previous_callback
    }

    #[must_use]
    pub const fn previous_dependencies(self) -> HookEffectDependencies {
        self.previous_dependencies
    }

    #[must_use]
    pub const fn requested_callback(self) -> FunctionComponentCallbackHandle {
        self.requested_callback
    }

    #[must_use]
    pub const fn callback(self) -> FunctionComponentCallbackHandle {
        self.callback
    }

    #[must_use]
    pub const fn dependencies(self) -> HookEffectDependencies {
        self.dependencies
    }

    #[must_use]
    pub const fn dependency_status(self) -> FunctionComponentMemoDependencyStatus {
        self.dependency_status
    }

    #[must_use]
    pub const fn reused_previous_callback(self) -> bool {
        self.dependency_status.reused_previous_value()
    }

    #[must_use]
    pub const fn replaced_callback(self) -> bool {
        matches!(
            self.dependency_status,
            FunctionComponentMemoDependencyStatus::Changed
        )
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentRefHookRecord {
    pub(super) hook: HookSlotId,
    pub(super) ref_object: FunctionComponentRefObjectHandle,
    pub(super) initial_value: StateHandle,
}

impl FunctionComponentRefHookRecord {
    #[must_use]
    pub const fn hook(self) -> HookSlotId {
        self.hook
    }

    #[must_use]
    pub const fn ref_object(self) -> FunctionComponentRefObjectHandle {
        self.ref_object
    }

    #[must_use]
    pub const fn initial_value(self) -> StateHandle {
        self.initial_value
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentRefUpdateRecord {
    pub(super) hook: HookSlotId,
    pub(super) ref_object: FunctionComponentRefObjectHandle,
    pub(super) initial_value: StateHandle,
    pub(super) ignored_initial_value: StateHandle,
}

impl FunctionComponentRefUpdateRecord {
    #[must_use]
    pub const fn hook(self) -> HookSlotId {
        self.hook
    }

    #[must_use]
    pub const fn ref_object(self) -> FunctionComponentRefObjectHandle {
        self.ref_object
    }

    #[must_use]
    pub const fn initial_value(self) -> StateHandle {
        self.initial_value
    }

    #[must_use]
    pub const fn ignored_initial_value(self) -> StateHandle {
        self.ignored_initial_value
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentStateUpdateRenderRecord {
    pub(super) fiber: FiberId,
    pub(super) hook: HookSlotId,
    pub(super) queue: HookQueueId,
    pub(super) dispatch: FunctionComponentStateDispatchHandle,
    pub(super) lanes: FunctionComponentStateUpdateRenderLanes,
    pub(super) previous_memoized_state: StateHandle,
    pub(super) previous_base_state: StateHandle,
    pub(super) previous_base_queue: Option<HookUpdateId>,
    pub(super) memoized_state: StateHandle,
    pub(super) base_state: StateHandle,
    pub(super) base_queue: Option<HookUpdateId>,
    pub(super) remaining_lanes: Lanes,
    pub(super) applied_update_count: usize,
    pub(super) skipped_update_count: usize,
    pub(super) reverted_update_count: usize,
    pub(super) eager_update_count: usize,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentUseStateRenderRequest {
    pub(super) initial_state: StateHandle,
    pub(super) lanes: FunctionComponentStateUpdateRenderLanes,
}

impl FunctionComponentUseStateRenderRequest {
    #[must_use]
    pub const fn new(
        initial_state: StateHandle,
        lanes: FunctionComponentStateUpdateRenderLanes,
    ) -> Self {
        Self {
            initial_state,
            lanes,
        }
    }

    #[must_use]
    pub const fn initial_state(self) -> StateHandle {
        self.initial_state
    }

    #[must_use]
    pub const fn lanes(self) -> FunctionComponentStateUpdateRenderLanes {
        self.lanes
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentUseReducerRenderRequest {
    pub(super) reducer: FunctionComponentReducerHandle,
    pub(super) initial_state: StateHandle,
    pub(super) lanes: FunctionComponentStateUpdateRenderLanes,
}

impl FunctionComponentUseReducerRenderRequest {
    #[must_use]
    pub const fn new(
        reducer: FunctionComponentReducerHandle,
        initial_state: StateHandle,
        lanes: FunctionComponentStateUpdateRenderLanes,
    ) -> Self {
        Self {
            reducer,
            initial_state,
            lanes,
        }
    }

    #[must_use]
    pub const fn reducer(self) -> FunctionComponentReducerHandle {
        self.reducer
    }

    #[must_use]
    pub const fn initial_state(self) -> StateHandle {
        self.initial_state
    }

    #[must_use]
    pub const fn lanes(self) -> FunctionComponentStateUpdateRenderLanes {
        self.lanes
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentUseMemoRenderRequest {
    pub(super) value: StateHandle,
    pub(super) dependencies: HookEffectDependencies,
}

impl FunctionComponentUseMemoRenderRequest {
    #[must_use]
    pub const fn new(value: StateHandle, dependencies: HookEffectDependencies) -> Self {
        Self {
            value,
            dependencies,
        }
    }

    #[must_use]
    pub const fn value(self) -> StateHandle {
        self.value
    }

    #[must_use]
    pub const fn dependencies(self) -> HookEffectDependencies {
        self.dependencies
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentUseCallbackRenderRequest {
    pub(super) callback: FunctionComponentCallbackHandle,
    pub(super) dependencies: HookEffectDependencies,
}

impl FunctionComponentUseCallbackRenderRequest {
    #[must_use]
    pub const fn new(
        callback: FunctionComponentCallbackHandle,
        dependencies: HookEffectDependencies,
    ) -> Self {
        Self {
            callback,
            dependencies,
        }
    }

    #[must_use]
    pub const fn callback(self) -> FunctionComponentCallbackHandle {
        self.callback
    }

    #[must_use]
    pub const fn dependencies(self) -> HookEffectDependencies {
        self.dependencies
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentUseEffectRenderRequest {
    pub(super) create: HookEffectCallbackHandle,
    pub(super) dependencies: HookEffectDependencies,
}

impl FunctionComponentUseEffectRenderRequest {
    #[must_use]
    pub const fn new(
        create: HookEffectCallbackHandle,
        dependencies: HookEffectDependencies,
    ) -> Self {
        Self {
            create,
            dependencies,
        }
    }

    #[must_use]
    pub const fn create(self) -> HookEffectCallbackHandle {
        self.create
    }

    #[must_use]
    pub const fn dependencies(self) -> HookEffectDependencies {
        self.dependencies
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentUseRefRenderRequest {
    pub(super) initial_value: StateHandle,
}

impl FunctionComponentUseRefRenderRequest {
    #[must_use]
    pub const fn new(initial_value: StateHandle) -> Self {
        Self { initial_value }
    }

    #[must_use]
    pub const fn initial_value(self) -> StateHandle {
        self.initial_value
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct FunctionComponentReducerUpdateRenderRecord {
    pub(super) fiber: FiberId,
    pub(super) hook: HookSlotId,
    pub(super) queue: HookQueueId,
    pub(super) dispatch: FunctionComponentStateDispatchHandle,
    pub(super) reducer: FunctionComponentReducerHandle,
    pub(super) lanes: FunctionComponentStateUpdateRenderLanes,
    pub(super) previous_memoized_state: StateHandle,
    pub(super) previous_base_state: StateHandle,
    pub(super) previous_base_queue: Option<HookUpdateId>,
    pub(super) memoized_state: StateHandle,
    pub(super) base_state: StateHandle,
    pub(super) base_queue: Option<HookUpdateId>,
    pub(super) remaining_lanes: Lanes,
    pub(super) applied_update_count: usize,
    pub(super) skipped_update_count: usize,
    pub(super) reverted_update_count: usize,
    pub(super) eager_update_count: usize,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum FunctionComponentUseStateHookRenderRecord {
    Mount(FunctionComponentStateHookRecord),
    Update(FunctionComponentStateUpdateRenderRecord),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum FunctionComponentUseReducerHookRenderRecord {
    Mount(FunctionComponentReducerHookRecord),
    Update(FunctionComponentReducerUpdateRenderRecord),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum FunctionComponentUseMemoHookRenderRecord {
    Mount(FunctionComponentMemoHookRecord),
    Update(FunctionComponentMemoUpdateRecord),
}

impl FunctionComponentUseMemoHookRenderRecord {
    #[must_use]
    pub const fn phase(self) -> FunctionComponentHookRenderPhase {
        match self {
            Self::Mount(_) => FunctionComponentHookRenderPhase::Mount,
            Self::Update(_) => FunctionComponentHookRenderPhase::Update,
        }
    }

    #[must_use]
    pub const fn hook(self) -> HookSlotId {
        match self {
            Self::Mount(record) => record.hook(),
            Self::Update(record) => record.hook(),
        }
    }

    #[must_use]
    pub const fn value(self) -> StateHandle {
        match self {
            Self::Mount(record) => record.value(),
            Self::Update(record) => record.value(),
        }
    }

    #[must_use]
    pub const fn dependencies(self) -> HookEffectDependencies {
        match self {
            Self::Mount(record) => record.dependencies(),
            Self::Update(record) => record.dependencies(),
        }
    }

    #[must_use]
    pub const fn mount_record(self) -> Option<FunctionComponentMemoHookRecord> {
        match self {
            Self::Mount(record) => Some(record),
            Self::Update(_) => None,
        }
    }

    #[must_use]
    pub const fn update_record(self) -> Option<FunctionComponentMemoUpdateRecord> {
        match self {
            Self::Update(record) => Some(record),
            Self::Mount(_) => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum FunctionComponentUseCallbackHookRenderRecord {
    Mount(FunctionComponentCallbackHookRecord),
    Update(FunctionComponentCallbackUpdateRecord),
}

impl FunctionComponentUseCallbackHookRenderRecord {
    #[must_use]
    pub const fn phase(self) -> FunctionComponentHookRenderPhase {
        match self {
            Self::Mount(_) => FunctionComponentHookRenderPhase::Mount,
            Self::Update(_) => FunctionComponentHookRenderPhase::Update,
        }
    }

    #[must_use]
    pub const fn hook(self) -> HookSlotId {
        match self {
            Self::Mount(record) => record.hook(),
            Self::Update(record) => record.hook(),
        }
    }

    #[must_use]
    pub const fn callback(self) -> FunctionComponentCallbackHandle {
        match self {
            Self::Mount(record) => record.callback(),
            Self::Update(record) => record.callback(),
        }
    }

    #[must_use]
    pub const fn dependencies(self) -> HookEffectDependencies {
        match self {
            Self::Mount(record) => record.dependencies(),
            Self::Update(record) => record.dependencies(),
        }
    }

    #[must_use]
    pub const fn mount_record(self) -> Option<FunctionComponentCallbackHookRecord> {
        match self {
            Self::Mount(record) => Some(record),
            Self::Update(_) => None,
        }
    }

    #[must_use]
    pub const fn update_record(self) -> Option<FunctionComponentCallbackUpdateRecord> {
        match self {
            Self::Update(record) => Some(record),
            Self::Mount(_) => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum FunctionComponentUseEffectHookRenderRecord {
    Mount(FunctionComponentEffectRegistration),
    Update(FunctionComponentEffectUpdateQueueRecord),
}

impl FunctionComponentUseEffectHookRenderRecord {
    #[must_use]
    pub const fn render_phase(self) -> FunctionComponentHookRenderPhase {
        match self {
            Self::Mount(_) => FunctionComponentHookRenderPhase::Mount,
            Self::Update(_) => FunctionComponentHookRenderPhase::Update,
        }
    }

    #[must_use]
    pub const fn effect_phase(self) -> FunctionComponentEffectPhase {
        match self {
            Self::Mount(record) => record.phase(),
            Self::Update(record) => record.phase(),
        }
    }

    #[must_use]
    pub const fn hook(self) -> HookSlotId {
        match self {
            Self::Mount(record) => record.hook(),
            Self::Update(record) => record.hook(),
        }
    }

    #[must_use]
    pub const fn effect(self) -> HookEffectId {
        match self {
            Self::Mount(record) => record.effect(),
            Self::Update(record) => record.effect(),
        }
    }

    #[must_use]
    pub const fn instance(self) -> HookEffectInstanceId {
        match self {
            Self::Mount(record) => record.instance(),
            Self::Update(record) => record.instance(),
        }
    }

    #[must_use]
    pub const fn tag(self) -> HookEffectFlags {
        match self {
            Self::Mount(record) => record.tag(),
            Self::Update(record) => record.tag(),
        }
    }

    #[must_use]
    pub const fn create(self) -> HookEffectCallbackHandle {
        match self {
            Self::Mount(record) => record.create(),
            Self::Update(record) => record.create(),
        }
    }

    #[must_use]
    pub const fn dependencies(self) -> HookEffectDependencies {
        match self {
            Self::Mount(record) => record.dependencies(),
            Self::Update(record) => record.dependencies(),
        }
    }

    #[must_use]
    pub const fn previous_dependencies(self) -> Option<HookEffectDependencies> {
        match self {
            Self::Mount(_) => None,
            Self::Update(record) => Some(record.previous_dependencies()),
        }
    }

    #[must_use]
    pub const fn dependency_status(self) -> Option<FunctionComponentEffectDependencyStatus> {
        match self {
            Self::Mount(_) => None,
            Self::Update(record) => Some(record.dependency_status()),
        }
    }

    #[must_use]
    pub const fn accepted_for_pending_passive(self) -> bool {
        match self {
            Self::Mount(record) => {
                matches!(record.phase(), FunctionComponentEffectPhase::Passive)
                    && record.tag().fires_in_passive()
            }
            Self::Update(record) => record.accepted_for_pending_passive(),
        }
    }

    #[must_use]
    pub const fn mount_record(self) -> Option<FunctionComponentEffectRegistration> {
        match self {
            Self::Mount(record) => Some(record),
            Self::Update(_) => None,
        }
    }

    #[must_use]
    pub const fn update_record(self) -> Option<FunctionComponentEffectUpdateQueueRecord> {
        match self {
            Self::Update(record) => Some(record),
            Self::Mount(_) => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum FunctionComponentUseRefHookRenderRecord {
    Mount(FunctionComponentRefHookRecord),
    Update(FunctionComponentRefUpdateRecord),
}

impl FunctionComponentUseRefHookRenderRecord {
    #[must_use]
    pub const fn phase(self) -> FunctionComponentHookRenderPhase {
        match self {
            Self::Mount(_) => FunctionComponentHookRenderPhase::Mount,
            Self::Update(_) => FunctionComponentHookRenderPhase::Update,
        }
    }

    #[must_use]
    pub const fn hook(self) -> HookSlotId {
        match self {
            Self::Mount(record) => record.hook(),
            Self::Update(record) => record.hook(),
        }
    }

    #[must_use]
    pub const fn ref_object(self) -> FunctionComponentRefObjectHandle {
        match self {
            Self::Mount(record) => record.ref_object(),
            Self::Update(record) => record.ref_object(),
        }
    }

    #[must_use]
    pub const fn initial_value(self) -> StateHandle {
        match self {
            Self::Mount(record) => record.initial_value(),
            Self::Update(record) => record.initial_value(),
        }
    }

    #[must_use]
    pub const fn mount_record(self) -> Option<FunctionComponentRefHookRecord> {
        match self {
            Self::Mount(record) => Some(record),
            Self::Update(_) => None,
        }
    }

    #[must_use]
    pub const fn update_record(self) -> Option<FunctionComponentRefUpdateRecord> {
        match self {
            Self::Update(record) => Some(record),
            Self::Mount(_) => None,
        }
    }
}

impl FunctionComponentUseStateHookRenderRecord {
    #[must_use]
    pub const fn phase(self) -> FunctionComponentHookRenderPhase {
        match self {
            Self::Mount(_) => FunctionComponentHookRenderPhase::Mount,
            Self::Update(_) => FunctionComponentHookRenderPhase::Update,
        }
    }

    #[must_use]
    pub const fn hook(self) -> HookSlotId {
        match self {
            Self::Mount(record) => record.hook(),
            Self::Update(record) => record.hook(),
        }
    }

    #[must_use]
    pub const fn queue(self) -> HookQueueId {
        match self {
            Self::Mount(record) => record.queue(),
            Self::Update(record) => record.queue(),
        }
    }

    #[must_use]
    pub const fn dispatch(self) -> FunctionComponentStateDispatchHandle {
        match self {
            Self::Mount(record) => record.dispatch(),
            Self::Update(record) => record.dispatch(),
        }
    }

    #[must_use]
    pub const fn memoized_state(self) -> StateHandle {
        match self {
            Self::Mount(record) => record.memoized_state(),
            Self::Update(record) => record.memoized_state(),
        }
    }

    #[must_use]
    pub const fn base_state(self) -> StateHandle {
        match self {
            Self::Mount(record) => record.base_state(),
            Self::Update(record) => record.base_state(),
        }
    }

    #[must_use]
    pub const fn base_queue(self) -> Option<HookUpdateId> {
        match self {
            Self::Mount(record) => record.base_queue(),
            Self::Update(record) => record.base_queue(),
        }
    }

    #[must_use]
    pub const fn mount_record(self) -> Option<FunctionComponentStateHookRecord> {
        match self {
            Self::Mount(record) => Some(record),
            Self::Update(_) => None,
        }
    }

    #[must_use]
    pub const fn update_record(self) -> Option<FunctionComponentStateUpdateRenderRecord> {
        match self {
            Self::Update(record) => Some(record),
            Self::Mount(_) => None,
        }
    }
}

impl FunctionComponentUseReducerHookRenderRecord {
    #[must_use]
    pub const fn phase(self) -> FunctionComponentHookRenderPhase {
        match self {
            Self::Mount(_) => FunctionComponentHookRenderPhase::Mount,
            Self::Update(_) => FunctionComponentHookRenderPhase::Update,
        }
    }

    #[must_use]
    pub const fn hook(self) -> HookSlotId {
        match self {
            Self::Mount(record) => record.hook(),
            Self::Update(record) => record.hook(),
        }
    }

    #[must_use]
    pub const fn queue(self) -> HookQueueId {
        match self {
            Self::Mount(record) => record.queue(),
            Self::Update(record) => record.queue(),
        }
    }

    #[must_use]
    pub const fn dispatch(self) -> FunctionComponentStateDispatchHandle {
        match self {
            Self::Mount(record) => record.dispatch(),
            Self::Update(record) => record.dispatch(),
        }
    }

    #[must_use]
    pub const fn reducer(self) -> FunctionComponentReducerHandle {
        match self {
            Self::Mount(record) => record.reducer(),
            Self::Update(record) => record.reducer(),
        }
    }

    #[must_use]
    pub const fn memoized_state(self) -> StateHandle {
        match self {
            Self::Mount(record) => record.memoized_state(),
            Self::Update(record) => record.memoized_state(),
        }
    }

    #[must_use]
    pub const fn base_state(self) -> StateHandle {
        match self {
            Self::Mount(record) => record.base_state(),
            Self::Update(record) => record.base_state(),
        }
    }

    #[must_use]
    pub const fn base_queue(self) -> Option<HookUpdateId> {
        match self {
            Self::Mount(record) => record.base_queue(),
            Self::Update(record) => record.base_queue(),
        }
    }

    #[must_use]
    pub const fn mount_record(self) -> Option<FunctionComponentReducerHookRecord> {
        match self {
            Self::Mount(record) => Some(record),
            Self::Update(_) => None,
        }
    }

    #[must_use]
    pub const fn update_record(self) -> Option<FunctionComponentReducerUpdateRenderRecord> {
        match self {
            Self::Update(record) => Some(record),
            Self::Mount(_) => None,
        }
    }
}

impl FunctionComponentStateUpdateRenderRecord {
    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn hook(self) -> HookSlotId {
        self.hook
    }

    #[must_use]
    pub const fn queue(self) -> HookQueueId {
        self.queue
    }

    #[must_use]
    pub const fn dispatch(self) -> FunctionComponentStateDispatchHandle {
        self.dispatch
    }

    #[must_use]
    pub const fn lanes(self) -> FunctionComponentStateUpdateRenderLanes {
        self.lanes
    }

    #[must_use]
    pub const fn render_lanes(self) -> Lanes {
        self.lanes.render_lanes()
    }

    #[must_use]
    pub const fn root_render_lanes(self) -> Lanes {
        self.lanes.root_render_lanes()
    }

    #[must_use]
    pub const fn previous_memoized_state(self) -> StateHandle {
        self.previous_memoized_state
    }

    #[must_use]
    pub const fn previous_base_state(self) -> StateHandle {
        self.previous_base_state
    }

    #[must_use]
    pub const fn previous_base_queue(self) -> Option<HookUpdateId> {
        self.previous_base_queue
    }

    #[must_use]
    pub const fn memoized_state(self) -> StateHandle {
        self.memoized_state
    }

    #[must_use]
    pub const fn resulting_state(self) -> StateHandle {
        self.memoized_state
    }

    #[must_use]
    pub const fn base_state(self) -> StateHandle {
        self.base_state
    }

    #[must_use]
    pub const fn base_queue(self) -> Option<HookUpdateId> {
        self.base_queue
    }

    #[must_use]
    pub const fn remaining_lanes(self) -> Lanes {
        self.remaining_lanes
    }

    #[must_use]
    pub const fn applied_update_count(self) -> usize {
        self.applied_update_count
    }

    #[must_use]
    pub const fn skipped_update_count(self) -> usize {
        self.skipped_update_count
    }

    #[must_use]
    pub const fn reverted_update_count(self) -> usize {
        self.reverted_update_count
    }

    #[must_use]
    pub const fn eager_update_count(self) -> usize {
        self.eager_update_count
    }
}

impl FunctionComponentReducerUpdateRenderRecord {
    #[must_use]
    pub const fn fiber(self) -> FiberId {
        self.fiber
    }

    #[must_use]
    pub const fn hook(self) -> HookSlotId {
        self.hook
    }

    #[must_use]
    pub const fn queue(self) -> HookQueueId {
        self.queue
    }

    #[must_use]
    pub const fn dispatch(self) -> FunctionComponentStateDispatchHandle {
        self.dispatch
    }

    #[must_use]
    pub const fn reducer(self) -> FunctionComponentReducerHandle {
        self.reducer
    }

    #[must_use]
    pub const fn lanes(self) -> FunctionComponentStateUpdateRenderLanes {
        self.lanes
    }

    #[must_use]
    pub const fn render_lanes(self) -> Lanes {
        self.lanes.render_lanes()
    }

    #[must_use]
    pub const fn root_render_lanes(self) -> Lanes {
        self.lanes.root_render_lanes()
    }

    #[must_use]
    pub const fn previous_memoized_state(self) -> StateHandle {
        self.previous_memoized_state
    }

    #[must_use]
    pub const fn previous_base_state(self) -> StateHandle {
        self.previous_base_state
    }

    #[must_use]
    pub const fn previous_base_queue(self) -> Option<HookUpdateId> {
        self.previous_base_queue
    }

    #[must_use]
    pub const fn memoized_state(self) -> StateHandle {
        self.memoized_state
    }

    #[must_use]
    pub const fn resulting_state(self) -> StateHandle {
        self.memoized_state
    }

    #[must_use]
    pub const fn base_state(self) -> StateHandle {
        self.base_state
    }

    #[must_use]
    pub const fn base_queue(self) -> Option<HookUpdateId> {
        self.base_queue
    }

    #[must_use]
    pub const fn remaining_lanes(self) -> Lanes {
        self.remaining_lanes
    }

    #[must_use]
    pub const fn applied_update_count(self) -> usize {
        self.applied_update_count
    }

    #[must_use]
    pub const fn skipped_update_count(self) -> usize {
        self.skipped_update_count
    }

    #[must_use]
    pub const fn reverted_update_count(self) -> usize {
        self.reverted_update_count
    }

    #[must_use]
    pub const fn eager_update_count(self) -> usize {
        self.eager_update_count
    }
}
