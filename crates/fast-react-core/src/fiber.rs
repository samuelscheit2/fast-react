//! Renderer-agnostic fiber node records.

use std::ops::{BitAnd, BitAndAssign, BitOr, BitOrAssign, BitXor, BitXorAssign, Not, Sub};

use crate::{
    DeletionListId, DependenciesHandle, ElementTypeHandle, FiberFlags, FiberId, FiberTypeHandle,
    Lanes, PropsHandle, ReactKey, RefHandle, StateHandle, StateNodeHandle, UpdateQueueHandle,
};

pub const VALID_FIBER_MODE_BITS: u32 = 0b011_1011;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum FiberTag {
    FunctionComponent,
    ClassComponent,
    HostRoot,
    Portal,
    HostComponent,
    HostText,
    Fragment,
    Mode,
    ContextConsumer,
    ContextProvider,
    ForwardRef,
    Profiler,
    Suspense,
    MemoComponent,
    SimpleMemoComponent,
    LazyComponent,
    IncompleteClassComponent,
    DehydratedFragment,
    SuspenseList,
    Scope,
    Offscreen,
    LegacyHidden,
    Cache,
    TracingMarker,
    HostHoistable,
    HostSingleton,
    IncompleteFunctionComponent,
    Throw,
    ViewTransition,
    Activity,
    Reserved(u8),
}

impl FiberTag {
    #[must_use]
    pub const fn from_react_tag(tag: u8) -> Self {
        match tag {
            0 => Self::FunctionComponent,
            1 => Self::ClassComponent,
            3 => Self::HostRoot,
            4 => Self::Portal,
            5 => Self::HostComponent,
            6 => Self::HostText,
            7 => Self::Fragment,
            8 => Self::Mode,
            9 => Self::ContextConsumer,
            10 => Self::ContextProvider,
            11 => Self::ForwardRef,
            12 => Self::Profiler,
            13 => Self::Suspense,
            14 => Self::MemoComponent,
            15 => Self::SimpleMemoComponent,
            16 => Self::LazyComponent,
            17 => Self::IncompleteClassComponent,
            18 => Self::DehydratedFragment,
            19 => Self::SuspenseList,
            21 => Self::Scope,
            22 => Self::Offscreen,
            23 => Self::LegacyHidden,
            24 => Self::Cache,
            25 => Self::TracingMarker,
            26 => Self::HostHoistable,
            27 => Self::HostSingleton,
            28 => Self::IncompleteFunctionComponent,
            29 => Self::Throw,
            30 => Self::ViewTransition,
            31 => Self::Activity,
            other => Self::Reserved(other),
        }
    }

    #[must_use]
    pub const fn react_tag(self) -> u8 {
        match self {
            Self::FunctionComponent => 0,
            Self::ClassComponent => 1,
            Self::HostRoot => 3,
            Self::Portal => 4,
            Self::HostComponent => 5,
            Self::HostText => 6,
            Self::Fragment => 7,
            Self::Mode => 8,
            Self::ContextConsumer => 9,
            Self::ContextProvider => 10,
            Self::ForwardRef => 11,
            Self::Profiler => 12,
            Self::Suspense => 13,
            Self::MemoComponent => 14,
            Self::SimpleMemoComponent => 15,
            Self::LazyComponent => 16,
            Self::IncompleteClassComponent => 17,
            Self::DehydratedFragment => 18,
            Self::SuspenseList => 19,
            Self::Scope => 21,
            Self::Offscreen => 22,
            Self::LegacyHidden => 23,
            Self::Cache => 24,
            Self::TracingMarker => 25,
            Self::HostHoistable => 26,
            Self::HostSingleton => 27,
            Self::IncompleteFunctionComponent => 28,
            Self::Throw => 29,
            Self::ViewTransition => 30,
            Self::Activity => 31,
            Self::Reserved(tag) => tag,
        }
    }
}

#[repr(transparent)]
#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Hash)]
pub struct FiberMode(u32);

impl FiberMode {
    pub const NO: Self = Self(0);
    pub const CONCURRENT: Self = Self(0b000_0001);
    pub const PROFILE: Self = Self(0b000_0010);
    pub const STRICT_LEGACY: Self = Self(0b000_1000);
    pub const STRICT_EFFECTS: Self = Self(0b001_0000);
    pub const SUSPENSEY_IMAGES: Self = Self(0b010_0000);
    pub const ALL: Self = Self(VALID_FIBER_MODE_BITS);

    #[must_use]
    pub const fn from_bits(bits: u32) -> Option<Self> {
        if bits & !VALID_FIBER_MODE_BITS == 0 {
            Some(Self(bits))
        } else {
            None
        }
    }

