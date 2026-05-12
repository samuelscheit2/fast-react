use super::*;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct AppendAllChildrenSourceEvidenceForCanary {
    react_version: &'static str,
    react_commit: &'static str,
    source_path: &'static str,
    append_all_children_start_line: u32,
    append_all_children_end_line: u32,
    terminal_host_condition_line: u32,
    append_initial_child_line: u32,
    portal_skip_line: u32,
    descend_to_child_line: u32,
    sibling_return_repair_line: u32,
    host_component_mount_call_line: u32,
}

impl AppendAllChildrenSourceEvidenceForCanary {
    #[must_use]
    pub(crate) const fn react_version(self) -> &'static str {
        self.react_version
    }

    #[must_use]
    pub(crate) const fn react_commit(self) -> &'static str {
        self.react_commit
    }

    #[must_use]
    pub(crate) const fn source_path(self) -> &'static str {
        self.source_path
    }

    #[must_use]
    pub(crate) const fn append_all_children_start_line(self) -> u32 {
        self.append_all_children_start_line
    }

    #[must_use]
    pub(crate) const fn append_all_children_end_line(self) -> u32 {
        self.append_all_children_end_line
    }

    #[must_use]
    pub(crate) const fn terminal_host_condition_line(self) -> u32 {
        self.terminal_host_condition_line
    }

    #[must_use]
    pub(crate) const fn append_initial_child_line(self) -> u32 {
        self.append_initial_child_line
    }

    #[must_use]
    pub(crate) const fn portal_skip_line(self) -> u32 {
        self.portal_skip_line
    }

    #[must_use]
    pub(crate) const fn descend_to_child_line(self) -> u32 {
        self.descend_to_child_line
    }

    #[must_use]
    pub(crate) const fn sibling_return_repair_line(self) -> u32 {
        self.sibling_return_repair_line
    }

    #[must_use]
    pub(crate) const fn host_component_mount_call_line(self) -> u32 {
        self.host_component_mount_call_line
    }
}

const APPEND_ALL_CHILDREN_SOURCE_EVIDENCE_FOR_CANARY: AppendAllChildrenSourceEvidenceForCanary =
    AppendAllChildrenSourceEvidenceForCanary {
        react_version: "19.2.6",
        react_commit: "eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401",
        source_path: "packages/react-reconciler/src/ReactFiberCompleteWork.js",
        append_all_children_start_line: 240,
        append_all_children_end_line: 342,
        terminal_host_condition_line: 251,
        append_initial_child_line: 252,
        portal_skip_line: 254,
        descend_to_child_line: 261,
        sibling_return_repair_line: 278,
        host_component_mount_call_line: 1399,
    };

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum TerminalHostDescendantHostMutationBlockerForCanary {
    CollectionOnlyDoesNotCallAppendInitialChild,
}

