use super::*;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostRootOneLevelChildSetCompletionRecord {
    host_root: FiberId,
    child_count: usize,
    first_child: FiberId,
    first_child_tag: FiberTag,
    last_child: FiberId,
    last_child_tag: FiberTag,
    child_lanes: Lanes,
    subtree_flags: FiberFlags,
}

impl HostRootOneLevelChildSetCompletionRecord {
    #[must_use]
    pub const fn host_root(self) -> FiberId {
        self.host_root
    }

    #[must_use]
    pub const fn child_count(self) -> usize {
        self.child_count
    }

    #[must_use]
    pub const fn first_child(self) -> FiberId {
        self.first_child
    }

    #[must_use]
    pub const fn first_child_tag(self) -> FiberTag {
        self.first_child_tag
    }

    #[must_use]
    pub const fn last_child(self) -> FiberId {
        self.last_child
    }

    #[must_use]
    pub const fn last_child_tag(self) -> FiberTag {
        self.last_child_tag
    }

    #[must_use]
    pub const fn child_lanes(self) -> Lanes {
        self.child_lanes
    }

    #[must_use]
    pub const fn subtree_flags(self) -> FiberFlags {
        self.subtree_flags
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum HostRootOneLevelChildSetCompletionError {
    FiberTopology(FiberTopologyError),
    UnexpectedHostRootTag {
        fiber: FiberId,
        tag: FiberTag,
    },
    ChildCountMismatch {
        host_root: FiberId,
        expected: usize,
        actual: usize,
    },
    MissingFirstChild {
        host_root: FiberId,
    },
    UnsupportedChildTag {
        host_root: FiberId,
        child: FiberId,
        tag: FiberTag,
    },
}

impl Display for HostRootOneLevelChildSetCompletionError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::UnexpectedHostRootTag { fiber, tag } => write!(
                formatter,
                "fiber {} must be HostRoot for private one-level child-set completion, found {:?}",
                fiber.slot().get(),
                tag
            ),
            Self::ChildCountMismatch {
                host_root,
                expected,
                actual,
            } => write!(
                formatter,
                "HostRoot fiber {} expected {expected} one-level host children during private completion, found {actual}",
                host_root.slot().get()
            ),
            Self::MissingFirstChild { host_root } => write!(
                formatter,
                "HostRoot fiber {} has no child for private one-level child-set completion",
                host_root.slot().get()
            ),
            Self::UnsupportedChildTag {
                host_root,
                child,
                tag,
            } => write!(
                formatter,
                "HostRoot fiber {} child {} has unsupported one-level completion tag {:?}; only HostComponent and HostText children are admitted",
                host_root.slot().get(),
                child.slot().get(),
                tag
            ),
        }
    }
}

impl Error for HostRootOneLevelChildSetCompletionError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberTopology(error) => Some(error),
            Self::UnexpectedHostRootTag { .. }
            | Self::ChildCountMismatch { .. }
            | Self::MissingFirstChild { .. }
            | Self::UnsupportedChildTag { .. } => None,
        }
    }
}

impl From<FiberTopologyError> for HostRootOneLevelChildSetCompletionError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

pub(crate) fn complete_host_root_one_level_child_set_for_test(
    arena: &mut FiberArena,
    host_root: FiberId,
    expected_child_count: usize,
) -> Result<HostRootOneLevelChildSetCompletionRecord, HostRootOneLevelChildSetCompletionError> {
    let tag = arena.get(host_root)?.tag();
    if tag != FiberTag::HostRoot {
        return Err(
            HostRootOneLevelChildSetCompletionError::UnexpectedHostRootTag {
                fiber: host_root,
                tag,
            },
        );
    }

    let children = arena.child_ids(host_root)?;
    if children.len() != expected_child_count {
        return Err(
            HostRootOneLevelChildSetCompletionError::ChildCountMismatch {
                host_root,
                expected: expected_child_count,
                actual: children.len(),
            },
        );
    }

    let first_child = *children
        .first()
        .ok_or(HostRootOneLevelChildSetCompletionError::MissingFirstChild { host_root })?;
    let last_child = *children
        .last()
        .expect("first child was already required for HostRoot completion");
    let mut first_child_tag = None;
    let mut last_child_tag = None;

    for (index, child) in children.iter().copied().enumerate() {
        let tag = arena.get(child)?.tag();
        if !matches!(tag, FiberTag::HostComponent | FiberTag::HostText) {
            return Err(
                HostRootOneLevelChildSetCompletionError::UnsupportedChildTag {
                    host_root,
                    child,
                    tag,
                },
            );
        }
        if index == 0 {
            first_child_tag = Some(tag);
        }
        if index + 1 == children.len() {
            last_child_tag = Some(tag);
        }
    }

    let bubbled = bubble_properties(arena, host_root)?;
    let node = arena.get_mut(host_root)?;
    node.set_child_lanes(bubbled.child_lanes());
    node.set_subtree_flags(bubbled.subtree_flags());

    Ok(HostRootOneLevelChildSetCompletionRecord {
        host_root,
        child_count: children.len(),
        first_child,
        first_child_tag: first_child_tag.expect("first child tag was captured during validation"),
        last_child,
        last_child_tag: last_child_tag.expect("last child tag was captured during validation"),
        child_lanes: bubbled.child_lanes(),
        subtree_flags: bubbled.subtree_flags(),
    })
}