    #[must_use]
    pub const fn from_bits_truncate(bits: u32) -> Self {
        Self(bits & VALID_FIBER_MODE_BITS)
    }

    #[must_use]
    pub const fn bits(self) -> u32 {
        self.0
    }

    #[must_use]
    pub const fn is_empty(self) -> bool {
        self.0 == 0
    }

    #[must_use]
    pub const fn is_non_empty(self) -> bool {
        self.0 != 0
    }

    #[must_use]
    pub const fn contains_any(self, other: Self) -> bool {
        self.0 & other.0 != 0
    }

    #[must_use]
    pub const fn contains_all(self, subset: Self) -> bool {
        self.0 & subset.0 == subset.0
    }

    #[must_use]
    pub const fn merge(self, other: Self) -> Self {
        Self(self.0 | other.0)
    }

    #[must_use]
    pub const fn remove(self, subset: Self) -> Self {
        Self(self.0 & !subset.0)
    }

    #[must_use]
    pub const fn intersect(self, other: Self) -> Self {
        Self(self.0 & other.0)
    }
}

impl BitOr for FiberMode {
    type Output = Self;

    fn bitor(self, rhs: Self) -> Self::Output {
        self.merge(rhs)
    }
}

impl BitOrAssign for FiberMode {
    fn bitor_assign(&mut self, rhs: Self) {
        *self = self.merge(rhs);
    }
}

impl BitAnd for FiberMode {
    type Output = Self;

    fn bitand(self, rhs: Self) -> Self::Output {
        self.intersect(rhs)
    }
}

impl BitAndAssign for FiberMode {
    fn bitand_assign(&mut self, rhs: Self) {
        *self = self.intersect(rhs);
    }
}

impl BitXor for FiberMode {
    type Output = Self;

    fn bitxor(self, rhs: Self) -> Self::Output {
        Self(self.0 ^ rhs.0)
    }
}

impl BitXorAssign for FiberMode {
    fn bitxor_assign(&mut self, rhs: Self) {
        *self = Self(self.0 ^ rhs.0);
    }
}

impl Sub for FiberMode {
    type Output = Self;

    fn sub(self, rhs: Self) -> Self::Output {
        self.remove(rhs)
    }
}

impl Not for FiberMode {
    type Output = Self;