impl TerminalHostDescendantHostMutationBlockerForCanary {
    #[must_use]
    pub(crate) const fn as_str(self) -> &'static str {
        match self {
            Self::CollectionOnlyDoesNotCallAppendInitialChild => {
                "collection-only-does-not-call-append-initial-child"
            }
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum TerminalHostDescendantCompatibilityClaimForCanary {
    PublicDom,
    TestRenderer,
}

impl TerminalHostDescendantCompatibilityClaimForCanary {
    #[must_use]
    pub(crate) const fn as_str(self) -> &'static str {
        match self {
            Self::PublicDom => "public-dom",
            Self::TestRenderer => "test-renderer",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct TerminalHostDescendantExpectedRowForCanary {
    parent: FiberId,
    ordinal: usize,
    terminal: FiberId,
    terminal_tag: FiberTag,
    terminal_state_node: StateNodeHandle,
}

impl TerminalHostDescendantExpectedRowForCanary {
    #[must_use]
    pub(crate) const fn new(
        parent: FiberId,
        ordinal: usize,
        terminal: FiberId,
        terminal_tag: FiberTag,
        terminal_state_node: StateNodeHandle,
    ) -> Self {
        Self {
            parent,
            ordinal,
            terminal,
            terminal_tag,
            terminal_state_node,
        }
    }

    #[must_use]
    pub(crate) const fn parent(self) -> FiberId {
        self.parent
    }

    #[must_use]
    pub(crate) const fn ordinal(self) -> usize {
        self.ordinal
    }

    #[must_use]
    pub(crate) const fn terminal(self) -> FiberId {
        self.terminal
    }

    #[must_use]
    pub(crate) const fn terminal_tag(self) -> FiberTag {
        self.terminal_tag
    }

    #[must_use]
    pub(crate) const fn terminal_state_node(self) -> StateNodeHandle {
        self.terminal_state_node
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct TerminalHostDescendantRowForCanary {
    pub(super) parent: FiberId,
    pub(super) ordinal: usize,
    pub(super) terminal: FiberId,
    pub(super) terminal_tag: FiberTag,
    pub(super) terminal_state_node: StateNodeHandle,
    pub(super) direct_parent: FiberId,
}

impl TerminalHostDescendantRowForCanary {
    #[must_use]
    pub(crate) const fn parent(self) -> FiberId {
        self.parent
    }

    #[must_use]
    pub(crate) const fn ordinal(self) -> usize {
        self.ordinal
    }

    #[must_use]
    pub(crate) const fn terminal(self) -> FiberId {
        self.terminal
    }

    #[must_use]
    pub(crate) const fn terminal_tag(self) -> FiberTag {
        self.terminal_tag
    }

    #[must_use]
    pub(crate) const fn terminal_state_node(self) -> StateNodeHandle {
        self.terminal_state_node
    }

    #[must_use]
    pub(crate) const fn direct_parent(self) -> FiberId {
        self.direct_parent
    }

    #[must_use]
    pub(crate) fn matches_expected(
        self,
        expected: TerminalHostDescendantExpectedRowForCanary,
    ) -> bool {
        self.parent == expected.parent
            && self.ordinal == expected.ordinal
            && self.terminal == expected.terminal
            && self.terminal_tag == expected.terminal_tag
            && self.terminal_state_node == expected.terminal_state_node
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct TerminalHostDescendantSkippedWrapperForCanary {
    pub(super) parent: FiberId,
    pub(super) wrapper: FiberId,
    pub(super) wrapper_tag: FiberTag,
    pub(super) direct_parent: FiberId,
    pub(super) child_count: usize,
}

impl TerminalHostDescendantSkippedWrapperForCanary {
    #[must_use]
    pub(crate) const fn parent(self) -> FiberId {
        self.parent
    }

    #[must_use]
    pub(crate) const fn wrapper(self) -> FiberId {
        self.wrapper
    }

    #[must_use]
    pub(crate) const fn wrapper_tag(self) -> FiberTag {
        self.wrapper_tag
    }

    #[must_use]
    pub(crate) const fn direct_parent(self) -> FiberId {
        self.direct_parent
    }

    #[must_use]
    pub(crate) const fn child_count(self) -> usize {
        self.child_count
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct TerminalHostDescendantCollectionCompleteWorkRecordForCanary {
    parent: FiberId,
    parent_state_node: StateNodeHandle,
    source_evidence: AppendAllChildrenSourceEvidenceForCanary,
    terminal_descendants: Vec<TerminalHostDescendantRowForCanary>,
    skipped_wrappers: Vec<TerminalHostDescendantSkippedWrapperForCanary>,
    host_mutation_blocker: TerminalHostDescendantHostMutationBlockerForCanary,
    append_initial_child_called: bool,
    host_mutation_performed: bool,
    private_reconciler_handoff_only: bool,
    public_dom_compatibility_claimed: bool,
    test_renderer_compatibility_claimed: bool,
}

impl TerminalHostDescendantCollectionCompleteWorkRecordForCanary {
    #[must_use]
    pub(crate) const fn parent(&self) -> FiberId {
        self.parent
    }

    #[must_use]
    pub(crate) const fn parent_state_node(&self) -> StateNodeHandle {
        self.parent_state_node
    }

    #[must_use]
    pub(crate) const fn source_evidence(&self) -> AppendAllChildrenSourceEvidenceForCanary {
        self.source_evidence
    }

    #[must_use]
    pub(crate) fn terminal_descendants(&self) -> &[TerminalHostDescendantRowForCanary] {
        &self.terminal_descendants
    }

    #[must_use]
    pub(crate) fn terminal_descendant_count(&self) -> usize {
        self.terminal_descendants.len()
    }

    #[must_use]
    pub(crate) fn skipped_wrappers(&self) -> &[TerminalHostDescendantSkippedWrapperForCanary] {
        &self.skipped_wrappers
    }

    #[must_use]
    pub(crate) fn skipped_wrapper_count(&self) -> usize {
        self.skipped_wrappers.len()
    }

    #[must_use]
    pub(crate) const fn host_mutation_blocker(
        &self,
    ) -> TerminalHostDescendantHostMutationBlockerForCanary {
        self.host_mutation_blocker
    }

    #[must_use]
    pub(crate) const fn append_initial_child_called(&self) -> bool {
        self.append_initial_child_called
    }

    #[must_use]
    pub(crate) const fn host_mutation_performed(&self) -> bool {
        self.host_mutation_performed
    }

    #[must_use]
    pub(crate) const fn private_reconciler_handoff_only(&self) -> bool {
        self.private_reconciler_handoff_only
    }

    #[must_use]
    pub(crate) const fn public_dom_compatibility_claimed(&self) -> bool {
        self.public_dom_compatibility_claimed
    }

    #[must_use]
    pub(crate) const fn test_renderer_compatibility_claimed(&self) -> bool {
        self.test_renderer_compatibility_claimed
    }

    #[must_use]
    pub(crate) fn with_public_dom_compatibility_claimed_for_canary(mut self) -> Self {
        self.public_dom_compatibility_claimed = true;
        self
    }

    #[must_use]
    pub(crate) fn with_test_renderer_compatibility_claimed_for_canary(mut self) -> Self {
        self.test_renderer_compatibility_claimed = true;
        self
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum TerminalHostDescendantCollectionCompleteWorkErrorForCanary {
    FiberTopology(FiberTopologyError),
    ExpectedParentHostComponent {
        parent: FiberId,
        tag: FiberTag,
    },
    MissingParentStateNode {
        parent: FiberId,
    },
    PortalTraversalBlocked {
        parent: FiberId,
        portal: FiberId,
    },
    VisibilityBoundaryTraversalBlocked {
        parent: FiberId,
        boundary: FiberId,
        tag: FiberTag,
    },
    UnsupportedNonTerminalTraversal {
        parent: FiberId,
        child: FiberId,
        tag: FiberTag,
    },
    MissingTerminalStateNode {
        parent: FiberId,
        terminal: FiberId,
        tag: FiberTag,
    },
    DuplicateTerminalChild {
        parent: FiberId,
        terminal: FiberId,
    },
    StaleOrClonedTerminalRow {
        parent: FiberId,
        row: TerminalHostDescendantExpectedRowForCanary,
        reason: &'static str,
    },
    TerminalChildOrderMismatch {
        parent: FiberId,
        expected: Vec<TerminalHostDescendantExpectedRowForCanary>,
        actual: Vec<TerminalHostDescendantRowForCanary>,
    },
    PublicCompatibilityClaimed {
        parent: FiberId,
        compatibility: TerminalHostDescendantCompatibilityClaimForCanary,
    },
}

impl Display for TerminalHostDescendantCollectionCompleteWorkErrorForCanary {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::ExpectedParentHostComponent { parent, tag } => write!(
                formatter,
                "fiber {} must be HostComponent for private appendAllChildren terminal host descendant collection, found {:?}",
                parent.slot().get(),
                tag
            ),
            Self::MissingParentStateNode { parent } => write!(
                formatter,
                "HostComponent parent {} has no state node for private appendAllChildren terminal host descendant collection",
                parent.slot().get()
            ),
            Self::PortalTraversalBlocked { parent, portal } => write!(
                formatter,
                "private appendAllChildren terminal host descendant collection for parent {} blocks portal child {} traversal",
                parent.slot().get(),
                portal.slot().get()
            ),
            Self::VisibilityBoundaryTraversalBlocked {
                parent,
                boundary,
                tag,
            } => write!(
                formatter,
                "private appendAllChildren terminal host descendant collection for parent {} blocks {:?} boundary {} visibility traversal claims",
                parent.slot().get(),
                tag,
                boundary.slot().get()
            ),
            Self::UnsupportedNonTerminalTraversal { parent, child, tag } => write!(
                formatter,
                "private appendAllChildren terminal host descendant collection for parent {} only traverses FunctionComponent/Fragment wrappers; child {} was {:?}",
                parent.slot().get(),
                child.slot().get(),
                tag
            ),
            Self::MissingTerminalStateNode {
                parent,
                terminal,
                tag,
            } => write!(
                formatter,
                "private appendAllChildren terminal host descendant collection for parent {} requires {:?} terminal {} to have a state node",
                parent.slot().get(),
                tag,
                terminal.slot().get()
            ),
            Self::DuplicateTerminalChild { parent, terminal } => write!(
                formatter,
                "private appendAllChildren terminal host descendant collection for parent {} found duplicate terminal child {}",
                parent.slot().get(),
                terminal.slot().get()
            ),
            Self::StaleOrClonedTerminalRow {
                parent,
                row,
                reason,
            } => write!(
                formatter,
                "private appendAllChildren terminal host descendant collection for parent {} rejected stale/cloned expected row {:?}: {reason}",
                parent.slot().get(),
                row
            ),
            Self::TerminalChildOrderMismatch {
                parent,
                expected,
                actual,
            } => write!(
                formatter,
                "private appendAllChildren terminal host descendant collection for parent {} expected terminal rows {:?}, found {:?}",
                parent.slot().get(),
                expected,
                actual
            ),
            Self::PublicCompatibilityClaimed {
                parent,
                compatibility,
            } => write!(
                formatter,
                "private appendAllChildren terminal host descendant collection for parent {} cannot claim {} compatibility",
                parent.slot().get(),
                compatibility.as_str()
            ),
        }
    }
}

impl Error for TerminalHostDescendantCollectionCompleteWorkErrorForCanary {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberTopology(error) => Some(error),
            Self::ExpectedParentHostComponent { .. }
            | Self::MissingParentStateNode { .. }
            | Self::PortalTraversalBlocked { .. }
            | Self::VisibilityBoundaryTraversalBlocked { .. }
            | Self::UnsupportedNonTerminalTraversal { .. }
            | Self::MissingTerminalStateNode { .. }
            | Self::DuplicateTerminalChild { .. }
            | Self::StaleOrClonedTerminalRow { .. }
            | Self::TerminalChildOrderMismatch { .. }
            | Self::PublicCompatibilityClaimed { .. } => None,
        }
    }
}

impl From<FiberTopologyError> for TerminalHostDescendantCollectionCompleteWorkErrorForCanary {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

pub(crate) fn terminal_host_descendant_collection_complete_work_record_for_canary(
    arena: &FiberArena,
    parent: FiberId,
    expected_rows: &[TerminalHostDescendantExpectedRowForCanary],
) -> Result<
    TerminalHostDescendantCollectionCompleteWorkRecordForCanary,
    TerminalHostDescendantCollectionCompleteWorkErrorForCanary,
> {
    let parent_node = arena.get(parent)?;
    if parent_node.tag() != FiberTag::HostComponent {
        return Err(
            TerminalHostDescendantCollectionCompleteWorkErrorForCanary::ExpectedParentHostComponent {
                parent,
                tag: parent_node.tag(),
            },
        );
    }
    let parent_state_node = parent_node.state_node();
    if parent_state_node.is_none() {
        return Err(
            TerminalHostDescendantCollectionCompleteWorkErrorForCanary::MissingParentStateNode {
                parent,
            },
        );
    }

    let mut terminal_descendants = Vec::new();
    let mut skipped_wrappers = Vec::new();
    let mut seen_terminals = HashSet::new();
    for child in arena.child_ids(parent)? {
        collect_terminal_host_descendants_for_canary(
            arena,
            parent,
            child,
            parent,
            &mut terminal_descendants,
            &mut skipped_wrappers,
            &mut seen_terminals,
        )?;
    }

    validate_terminal_host_descendant_expected_rows_for_canary(
        arena,
        parent,
        expected_rows,
        &terminal_descendants,
    )?;

    let record = TerminalHostDescendantCollectionCompleteWorkRecordForCanary {
        parent,
        parent_state_node,
        source_evidence: APPEND_ALL_CHILDREN_SOURCE_EVIDENCE_FOR_CANARY,
        terminal_descendants,
        skipped_wrappers,
        host_mutation_blocker:
            TerminalHostDescendantHostMutationBlockerForCanary::CollectionOnlyDoesNotCallAppendInitialChild,
        append_initial_child_called: false,
        host_mutation_performed: false,
        private_reconciler_handoff_only: true,
        public_dom_compatibility_claimed: false,
        test_renderer_compatibility_claimed: false,
    };
    validate_terminal_host_descendant_private_scope_for_canary(&record)?;
    Ok(record)
}

fn collect_terminal_host_descendants_for_canary(
    arena: &FiberArena,
    parent: FiberId,
    child: FiberId,
    direct_parent: FiberId,
    terminal_descendants: &mut Vec<TerminalHostDescendantRowForCanary>,
    skipped_wrappers: &mut Vec<TerminalHostDescendantSkippedWrapperForCanary>,
    seen_terminals: &mut HashSet<FiberId>,
) -> Result<(), TerminalHostDescendantCollectionCompleteWorkErrorForCanary> {
    let child_node = arena.get(child)?;
    let tag = child_node.tag();
    match tag {
        FiberTag::HostComponent | FiberTag::HostText => {
            let terminal_state_node = child_node.state_node();
            if terminal_state_node.is_none() {
                return Err(
                    TerminalHostDescendantCollectionCompleteWorkErrorForCanary::MissingTerminalStateNode {
                        parent,
                        terminal: child,
                        tag,
                    },
                );
            }
            if !seen_terminals.insert(child) {
                return Err(
                    TerminalHostDescendantCollectionCompleteWorkErrorForCanary::DuplicateTerminalChild {
                        parent,
                        terminal: child,
                    },
                );
            }
            terminal_descendants.push(TerminalHostDescendantRowForCanary {
                parent,
                ordinal: terminal_descendants.len(),
                terminal: child,
                terminal_tag: tag,
                terminal_state_node,
                direct_parent,
            });
        }
        FiberTag::FunctionComponent | FiberTag::Fragment => {
            let children = arena.child_ids(child)?;
            skipped_wrappers.push(TerminalHostDescendantSkippedWrapperForCanary {
                parent,
                wrapper: child,
                wrapper_tag: tag,
                direct_parent,
                child_count: children.len(),
            });
            for grandchild in children {
                collect_terminal_host_descendants_for_canary(
                    arena,
                    parent,
                    grandchild,
                    child,
                    terminal_descendants,
                    skipped_wrappers,
                    seen_terminals,
                )?;
            }
        }
        FiberTag::Portal => {
            return Err(
                TerminalHostDescendantCollectionCompleteWorkErrorForCanary::PortalTraversalBlocked {
                    parent,
                    portal: child,
                },
            );
        }
        FiberTag::Suspense | FiberTag::Offscreen => {
            return Err(
                TerminalHostDescendantCollectionCompleteWorkErrorForCanary::VisibilityBoundaryTraversalBlocked {
                    parent,
                    boundary: child,
                    tag,
                },
            );
        }
        _ => {
            return Err(
                TerminalHostDescendantCollectionCompleteWorkErrorForCanary::UnsupportedNonTerminalTraversal {
                    parent,
                    child,
                    tag,
                },
            );
        }
    }

    Ok(())
}

fn validate_terminal_host_descendant_expected_rows_for_canary(
    arena: &FiberArena,
    parent: FiberId,
    expected_rows: &[TerminalHostDescendantExpectedRowForCanary],
    actual_rows: &[TerminalHostDescendantRowForCanary],
) -> Result<(), TerminalHostDescendantCollectionCompleteWorkErrorForCanary> {
    let mut seen_expected_terminals = HashSet::new();
    for row in expected_rows.iter().copied() {
        if row.parent() != parent {
            return Err(
                TerminalHostDescendantCollectionCompleteWorkErrorForCanary::StaleOrClonedTerminalRow {
                    parent,
                    row,
                    reason: "expected row belongs to a different parent",
                },
            );
        }
        if !seen_expected_terminals.insert(row.terminal()) {
            return Err(
                TerminalHostDescendantCollectionCompleteWorkErrorForCanary::DuplicateTerminalChild {
                    parent,
                    terminal: row.terminal(),
                },
            );
        }
        let terminal_node = arena.get(row.terminal())?;
        if !matches!(
            terminal_node.tag(),
            FiberTag::HostComponent | FiberTag::HostText
        ) {
            return Err(
                TerminalHostDescendantCollectionCompleteWorkErrorForCanary::StaleOrClonedTerminalRow {
                    parent,
                    row,
                    reason: "expected terminal row is not a HostComponent/HostText fiber",
                },
            );
        }
        if terminal_node.tag() != row.terminal_tag() {
            return Err(
                TerminalHostDescendantCollectionCompleteWorkErrorForCanary::StaleOrClonedTerminalRow {
                    parent,
                    row,
                    reason: "expected terminal row tag differs from current fiber tag",
                },
            );
        }
        if terminal_node.state_node() != row.terminal_state_node() {
            return Err(
                TerminalHostDescendantCollectionCompleteWorkErrorForCanary::StaleOrClonedTerminalRow {
                    parent,
                    row,
                    reason: "expected terminal row state node differs from current fiber state node",
                },
            );
        }
        if !has_ancestor_for_canary(arena, parent, row.terminal())? {
            return Err(
                TerminalHostDescendantCollectionCompleteWorkErrorForCanary::StaleOrClonedTerminalRow {
                    parent,
                    row,
                    reason: "expected terminal row is not inside parent subtree",
                },
            );
        }
    }

    let order_matches = expected_rows.len() == actual_rows.len()
        && actual_rows
            .iter()
            .zip(expected_rows.iter())
            .all(|(actual, expected)| actual.matches_expected(*expected));
    if !order_matches {
        return Err(
            TerminalHostDescendantCollectionCompleteWorkErrorForCanary::TerminalChildOrderMismatch {
                parent,
                expected: expected_rows.to_vec(),
                actual: actual_rows.to_vec(),
            },
        );
    }

    Ok(())
}

fn has_ancestor_for_canary(
    arena: &FiberArena,
    ancestor: FiberId,
    child: FiberId,
) -> Result<bool, FiberTopologyError> {
    let mut next = Some(child);
    let mut seen = HashSet::new();
    while let Some(fiber) = next {
        if fiber == ancestor {
            return Ok(true);
        }
        if !seen.insert(fiber) {
            return Err(FiberTopologyError::ReturnCycle {
                start: child,
                repeated: fiber,
            });
        }
        next = arena.get(fiber)?.return_fiber();
    }
    Ok(false)
}

pub(crate) fn validate_terminal_host_descendant_private_scope_for_canary(
    record: &TerminalHostDescendantCollectionCompleteWorkRecordForCanary,
) -> Result<(), TerminalHostDescendantCollectionCompleteWorkErrorForCanary> {
    if record.public_dom_compatibility_claimed() {
        return Err(
            TerminalHostDescendantCollectionCompleteWorkErrorForCanary::PublicCompatibilityClaimed {
                parent: record.parent(),
                compatibility: TerminalHostDescendantCompatibilityClaimForCanary::PublicDom,
            },
        );
    }
    if record.test_renderer_compatibility_claimed() {
        return Err(
            TerminalHostDescendantCollectionCompleteWorkErrorForCanary::PublicCompatibilityClaimed {
                parent: record.parent(),
                compatibility: TerminalHostDescendantCompatibilityClaimForCanary::TestRenderer,
            },
        );
    }
    Ok(())
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct AppendAllChildrenToContainerSourceEvidenceForCanary {
    react_version: &'static str,
    react_commit: &'static str,
    source_path: &'static str,
    append_all_children_to_container_start_line: u32,
    append_all_children_to_container_end_line: u32,
    host_component_condition_line: u32,
    host_component_append_child_set_line: u32,
    host_text_condition_line: u32,
    host_text_append_child_set_line: u32,
    portal_skip_line: u32,
    offscreen_visibility_line: u32,
    offscreen_recursive_call_line: u32,
    descend_to_child_line: u32,
    sibling_return_repair_line: u32,
    update_host_container_call_line: u32,
    finalize_container_children_line: u32,
}

impl AppendAllChildrenToContainerSourceEvidenceForCanary {
    #[must_use]
    pub(crate) const fn react_version(self) -> &'static str {
        self.react_version
    }

    #[must_use]
    pub(crate) const fn react_commit(self) -> &'static str {
        self.react_commit
    }

    #[must_use]
    pub(crate) const fn source_path(self) -> &'static str {
        self.source_path
    }

    #[must_use]
    pub(crate) const fn append_all_children_to_container_start_line(self) -> u32 {
        self.append_all_children_to_container_start_line
    }

    #[must_use]
    pub(crate) const fn append_all_children_to_container_end_line(self) -> u32 {
        self.append_all_children_to_container_end_line
    }

    #[must_use]
    pub(crate) const fn host_component_condition_line(self) -> u32 {
        self.host_component_condition_line
    }

    #[must_use]
    pub(crate) const fn host_component_append_child_set_line(self) -> u32 {
        self.host_component_append_child_set_line
    }

    #[must_use]
    pub(crate) const fn host_text_condition_line(self) -> u32 {
        self.host_text_condition_line
    }

    #[must_use]
    pub(crate) const fn host_text_append_child_set_line(self) -> u32 {
        self.host_text_append_child_set_line
    }

    #[must_use]
    pub(crate) const fn portal_skip_line(self) -> u32 {
        self.portal_skip_line
    }

    #[must_use]
    pub(crate) const fn offscreen_visibility_line(self) -> u32 {
        self.offscreen_visibility_line
    }

    #[must_use]
    pub(crate) const fn offscreen_recursive_call_line(self) -> u32 {
        self.offscreen_recursive_call_line
    }

    #[must_use]
    pub(crate) const fn descend_to_child_line(self) -> u32 {
        self.descend_to_child_line
    }

    #[must_use]
    pub(crate) const fn sibling_return_repair_line(self) -> u32 {
        self.sibling_return_repair_line
    }

    #[must_use]
    pub(crate) const fn update_host_container_call_line(self) -> u32 {
        self.update_host_container_call_line
    }

    #[must_use]
    pub(crate) const fn finalize_container_children_line(self) -> u32 {
        self.finalize_container_children_line
    }
}

const APPEND_ALL_CHILDREN_TO_CONTAINER_SOURCE_EVIDENCE_FOR_CANARY:
    AppendAllChildrenToContainerSourceEvidenceForCanary =
    AppendAllChildrenToContainerSourceEvidenceForCanary {
        react_version: "19.2.6",
        react_commit: "eaf3e95ca92be7a23d3c9cc8ffd6f199a40be401",
        source_path: "packages/react-reconciler/src/ReactFiberCompleteWork.js",
        append_all_children_to_container_start_line: 347,
        append_all_children_to_container_end_line: 426,
        host_component_condition_line: 363,
        host_component_append_child_set_line: 371,
        host_text_condition_line: 372,
        host_text_append_child_set_line: 379,
        portal_skip_line: 380,
        offscreen_visibility_line: 384,
        offscreen_recursive_call_line: 394,
        descend_to_child_line: 402,
        sibling_return_repair_line: 420,
        update_host_container_call_line: 439,
        finalize_container_children_line: 448,
    };

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostRootContainerCurrentnessEvidenceForCanary {
    root: FiberRootId,
    current: FiberId,
    work_in_progress: FiberId,
    container_state_node: StateNodeHandle,
    current_state_node: StateNodeHandle,
    work_in_progress_state_node: StateNodeHandle,
    current_alternate: Option<FiberId>,
    work_in_progress_alternate: Option<FiberId>,
}

impl HostRootContainerCurrentnessEvidenceForCanary {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn current(self) -> FiberId {
        self.current
    }

    #[must_use]
    pub(crate) const fn work_in_progress(self) -> FiberId {
        self.work_in_progress
    }

    #[must_use]
    pub(crate) const fn container_state_node(self) -> StateNodeHandle {
        self.container_state_node
    }

    #[must_use]
    pub(crate) const fn current_state_node(self) -> StateNodeHandle {
        self.current_state_node
    }

    #[must_use]
    pub(crate) const fn work_in_progress_state_node(self) -> StateNodeHandle {
        self.work_in_progress_state_node
    }

    #[must_use]
    pub(crate) const fn current_alternate(self) -> Option<FiberId> {
        self.current_alternate
    }

    #[must_use]
    pub(crate) const fn work_in_progress_alternate(self) -> Option<FiberId> {
        self.work_in_progress_alternate
    }

    #[must_use]
    pub(crate) fn is_current_work_in_progress_pair(self) -> bool {
        self.current_alternate == Some(self.work_in_progress)
            && self.work_in_progress_alternate == Some(self.current)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum HostRootContainerDescendantMutationBlockerForCanary {
    CollectionOnlyDoesNotCreateOrAppendContainerChildSet,
}

impl HostRootContainerDescendantMutationBlockerForCanary {
    #[must_use]
    pub(crate) const fn as_str(self) -> &'static str {
        match self {
            Self::CollectionOnlyDoesNotCreateOrAppendContainerChildSet => {
                "collection-only-does-not-create-or-append-container-child-set"
            }
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum HostRootContainerDescendantScopeClaimForCanary {
    PublicDom,
    TestRenderer,
    PersistenceContainerChildSet,
    PublicRootBehavior,
    RendererCompatibility,
    PackageCompatibility,
}

impl HostRootContainerDescendantScopeClaimForCanary {
    #[must_use]
    pub(crate) const fn as_str(self) -> &'static str {
        match self {
            Self::PublicDom => "public-dom",
            Self::TestRenderer => "test-renderer",
            Self::PersistenceContainerChildSet => "persistence-container-child-set",
            Self::PublicRootBehavior => "public-root-behavior",
            Self::RendererCompatibility => "renderer-compatibility",
            Self::PackageCompatibility => "package-compatibility",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum HostRootContainerDescendantMutationClaimForCanary {
    AppendChildToContainerChildSet,
    ContainerChildSetMutation,
    HostChildMutation,
}

impl HostRootContainerDescendantMutationClaimForCanary {
    #[must_use]
    pub(crate) const fn as_str(self) -> &'static str {
        match self {
            Self::AppendChildToContainerChildSet => "append-child-to-container-child-set",
            Self::ContainerChildSetMutation => "container-child-set-mutation",
            Self::HostChildMutation => "host-child-mutation",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostRootContainerDescendantSourceRowForCanary {
    root: FiberRootId,
    current: FiberId,
    work_in_progress: FiberId,
    ordinal: usize,
    terminal: FiberId,
    terminal_tag: FiberTag,
    terminal_state_node: StateNodeHandle,
}

impl HostRootContainerDescendantSourceRowForCanary {
    #[must_use]
    pub(crate) const fn new(
        root: FiberRootId,
        current: FiberId,
        work_in_progress: FiberId,
        ordinal: usize,
        terminal: FiberId,
        terminal_tag: FiberTag,
        terminal_state_node: StateNodeHandle,
    ) -> Self {
        Self {
            root,
            current,
            work_in_progress,
            ordinal,
            terminal,
            terminal_tag,
            terminal_state_node,
        }
    }

    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn current(self) -> FiberId {
        self.current
    }

    #[must_use]
    pub(crate) const fn work_in_progress(self) -> FiberId {
        self.work_in_progress
    }

    #[must_use]
    pub(crate) const fn ordinal(self) -> usize {
        self.ordinal
    }

    #[must_use]
    pub(crate) const fn terminal(self) -> FiberId {
        self.terminal
    }

    #[must_use]
    pub(crate) const fn terminal_tag(self) -> FiberTag {
        self.terminal_tag
    }

    #[must_use]
    pub(crate) const fn terminal_state_node(self) -> StateNodeHandle {
        self.terminal_state_node
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostRootContainerDescendantRowForCanary {
    pub(super) root: FiberRootId,
    pub(super) current: FiberId,
    pub(super) work_in_progress: FiberId,
    pub(super) ordinal: usize,
    pub(super) terminal: FiberId,
    pub(super) terminal_tag: FiberTag,
    pub(super) terminal_state_node: StateNodeHandle,
    pub(super) direct_parent: FiberId,
}

impl HostRootContainerDescendantRowForCanary {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn current(self) -> FiberId {
        self.current
    }

    #[must_use]
    pub(crate) const fn work_in_progress(self) -> FiberId {
        self.work_in_progress
    }

    #[must_use]
    pub(crate) const fn ordinal(self) -> usize {
        self.ordinal
    }

    #[must_use]
    pub(crate) const fn terminal(self) -> FiberId {
        self.terminal
    }

    #[must_use]
    pub(crate) const fn terminal_tag(self) -> FiberTag {
        self.terminal_tag
    }

    #[must_use]
    pub(crate) const fn terminal_state_node(self) -> StateNodeHandle {
        self.terminal_state_node
    }

    #[must_use]
    pub(crate) const fn direct_parent(self) -> FiberId {
        self.direct_parent
    }

    #[must_use]
    pub(crate) const fn source_row(self) -> HostRootContainerDescendantSourceRowForCanary {
        HostRootContainerDescendantSourceRowForCanary::new(
            self.root,
            self.current,
            self.work_in_progress,
            self.ordinal,
            self.terminal,
            self.terminal_tag,
            self.terminal_state_node,
        )
    }

    #[must_use]
    pub(crate) fn matches_source_row(
        self,
        expected: HostRootContainerDescendantSourceRowForCanary,
    ) -> bool {
        self.source_row() == expected
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostRootContainerDescendantSkippedWrapperForCanary {
    pub(super) root: FiberRootId,
    pub(super) current: FiberId,
    pub(super) work_in_progress: FiberId,
    pub(super) wrapper: FiberId,
    pub(super) wrapper_tag: FiberTag,
    pub(super) direct_parent: FiberId,
    pub(super) child_count: usize,
}

impl HostRootContainerDescendantSkippedWrapperForCanary {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn current(self) -> FiberId {
        self.current
    }

    #[must_use]
    pub(crate) const fn work_in_progress(self) -> FiberId {
        self.work_in_progress
    }

    #[must_use]
    pub(crate) const fn wrapper(self) -> FiberId {
        self.wrapper
    }

    #[must_use]
    pub(crate) const fn wrapper_tag(self) -> FiberTag {
        self.wrapper_tag
    }

    #[must_use]
    pub(crate) const fn direct_parent(self) -> FiberId {
        self.direct_parent
    }

    #[must_use]
    pub(crate) const fn child_count(self) -> usize {
        self.child_count
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct HostRootContainerDescendantCollectionCompleteWorkRecordForCanary {
    currentness: HostRootContainerCurrentnessEvidenceForCanary,
    source_evidence: AppendAllChildrenToContainerSourceEvidenceForCanary,
    terminal_descendants: Vec<HostRootContainerDescendantRowForCanary>,
    skipped_wrappers: Vec<HostRootContainerDescendantSkippedWrapperForCanary>,
    mutation_blocker: HostRootContainerDescendantMutationBlockerForCanary,
    append_child_to_container_child_set_called: bool,
    container_child_set_mutation_performed: bool,
    host_child_mutation_performed: bool,
    private_reconciler_handoff_only: bool,
    public_dom_compatibility_claimed: bool,
    test_renderer_compatibility_claimed: bool,
    persistence_container_child_set_compatibility_claimed: bool,
    public_root_behavior_claimed: bool,
    renderer_compatibility_claimed: bool,
    package_compatibility_claimed: bool,
}

impl HostRootContainerDescendantCollectionCompleteWorkRecordForCanary {
    #[must_use]
    pub(crate) const fn root(&self) -> FiberRootId {
        self.currentness.root()
    }

    #[must_use]
    pub(crate) const fn current(&self) -> FiberId {
        self.currentness.current()
    }

    #[must_use]
    pub(crate) const fn work_in_progress(&self) -> FiberId {
        self.currentness.work_in_progress()
    }

    #[must_use]
    pub(crate) const fn container_state_node(&self) -> StateNodeHandle {
        self.currentness.container_state_node()
    }

    #[must_use]
    pub(crate) const fn currentness(&self) -> HostRootContainerCurrentnessEvidenceForCanary {
        self.currentness
    }

    #[must_use]
    pub(crate) const fn source_evidence(
        &self,
    ) -> AppendAllChildrenToContainerSourceEvidenceForCanary {
        self.source_evidence
    }

    #[must_use]
    pub(crate) fn terminal_descendants(&self) -> &[HostRootContainerDescendantRowForCanary] {
        &self.terminal_descendants
    }

    #[must_use]
    pub(crate) fn terminal_descendant_count(&self) -> usize {
        self.terminal_descendants.len()
    }

    #[must_use]
    pub(crate) fn skipped_wrappers(&self) -> &[HostRootContainerDescendantSkippedWrapperForCanary] {
        &self.skipped_wrappers
    }

    #[must_use]
    pub(crate) fn skipped_wrapper_count(&self) -> usize {
        self.skipped_wrappers.len()
    }

    #[must_use]
    pub(crate) const fn mutation_blocker(
        &self,
    ) -> HostRootContainerDescendantMutationBlockerForCanary {
        self.mutation_blocker
    }

    #[must_use]
    pub(crate) const fn append_child_to_container_child_set_called(&self) -> bool {
        self.append_child_to_container_child_set_called
    }

    #[must_use]
    pub(crate) const fn container_child_set_mutation_performed(&self) -> bool {
        self.container_child_set_mutation_performed
    }

    #[must_use]
    pub(crate) const fn host_child_mutation_performed(&self) -> bool {
        self.host_child_mutation_performed
    }

    #[must_use]
    pub(crate) const fn private_reconciler_handoff_only(&self) -> bool {
        self.private_reconciler_handoff_only
    }

    #[must_use]
    pub(crate) const fn public_dom_compatibility_claimed(&self) -> bool {
        self.public_dom_compatibility_claimed
    }

    #[must_use]
    pub(crate) const fn test_renderer_compatibility_claimed(&self) -> bool {
        self.test_renderer_compatibility_claimed
    }

    #[must_use]
    pub(crate) const fn persistence_container_child_set_compatibility_claimed(&self) -> bool {
        self.persistence_container_child_set_compatibility_claimed
    }

    #[must_use]
    pub(crate) const fn public_root_behavior_claimed(&self) -> bool {
        self.public_root_behavior_claimed
    }

    #[must_use]
    pub(crate) const fn renderer_compatibility_claimed(&self) -> bool {
        self.renderer_compatibility_claimed
    }

    #[must_use]
    pub(crate) const fn package_compatibility_claimed(&self) -> bool {
        self.package_compatibility_claimed
    }

    #[must_use]
    pub(crate) fn with_public_dom_compatibility_claimed_for_canary(mut self) -> Self {
        self.public_dom_compatibility_claimed = true;
        self
    }

    #[must_use]
    pub(crate) fn with_test_renderer_compatibility_claimed_for_canary(mut self) -> Self {
        self.test_renderer_compatibility_claimed = true;
        self
    }

    #[must_use]
    pub(crate) fn with_persistence_container_child_set_compatibility_claimed_for_canary(
        mut self,
    ) -> Self {
        self.persistence_container_child_set_compatibility_claimed = true;
        self
    }

    #[must_use]
    pub(crate) fn with_public_root_behavior_claimed_for_canary(mut self) -> Self {
        self.public_root_behavior_claimed = true;
        self
    }

    #[must_use]
    pub(crate) fn with_renderer_compatibility_claimed_for_canary(mut self) -> Self {
        self.renderer_compatibility_claimed = true;
        self
    }

    #[must_use]
    pub(crate) fn with_package_compatibility_claimed_for_canary(mut self) -> Self {
        self.package_compatibility_claimed = true;
        self
    }

    #[must_use]
    pub(crate) fn with_append_child_to_container_child_set_called_for_canary(mut self) -> Self {
        self.append_child_to_container_child_set_called = true;
        self
    }

    #[must_use]
    pub(crate) fn with_container_child_set_mutation_performed_for_canary(mut self) -> Self {
        self.container_child_set_mutation_performed = true;
        self
    }

    #[must_use]
    pub(crate) fn with_host_child_mutation_performed_for_canary(mut self) -> Self {
        self.host_child_mutation_performed = true;
        self
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum HostRootContainerDescendantCollectionCompleteWorkErrorForCanary {
    FiberTopology(FiberTopologyError),
    ExpectedHostRoot {
        fiber: FiberId,
        tag: FiberTag,
    },
    CurrentnessMismatch {
        current: FiberId,
        current_alternate: Option<FiberId>,
        work_in_progress: FiberId,
        work_in_progress_alternate: Option<FiberId>,
    },
    RootContainerStateNodeMismatch {
        root: FiberRootId,
        fiber: FiberId,
        expected_state_node: StateNodeHandle,
        actual_state_node: StateNodeHandle,
    },
    PortalTraversalBlocked {
        root: FiberRootId,
        work_in_progress: FiberId,
        portal: FiberId,
    },
    VisibilityBoundaryTraversalBlocked {
        root: FiberRootId,
        work_in_progress: FiberId,
        boundary: FiberId,
        tag: FiberTag,
    },
    UnsupportedNonTerminalTraversal {
        root: FiberRootId,
        work_in_progress: FiberId,
        child: FiberId,
        tag: FiberTag,
    },
    MissingTerminalStateNode {
        root: FiberRootId,
        work_in_progress: FiberId,
        terminal: FiberId,
        tag: FiberTag,
    },
    DuplicateTerminalChild {
        root: FiberRootId,
        work_in_progress: FiberId,
        terminal: FiberId,
    },
    StaleOrClonedContainerSourceRow {
        root: FiberRootId,
        current: FiberId,
        work_in_progress: FiberId,
        row: HostRootContainerDescendantSourceRowForCanary,
        reason: &'static str,
    },
    TerminalChildOrderMismatch {
        root: FiberRootId,
        work_in_progress: FiberId,
        expected: Vec<HostRootContainerDescendantSourceRowForCanary>,
        actual: Vec<HostRootContainerDescendantRowForCanary>,
    },
    ScopeClaimed {
        root: FiberRootId,
        claim: HostRootContainerDescendantScopeClaimForCanary,
    },
    MutationClaimed {
        root: FiberRootId,
        claim: HostRootContainerDescendantMutationClaimForCanary,
    },
}

impl Display for HostRootContainerDescendantCollectionCompleteWorkErrorForCanary {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::ExpectedHostRoot { fiber, tag } => write!(
                formatter,
                "fiber {} must be HostRoot for private appendAllChildrenToContainer terminal host descendant collection, found {:?}",
                fiber.slot().get(),
                tag
            ),
            Self::CurrentnessMismatch {
                current,
                current_alternate,
                work_in_progress,
                work_in_progress_alternate,
            } => write!(
                formatter,
                "private appendAllChildrenToContainer currentness expected HostRoot current {} <-> work-in-progress {}; found current alternate {:?} and work-in-progress alternate {:?}",
                current.slot().get(),
                work_in_progress.slot().get(),
                current_alternate.map(|fiber| fiber.slot().get()),
                work_in_progress_alternate.map(|fiber| fiber.slot().get())
            ),
            Self::RootContainerStateNodeMismatch {
                root,
                fiber,
                expected_state_node,
                actual_state_node,
            } => write!(
                formatter,
                "private appendAllChildrenToContainer root {} expected HostRoot fiber {} container state node {}, found {}",
                root.raw(),
                fiber.slot().get(),
                expected_state_node.raw(),
                actual_state_node.raw()
            ),
            Self::PortalTraversalBlocked {
                root,
                work_in_progress,
                portal,
            } => write!(
                formatter,
                "private appendAllChildrenToContainer collection for root {} HostRoot {} blocks portal child {} traversal",
                root.raw(),
                work_in_progress.slot().get(),
                portal.slot().get()
            ),
            Self::VisibilityBoundaryTraversalBlocked {
                root,
                work_in_progress,
                boundary,
                tag,
            } => write!(
                formatter,
                "private appendAllChildrenToContainer collection for root {} HostRoot {} blocks {:?} boundary {} visibility traversal claims",
                root.raw(),
                work_in_progress.slot().get(),
                tag,
                boundary.slot().get()
            ),
            Self::UnsupportedNonTerminalTraversal {
                root,
                work_in_progress,
                child,
                tag,
            } => write!(
                formatter,
                "private appendAllChildrenToContainer collection for root {} HostRoot {} only traverses FunctionComponent/Fragment wrappers; child {} was {:?}",
                root.raw(),
                work_in_progress.slot().get(),
                child.slot().get(),
                tag
            ),
            Self::MissingTerminalStateNode {
                root,
                work_in_progress,
                terminal,
                tag,
            } => write!(
                formatter,
                "private appendAllChildrenToContainer collection for root {} HostRoot {} requires {:?} terminal {} to have a state node",
                root.raw(),
                work_in_progress.slot().get(),
                tag,
                terminal.slot().get()
            ),
            Self::DuplicateTerminalChild {
                root,
                work_in_progress,
                terminal,
            } => write!(
                formatter,
                "private appendAllChildrenToContainer collection for root {} HostRoot {} found duplicate terminal child {}",
                root.raw(),
                work_in_progress.slot().get(),
                terminal.slot().get()
            ),
            Self::StaleOrClonedContainerSourceRow {
                root,
                current,
                work_in_progress,
                row,
                reason,
            } => write!(
                formatter,
                "private appendAllChildrenToContainer collection for root {} current {} work-in-progress {} rejected stale/cloned source row {:?}: {reason}",
                root.raw(),
                current.slot().get(),
                work_in_progress.slot().get(),
                row
            ),
            Self::TerminalChildOrderMismatch {
                root,
                work_in_progress,
                expected,
                actual,
            } => write!(
                formatter,
                "private appendAllChildrenToContainer collection for root {} HostRoot {} expected terminal source rows {:?}, found {:?}",
                root.raw(),
                work_in_progress.slot().get(),
                expected,
                actual
            ),
            Self::ScopeClaimed { root, claim } => write!(
                formatter,
                "private appendAllChildrenToContainer collection for root {} cannot claim {} compatibility or public behavior",
                root.raw(),
                claim.as_str()
            ),
            Self::MutationClaimed { root, claim } => write!(
                formatter,
                "private appendAllChildrenToContainer collection for root {} cannot claim {}",
                root.raw(),
                claim.as_str()
            ),
        }
    }
}

impl Error for HostRootContainerDescendantCollectionCompleteWorkErrorForCanary {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberTopology(error) => Some(error),
            Self::ExpectedHostRoot { .. }
            | Self::CurrentnessMismatch { .. }
            | Self::RootContainerStateNodeMismatch { .. }
            | Self::PortalTraversalBlocked { .. }
            | Self::VisibilityBoundaryTraversalBlocked { .. }
            | Self::UnsupportedNonTerminalTraversal { .. }
            | Self::MissingTerminalStateNode { .. }
            | Self::DuplicateTerminalChild { .. }
            | Self::StaleOrClonedContainerSourceRow { .. }
            | Self::TerminalChildOrderMismatch { .. }
            | Self::ScopeClaimed { .. }
            | Self::MutationClaimed { .. } => None,
        }
    }
}

impl From<FiberTopologyError> for HostRootContainerDescendantCollectionCompleteWorkErrorForCanary {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

pub(crate) fn host_root_container_descendant_collection_complete_work_record_for_canary(
    arena: &FiberArena,
    root: FiberRootId,
    current: FiberId,
    work_in_progress: FiberId,
    expected_rows: &[HostRootContainerDescendantSourceRowForCanary],
) -> Result<
    HostRootContainerDescendantCollectionCompleteWorkRecordForCanary,
    HostRootContainerDescendantCollectionCompleteWorkErrorForCanary,
> {
    let currentness = validate_host_root_container_currentness_for_canary(
        arena,
        root,
        current,
        work_in_progress,
    )?;

    let mut terminal_descendants = Vec::new();
    let mut skipped_wrappers = Vec::new();
    let mut seen_terminals = HashSet::new();
    for child in arena.child_ids(work_in_progress)? {
        collect_host_root_container_terminal_descendants_for_canary(
            arena,
            currentness,
            child,
            work_in_progress,
            &mut terminal_descendants,
            &mut skipped_wrappers,
            &mut seen_terminals,
        )?;
    }

    validate_host_root_container_descendant_source_rows_for_canary(
        arena,
        currentness,
        expected_rows,
        &terminal_descendants,
    )?;

    let record = HostRootContainerDescendantCollectionCompleteWorkRecordForCanary {
        currentness,
        source_evidence: APPEND_ALL_CHILDREN_TO_CONTAINER_SOURCE_EVIDENCE_FOR_CANARY,
        terminal_descendants,
        skipped_wrappers,
        mutation_blocker:
            HostRootContainerDescendantMutationBlockerForCanary::CollectionOnlyDoesNotCreateOrAppendContainerChildSet,
        append_child_to_container_child_set_called: false,
        container_child_set_mutation_performed: false,
        host_child_mutation_performed: false,
        private_reconciler_handoff_only: true,
        public_dom_compatibility_claimed: false,
        test_renderer_compatibility_claimed: false,
        persistence_container_child_set_compatibility_claimed: false,
        public_root_behavior_claimed: false,
        renderer_compatibility_claimed: false,
        package_compatibility_claimed: false,
    };
    validate_host_root_container_descendant_private_scope_for_canary(&record)?;
    Ok(record)
}

fn validate_host_root_container_currentness_for_canary(
    arena: &FiberArena,
    root: FiberRootId,
    current: FiberId,
    work_in_progress: FiberId,
) -> Result<
    HostRootContainerCurrentnessEvidenceForCanary,
    HostRootContainerDescendantCollectionCompleteWorkErrorForCanary,
> {
    let current_node = arena.get(current)?;
    if current_node.tag() != FiberTag::HostRoot {
        return Err(
            HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::ExpectedHostRoot {
                fiber: current,
                tag: current_node.tag(),
            },
        );
    }

    let work_in_progress_node = arena.get(work_in_progress)?;
    if work_in_progress_node.tag() != FiberTag::HostRoot {
        return Err(
            HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::ExpectedHostRoot {
                fiber: work_in_progress,
                tag: work_in_progress_node.tag(),
            },
        );
    }

    let current_alternate = current_node.alternate();
    let work_in_progress_alternate = work_in_progress_node.alternate();
    if current_alternate != Some(work_in_progress) || work_in_progress_alternate != Some(current) {
        return Err(
            HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::CurrentnessMismatch {
                current,
                current_alternate,
                work_in_progress,
                work_in_progress_alternate,
            },
        );
    }

    let expected_state_node = root.state_node_handle();
    let current_state_node = current_node.state_node();
    if current_state_node != expected_state_node {
        return Err(
            HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::RootContainerStateNodeMismatch {
                root,
                fiber: current,
                expected_state_node,
                actual_state_node: current_state_node,
            },
        );
    }

    let work_in_progress_state_node = work_in_progress_node.state_node();
    if work_in_progress_state_node != expected_state_node {
        return Err(
            HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::RootContainerStateNodeMismatch {
                root,
                fiber: work_in_progress,
                expected_state_node,
                actual_state_node: work_in_progress_state_node,
            },
        );
    }

    Ok(HostRootContainerCurrentnessEvidenceForCanary {
        root,
        current,
        work_in_progress,
        container_state_node: expected_state_node,
        current_state_node,
        work_in_progress_state_node,
        current_alternate,
        work_in_progress_alternate,
    })
}

fn collect_host_root_container_terminal_descendants_for_canary(
    arena: &FiberArena,
    currentness: HostRootContainerCurrentnessEvidenceForCanary,
    child: FiberId,
    direct_parent: FiberId,
    terminal_descendants: &mut Vec<HostRootContainerDescendantRowForCanary>,
    skipped_wrappers: &mut Vec<HostRootContainerDescendantSkippedWrapperForCanary>,
    seen_terminals: &mut HashSet<FiberId>,
) -> Result<(), HostRootContainerDescendantCollectionCompleteWorkErrorForCanary> {
    let child_node = arena.get(child)?;
    let tag = child_node.tag();
    match tag {
        FiberTag::HostComponent | FiberTag::HostText => {
            let terminal_state_node = child_node.state_node();
            if terminal_state_node.is_none() {
                return Err(
                    HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::MissingTerminalStateNode {
                        root: currentness.root(),
                        work_in_progress: currentness.work_in_progress(),
                        terminal: child,
                        tag,
                    },
                );
            }
            if !seen_terminals.insert(child) {
                return Err(
                    HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::DuplicateTerminalChild {
                        root: currentness.root(),
                        work_in_progress: currentness.work_in_progress(),
                        terminal: child,
                    },
                );
            }
            terminal_descendants.push(HostRootContainerDescendantRowForCanary {
                root: currentness.root(),
                current: currentness.current(),
                work_in_progress: currentness.work_in_progress(),
                ordinal: terminal_descendants.len(),
                terminal: child,
                terminal_tag: tag,
                terminal_state_node,
                direct_parent,
            });
        }
        FiberTag::FunctionComponent | FiberTag::Fragment => {
            let children = arena.child_ids(child)?;
            skipped_wrappers.push(HostRootContainerDescendantSkippedWrapperForCanary {
                root: currentness.root(),
                current: currentness.current(),
                work_in_progress: currentness.work_in_progress(),
                wrapper: child,
                wrapper_tag: tag,
                direct_parent,
                child_count: children.len(),
            });
            for grandchild in children {
                collect_host_root_container_terminal_descendants_for_canary(
                    arena,
                    currentness,
                    grandchild,
                    child,
                    terminal_descendants,
                    skipped_wrappers,
                    seen_terminals,
                )?;
            }
        }
        FiberTag::Portal => {
            return Err(
                HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::PortalTraversalBlocked {
                    root: currentness.root(),
                    work_in_progress: currentness.work_in_progress(),
                    portal: child,
                },
            );
        }
        FiberTag::Suspense | FiberTag::Offscreen => {
            return Err(
                HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::VisibilityBoundaryTraversalBlocked {
                    root: currentness.root(),
                    work_in_progress: currentness.work_in_progress(),
                    boundary: child,
                    tag,
                },
            );
        }
        _ => {
            return Err(
                HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::UnsupportedNonTerminalTraversal {
                    root: currentness.root(),
                    work_in_progress: currentness.work_in_progress(),
                    child,
                    tag,
                },
            );
        }
    }

    Ok(())
}

fn validate_host_root_container_descendant_source_rows_for_canary(
    arena: &FiberArena,
    currentness: HostRootContainerCurrentnessEvidenceForCanary,
    expected_rows: &[HostRootContainerDescendantSourceRowForCanary],
    actual_rows: &[HostRootContainerDescendantRowForCanary],
) -> Result<(), HostRootContainerDescendantCollectionCompleteWorkErrorForCanary> {
    let mut seen_expected_terminals = HashSet::new();
    for row in expected_rows.iter().copied() {
        if row.root() != currentness.root() {
            return Err(
                HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::StaleOrClonedContainerSourceRow {
                    root: currentness.root(),
                    current: currentness.current(),
                    work_in_progress: currentness.work_in_progress(),
                    row,
                    reason: "expected source row belongs to a different root",
                },
            );
        }
        if row.current() != currentness.current() {
            return Err(
                HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::StaleOrClonedContainerSourceRow {
                    root: currentness.root(),
                    current: currentness.current(),
                    work_in_progress: currentness.work_in_progress(),
                    row,
                    reason: "expected source row belongs to a different current HostRoot",
                },
            );
        }
        if row.work_in_progress() != currentness.work_in_progress() {
            return Err(
                HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::StaleOrClonedContainerSourceRow {
                    root: currentness.root(),
                    current: currentness.current(),
                    work_in_progress: currentness.work_in_progress(),
                    row,
                    reason: "expected source row belongs to a different HostRoot work-in-progress",
                },
            );
        }
        if !seen_expected_terminals.insert(row.terminal()) {
            return Err(
                HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::DuplicateTerminalChild {
                    root: currentness.root(),
                    work_in_progress: currentness.work_in_progress(),
                    terminal: row.terminal(),
                },
            );
        }
        let terminal_node = arena.get(row.terminal())?;
        if !matches!(
            terminal_node.tag(),
            FiberTag::HostComponent | FiberTag::HostText
        ) {
            return Err(
                HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::StaleOrClonedContainerSourceRow {
                    root: currentness.root(),
                    current: currentness.current(),
                    work_in_progress: currentness.work_in_progress(),
                    row,
                    reason: "expected source row is not a HostComponent/HostText fiber",
                },
            );
        }
        if terminal_node.tag() != row.terminal_tag() {
            return Err(
                HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::StaleOrClonedContainerSourceRow {
                    root: currentness.root(),
                    current: currentness.current(),
                    work_in_progress: currentness.work_in_progress(),
                    row,
                    reason: "expected source row tag differs from current fiber tag",
                },
            );
        }
        if terminal_node.state_node() != row.terminal_state_node() {
            return Err(
                HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::StaleOrClonedContainerSourceRow {
                    root: currentness.root(),
                    current: currentness.current(),
                    work_in_progress: currentness.work_in_progress(),
                    row,
                    reason: "expected source row state node differs from current fiber state node",
                },
            );
        }
        if !has_ancestor_for_canary(arena, currentness.work_in_progress(), row.terminal())? {
            return Err(
                HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::StaleOrClonedContainerSourceRow {
                    root: currentness.root(),
                    current: currentness.current(),
                    work_in_progress: currentness.work_in_progress(),
                    row,
                    reason: "expected source row is not inside HostRoot work-in-progress subtree",
                },
            );
        }
    }

    let order_matches = expected_rows.len() == actual_rows.len()
        && actual_rows
            .iter()
            .zip(expected_rows.iter())
            .all(|(actual, expected)| actual.matches_source_row(*expected));
    if !order_matches {
        return Err(
            HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::TerminalChildOrderMismatch {
                root: currentness.root(),
                work_in_progress: currentness.work_in_progress(),
                expected: expected_rows.to_vec(),
                actual: actual_rows.to_vec(),
            },
        );
    }

    Ok(())
}

pub(crate) fn validate_host_root_container_descendant_private_scope_for_canary(
    record: &HostRootContainerDescendantCollectionCompleteWorkRecordForCanary,
) -> Result<(), HostRootContainerDescendantCollectionCompleteWorkErrorForCanary> {
    if record.append_child_to_container_child_set_called() {
        return Err(
            HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::MutationClaimed {
                root: record.root(),
                claim:
                    HostRootContainerDescendantMutationClaimForCanary::AppendChildToContainerChildSet,
            },
        );
    }
    if record.container_child_set_mutation_performed() {
        return Err(
            HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::MutationClaimed {
                root: record.root(),
                claim: HostRootContainerDescendantMutationClaimForCanary::ContainerChildSetMutation,
            },
        );
    }
    if record.host_child_mutation_performed() {
        return Err(
            HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::MutationClaimed {
                root: record.root(),
                claim: HostRootContainerDescendantMutationClaimForCanary::HostChildMutation,
            },
        );
    }
    if record.public_dom_compatibility_claimed() {
        return Err(
            HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::ScopeClaimed {
                root: record.root(),
                claim: HostRootContainerDescendantScopeClaimForCanary::PublicDom,
            },
        );
    }
    if record.test_renderer_compatibility_claimed() {
        return Err(
            HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::ScopeClaimed {
                root: record.root(),
                claim: HostRootContainerDescendantScopeClaimForCanary::TestRenderer,
            },
        );
    }
    if record.persistence_container_child_set_compatibility_claimed() {
        return Err(
            HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::ScopeClaimed {
                root: record.root(),
                claim: HostRootContainerDescendantScopeClaimForCanary::PersistenceContainerChildSet,
            },
        );
    }
    if record.public_root_behavior_claimed() {
        return Err(
            HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::ScopeClaimed {
                root: record.root(),
                claim: HostRootContainerDescendantScopeClaimForCanary::PublicRootBehavior,
            },
        );
    }
    if record.renderer_compatibility_claimed() {
        return Err(
            HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::ScopeClaimed {
                root: record.root(),
                claim: HostRootContainerDescendantScopeClaimForCanary::RendererCompatibility,
            },
        );
    }
    if record.package_compatibility_claimed() {
        return Err(
            HostRootContainerDescendantCollectionCompleteWorkErrorForCanary::ScopeClaimed {
                root: record.root(),
                claim: HostRootContainerDescendantScopeClaimForCanary::PackageCompatibility,
            },
        );
    }
    Ok(())
}