    fn not(self) -> Self::Output {
        Self::from_bits_truncate(!self.0)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FiberNode {
    id: FiberId,
    tag: FiberTag,
    key: Option<ReactKey>,
    mode: FiberMode,
    element_type: ElementTypeHandle,
    fiber_type: FiberTypeHandle,
    state_node: StateNodeHandle,
    return_: Option<FiberId>,
    child: Option<FiberId>,
    sibling: Option<FiberId>,
    index: usize,
    alternate: Option<FiberId>,
    pending_props: PropsHandle,
    memoized_props: PropsHandle,
    memoized_state: StateHandle,
    update_queue: UpdateQueueHandle,
    dependencies: DependenciesHandle,
    ref_handle: RefHandle,
    lanes: Lanes,
    child_lanes: Lanes,
    flags: FiberFlags,
    subtree_flags: FiberFlags,
    deletions: Option<DeletionListId>,
}

impl FiberNode {
    #[must_use]
    pub fn new(
        id: FiberId,
        tag: FiberTag,
        key: Option<ReactKey>,
        pending_props: PropsHandle,
        mode: FiberMode,
    ) -> Self {
        Self {
            id,
            tag,
            key,
            mode,
            element_type: ElementTypeHandle::NONE,
            fiber_type: FiberTypeHandle::NONE,
            state_node: StateNodeHandle::NONE,
            return_: None,
            child: None,
            sibling: None,
            index: 0,
            alternate: None,
            pending_props,
            memoized_props: PropsHandle::NONE,
            memoized_state: StateHandle::NONE,
            update_queue: UpdateQueueHandle::NONE,
            dependencies: DependenciesHandle::NONE,
            ref_handle: RefHandle::NONE,
            lanes: Lanes::NO,
            child_lanes: Lanes::NO,
            flags: FiberFlags::NO,
            subtree_flags: FiberFlags::NO,
            deletions: None,
        }
    }

    #[must_use]
    pub const fn id(&self) -> FiberId {
        self.id
    }

    #[must_use]
    pub const fn tag(&self) -> FiberTag {
        self.tag
    }

    #[must_use]
    pub fn key(&self) -> Option<&ReactKey> {
        self.key.as_ref()
    }

    #[must_use]
    pub const fn mode(&self) -> FiberMode {
        self.mode
    }

    #[must_use]
    pub const fn element_type(&self) -> ElementTypeHandle {
        self.element_type
    }

    pub fn set_element_type(&mut self, element_type: ElementTypeHandle) {
        self.element_type = element_type;
    }

    #[must_use]
    pub const fn fiber_type(&self) -> FiberTypeHandle {
        self.fiber_type
    }

    pub fn set_fiber_type(&mut self, fiber_type: FiberTypeHandle) {
        self.fiber_type = fiber_type;
    }

    #[must_use]
    pub const fn state_node(&self) -> StateNodeHandle {
        self.state_node
    }

    pub fn set_state_node(&mut self, state_node: StateNodeHandle) {
        self.state_node = state_node;
    }

    #[must_use]
    pub const fn return_fiber(&self) -> Option<FiberId> {
        self.return_
    }

    #[must_use]
    pub const fn child(&self) -> Option<FiberId> {
        self.child
    }

    #[must_use]
    pub const fn sibling(&self) -> Option<FiberId> {
        self.sibling
    }

    #[must_use]
    pub const fn index(&self) -> usize {
        self.index
    }

    #[must_use]
    pub const fn alternate(&self) -> Option<FiberId> {
        self.alternate
    }

    #[must_use]
    pub const fn pending_props(&self) -> PropsHandle {
        self.pending_props
    }

    pub fn set_pending_props(&mut self, pending_props: PropsHandle) {
        self.pending_props = pending_props;
    }

    #[must_use]
    pub const fn memoized_props(&self) -> PropsHandle {
        self.memoized_props
    }

    pub fn set_memoized_props(&mut self, memoized_props: PropsHandle) {
        self.memoized_props = memoized_props;
    }

    #[must_use]
    pub const fn memoized_state(&self) -> StateHandle {
        self.memoized_state
    }

    pub fn set_memoized_state(&mut self, memoized_state: StateHandle) {
        self.memoized_state = memoized_state;
    }

    #[must_use]
    pub const fn update_queue(&self) -> UpdateQueueHandle {
        self.update_queue
    }

    pub fn set_update_queue(&mut self, update_queue: UpdateQueueHandle) {
        self.update_queue = update_queue;
    }

    #[must_use]
    pub const fn dependencies(&self) -> DependenciesHandle {
        self.dependencies
    }

    pub fn set_dependencies(&mut self, dependencies: DependenciesHandle) {
        self.dependencies = dependencies;
    }

    #[must_use]
    pub const fn ref_handle(&self) -> RefHandle {
        self.ref_handle
    }

    pub fn set_ref_handle(&mut self, ref_handle: RefHandle) {
        self.ref_handle = ref_handle;
    }

    #[must_use]
    pub const fn lanes(&self) -> Lanes {
        self.lanes
    }

    pub fn set_lanes(&mut self, lanes: Lanes) {
        self.lanes = lanes;
    }

    pub fn merge_lanes(&mut self, lanes: Lanes) {
        self.lanes = self.lanes.merge(lanes);
    }

    #[must_use]
    pub const fn child_lanes(&self) -> Lanes {
        self.child_lanes
    }

    pub fn set_child_lanes(&mut self, child_lanes: Lanes) {
        self.child_lanes = child_lanes;
    }

    #[must_use]
    pub const fn flags(&self) -> FiberFlags {
        self.flags
    }

    pub fn set_flags(&mut self, flags: FiberFlags) {
        self.flags = flags;
    }

    pub fn merge_flags(&mut self, flags: FiberFlags) {
        self.flags |= flags;
    }

    #[must_use]
    pub const fn subtree_flags(&self) -> FiberFlags {
        self.subtree_flags
    }

    pub fn set_subtree_flags(&mut self, subtree_flags: FiberFlags) {
        self.subtree_flags = subtree_flags;
    }

    #[must_use]
    pub const fn deletions(&self) -> Option<DeletionListId> {
        self.deletions
    }

    pub(crate) fn set_return_fiber(&mut self, return_: Option<FiberId>) {
        self.return_ = return_;
    }

    pub(crate) fn set_child(&mut self, child: Option<FiberId>) {
        self.child = child;
    }

    pub(crate) fn set_sibling(&mut self, sibling: Option<FiberId>) {
        self.sibling = sibling;
    }

    pub(crate) fn set_index(&mut self, index: usize) {
        self.index = index;
    }

    pub(crate) fn set_alternate(&mut self, alternate: Option<FiberId>) {
        self.alternate = alternate;
    }

    pub(crate) fn set_deletions(&mut self, deletions: Option<DeletionListId>) {
        self.deletions = deletions;
    }

    pub(crate) fn clone_for_alternate(&self, id: FiberId, pending_props: PropsHandle) -> Self {
        let mut clone = self.clone();
        clone.id = id;
        clone.pending_props = pending_props;
        clone.return_ = None;
        clone.child = None;
        clone.sibling = None;
        clone.index = self.index;
        clone.alternate = Some(self.id);
        clone.flags = FiberFlags::NO;
        clone.subtree_flags = FiberFlags::NO;
        clone.deletions = None;
        clone
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{FiberArenaId, FiberGeneration, FiberSlot};

    #[test]
    fn fiber_tag_values_match_react_19_2_6_work_tags() {
        let expected = [
            (0, FiberTag::FunctionComponent),
            (1, FiberTag::ClassComponent),
            (3, FiberTag::HostRoot),
            (4, FiberTag::Portal),
            (5, FiberTag::HostComponent),
            (6, FiberTag::HostText),
            (7, FiberTag::Fragment),
            (8, FiberTag::Mode),
            (9, FiberTag::ContextConsumer),
            (10, FiberTag::ContextProvider),
            (11, FiberTag::ForwardRef),
            (12, FiberTag::Profiler),
            (13, FiberTag::Suspense),
            (14, FiberTag::MemoComponent),
            (15, FiberTag::SimpleMemoComponent),
            (16, FiberTag::LazyComponent),
            (17, FiberTag::IncompleteClassComponent),
            (18, FiberTag::DehydratedFragment),
            (19, FiberTag::SuspenseList),
            (21, FiberTag::Scope),
            (22, FiberTag::Offscreen),
            (23, FiberTag::LegacyHidden),
            (24, FiberTag::Cache),
            (25, FiberTag::TracingMarker),
            (26, FiberTag::HostHoistable),
            (27, FiberTag::HostSingleton),
            (28, FiberTag::IncompleteFunctionComponent),
            (29, FiberTag::Throw),
            (30, FiberTag::ViewTransition),
            (31, FiberTag::Activity),
        ];

        for (raw, tag) in expected {
            assert_eq!(FiberTag::from_react_tag(raw), tag);
            assert_eq!(tag.react_tag(), raw);
        }
        assert_eq!(FiberTag::from_react_tag(2), FiberTag::Reserved(2));
        assert_eq!(FiberTag::from_react_tag(20), FiberTag::Reserved(20));
    }

    #[test]
    fn fiber_mode_values_match_react_19_2_6_type_of_mode() {
        assert_eq!(FiberMode::NO.bits(), 0b000_0000);
        assert_eq!(FiberMode::CONCURRENT.bits(), 0b000_0001);
        assert_eq!(FiberMode::PROFILE.bits(), 0b000_0010);
        assert_eq!(FiberMode::STRICT_LEGACY.bits(), 0b000_1000);
        assert_eq!(FiberMode::STRICT_EFFECTS.bits(), 0b001_0000);
        assert_eq!(FiberMode::SUSPENSEY_IMAGES.bits(), 0b010_0000);
        assert_eq!(FiberMode::from_bits(0b000_0100), None);

        let mode = FiberMode::CONCURRENT | FiberMode::STRICT_EFFECTS;
        assert!(mode.contains_all(FiberMode::CONCURRENT));
        assert!(mode.contains_any(FiberMode::STRICT_EFFECTS));
        assert_eq!((mode - FiberMode::CONCURRENT), FiberMode::STRICT_EFFECTS);
        assert_eq!((!FiberMode::NO).bits(), VALID_FIBER_MODE_BITS);
    }

    #[test]
    fn fiber_node_defaults_are_renderer_agnostic_slots() {
        let arena_id = FiberArenaId::new(1).unwrap();
        let id = FiberId::new(arena_id, FiberSlot::new(0), FiberGeneration::INITIAL);
        let node = FiberNode::new(
            id,
            FiberTag::HostComponent,
            Some(ReactKey::from_normalized("a")),
            PropsHandle::from_raw(7),
            FiberMode::CONCURRENT,
        );

        assert_eq!(node.id(), id);
        assert_eq!(node.tag(), FiberTag::HostComponent);
        assert_eq!(node.key().map(ReactKey::as_str), Some("a"));
        assert_eq!(node.pending_props(), PropsHandle::from_raw(7));
        assert_eq!(node.state_node(), StateNodeHandle::NONE);
        assert_eq!(node.lanes(), Lanes::NO);
        assert_eq!(node.flags(), FiberFlags::NO);
        assert_eq!(node.deletions(), None);
    }
}
