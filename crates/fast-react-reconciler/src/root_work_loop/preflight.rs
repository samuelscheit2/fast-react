#![cfg_attr(
    not(test),
    allow(
        dead_code,
        reason = "private HostRoot child begin-work preflight is reserved until a real fiber traversal consumes it"
    )
)]

use std::error::Error;
use std::fmt::{self, Display, Formatter};

use fast_react_core::{FiberId, FiberTag, FiberTopologyError, Lanes};
use fast_react_host_config::HostTypes;

use crate::{
    FiberRootId, FiberRootStore, FiberRootStoreError,
    begin_work::{
        BeginWorkError, BeginWorkRequest, BeginWorkResult, UnsupportedActivityChildShapeRecord,
        UnsupportedOffscreenChildShapeRecord, UnsupportedPortalBeginWorkRecord,
        UnsupportedSuspenseChildShapeRecord, UnsupportedSuspenseListChildShapeRecord, begin_work,
        unsupported_activity_begin_work_record, unsupported_offscreen_begin_work_record,
        unsupported_portal_begin_work_record, unsupported_suspense_begin_work_record,
        unsupported_suspense_list_begin_work_record,
    },
    function_component::FunctionComponentInvoker,
    unsupported_features::unsupported_reconciler_feature_for_fiber_tag,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostRootChildBeginWorkPreflightRecord {
    root: FiberRootId,
    host_root_work_in_progress: FiberId,
    child: Option<FiberId>,
    child_tag: Option<FiberTag>,
    render_lanes: Lanes,
    begin_work: Option<BeginWorkResult>,
}

impl HostRootChildBeginWorkPreflightRecord {
    #[must_use]
    pub(crate) const fn root(self) -> FiberRootId {
        self.root
    }

    #[must_use]
    pub(crate) const fn host_root_work_in_progress(self) -> FiberId {
        self.host_root_work_in_progress
    }

    #[must_use]
    pub(crate) const fn child(self) -> Option<FiberId> {
        self.child
    }

    #[must_use]
    pub(crate) const fn child_tag(self) -> Option<FiberTag> {
        self.child_tag
    }

    #[must_use]
    pub(crate) const fn render_lanes(self) -> Lanes {
        self.render_lanes
    }

    #[must_use]
    pub(crate) const fn requires_begin_work(self) -> bool {
        self.begin_work.is_some()
    }

    #[must_use]
    pub(crate) const fn begin_work(self) -> Option<BeginWorkResult> {
        self.begin_work
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum HostRootChildBeginWorkPreflightError {
    FiberRootStore(FiberRootStoreError),
    FiberTopology(FiberTopologyError),
    BeginWork(BeginWorkError),
    ExpectedHostRootWorkInProgress {
        fiber: FiberId,
        tag: FiberTag,
    },
    WorkInProgressNotLinkedToRootCurrent {
        root: FiberRootId,
        current: FiberId,
        work_in_progress: FiberId,
        current_alternate: Option<FiberId>,
        work_in_progress_alternate: Option<FiberId>,
    },
    UnsupportedReconcilerFiberFeature {
        fiber: FiberId,
        tag: FiberTag,
        feature: &'static str,
    },
    UnsupportedPortal {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        portal: Box<UnsupportedPortalBeginWorkRecord>,
    },
    UnsupportedSuspenseChildShape {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        suspense: Box<UnsupportedSuspenseChildShapeRecord>,
    },
    UnsupportedOffscreenChildShape {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        offscreen: Box<UnsupportedOffscreenChildShapeRecord>,
    },
    UnsupportedSuspenseListChildShape {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        suspense_list: Box<UnsupportedSuspenseListChildShapeRecord>,
    },
    UnsupportedActivityChildShape {
        root: FiberRootId,
        host_root_work_in_progress: FiberId,
        activity: Box<UnsupportedActivityChildShapeRecord>,
    },
}

impl Display for HostRootChildBeginWorkPreflightError {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        match self {
            Self::FiberRootStore(error) => Display::fmt(error, formatter),
            Self::FiberTopology(error) => Display::fmt(error, formatter),
            Self::BeginWork(error) => Display::fmt(error, formatter),
            Self::ExpectedHostRootWorkInProgress { fiber, tag } => write!(
                formatter,
                "fiber {} must be HostRoot work-in-progress for root child begin-work preflight, found {:?}",
                fiber.slot().get(),
                tag
            ),
            Self::WorkInProgressNotLinkedToRootCurrent {
                root,
                current,
                work_in_progress,
                current_alternate,
                work_in_progress_alternate,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} is not the reciprocal alternate of current {}; current alternate {:?}, work-in-progress alternate {:?}",
                root.raw(),
                work_in_progress.slot().get(),
                current.slot().get(),
                current_alternate.map(|fiber| fiber.slot().get()),
                work_in_progress_alternate.map(|fiber| fiber.slot().get())
            ),
            Self::UnsupportedReconcilerFiberFeature {
                fiber,
                tag,
                feature,
            } => write!(
                formatter,
                "fiber {} has unsupported root work-loop child tag {:?}: {feature}",
                fiber.slot().get(),
                tag
            ),
            Self::UnsupportedPortal {
                root,
                host_root_work_in_progress,
                portal,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} cannot admit portal child {} into root work: {}",
                root.raw(),
                host_root_work_in_progress.slot().get(),
                portal.fiber().slot().get(),
                portal.feature()
            ),
            Self::UnsupportedSuspenseChildShape {
                root,
                host_root_work_in_progress,
                suspense,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} cannot admit Suspense child {} shape {} into root work: {}; thenable {}, ping lane {:?}, retry queue {}, primary blocked {}, fallback blocked {}",
                root.raw(),
                host_root_work_in_progress.slot().get(),
                suspense.fiber().slot().get(),
                suspense.shape().as_str(),
                suspense.feature(),
                suspense
                    .thenable_ping_blocker()
                    .thenable_identity_class()
                    .as_str(),
                suspense.thenable_ping_blocker().ping_lane(),
                suspense.thenable_ping_blocker().retry_queue_kind().as_str(),
                suspense
                    .thenable_ping_blocker()
                    .primary_child_rendering_blocked(),
                suspense
                    .thenable_ping_blocker()
                    .fallback_child_rendering_blocked()
            ),
            Self::UnsupportedOffscreenChildShape {
                root,
                host_root_work_in_progress,
                offscreen,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} cannot admit Offscreen child {} shape {} into root work: {}; thenable {}, ping lane {:?}, retry queue {}, child rendering blocked {}",
                root.raw(),
                host_root_work_in_progress.slot().get(),
                offscreen.fiber().slot().get(),
                offscreen.shape().as_str(),
                offscreen.feature(),
                offscreen
                    .thenable_ping_blocker()
                    .thenable_identity_class()
                    .as_str(),
                offscreen.thenable_ping_blocker().ping_lane(),
                offscreen
                    .thenable_ping_blocker()
                    .retry_queue_kind()
                    .as_str(),
                offscreen
                    .thenable_ping_blocker()
                    .primary_child_rendering_blocked()
            ),
            Self::UnsupportedSuspenseListChildShape {
                root,
                host_root_work_in_progress,
                suspense_list,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} cannot admit SuspenseList child {} shape {} into root work: {}",
                root.raw(),
                host_root_work_in_progress.slot().get(),
                suspense_list.fiber().slot().get(),
                suspense_list.shape().as_str(),
                suspense_list.feature()
            ),
            Self::UnsupportedActivityChildShape {
                root,
                host_root_work_in_progress,
                activity,
            } => write!(
                formatter,
                "root {} HostRoot work-in-progress {} cannot admit Activity child {} shape {} into root work: {}",
                root.raw(),
                host_root_work_in_progress.slot().get(),
                activity.fiber().slot().get(),
                activity.shape().as_str(),
                activity.feature()
            ),
        }
    }
}

impl Error for HostRootChildBeginWorkPreflightError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::FiberRootStore(error) => Some(error),
            Self::FiberTopology(error) => Some(error),
            Self::BeginWork(error) => Some(error),
            Self::ExpectedHostRootWorkInProgress { .. }
            | Self::WorkInProgressNotLinkedToRootCurrent { .. }
            | Self::UnsupportedReconcilerFiberFeature { .. }
            | Self::UnsupportedPortal { .. }
            | Self::UnsupportedSuspenseChildShape { .. }
            | Self::UnsupportedOffscreenChildShape { .. }
            | Self::UnsupportedSuspenseListChildShape { .. }
            | Self::UnsupportedActivityChildShape { .. } => None,
        }
    }
}

impl From<FiberRootStoreError> for HostRootChildBeginWorkPreflightError {
    fn from(error: FiberRootStoreError) -> Self {
        Self::FiberRootStore(error)
    }
}

impl From<FiberTopologyError> for HostRootChildBeginWorkPreflightError {
    fn from(error: FiberTopologyError) -> Self {
        Self::FiberTopology(error)
    }
}

impl From<BeginWorkError> for HostRootChildBeginWorkPreflightError {
    fn from(error: BeginWorkError) -> Self {
        Self::BeginWork(error)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) struct HostRootChildPreflightValidation {
    pub(crate) child: Option<FiberId>,
    pub(crate) child_tag: Option<FiberTag>,
}

pub(crate) fn validate_host_root_child_preflight<H: HostTypes>(
    store: &FiberRootStore<H>,
    root_id: FiberRootId,
    host_root_work_in_progress: FiberId,
    render_lanes: Lanes,
) -> Result<HostRootChildPreflightValidation, HostRootChildBeginWorkPreflightError> {
    let current = store.root(root_id)?.current();
    let current_alternate = store.fiber_arena().get(current)?.alternate();
    let work_node = store.fiber_arena().get(host_root_work_in_progress)?;
    let work_tag = work_node.tag();
    if work_tag != FiberTag::HostRoot {
        return Err(
            HostRootChildBeginWorkPreflightError::ExpectedHostRootWorkInProgress {
                fiber: host_root_work_in_progress,
                tag: work_tag,
            },
        );
    }

    let work_in_progress_alternate = work_node.alternate();
    if current_alternate != Some(host_root_work_in_progress)
        || work_in_progress_alternate != Some(current)
    {
        return Err(
            HostRootChildBeginWorkPreflightError::WorkInProgressNotLinkedToRootCurrent {
                root: root_id,
                current,
                work_in_progress: host_root_work_in_progress,
                current_alternate,
                work_in_progress_alternate,
            },
        );
    }

    let Some(child) = work_node.child() else {
        return Ok(HostRootChildPreflightValidation {
            child: None,
            child_tag: None,
        });
    };

    let child_tag = store.fiber_arena().get(child)?.tag();
    if child_tag == FiberTag::Portal {
        let portal = unsupported_portal_begin_work_record(
            store.fiber_arena(),
            BeginWorkRequest::new(child, render_lanes),
        )?;
        return Err(HostRootChildBeginWorkPreflightError::UnsupportedPortal {
            root: root_id,
            host_root_work_in_progress,
            portal: Box::new(portal),
        });
    }
    if child_tag == FiberTag::Suspense {
        let suspense = unsupported_suspense_begin_work_record(
            store.fiber_arena(),
            BeginWorkRequest::new(child, render_lanes),
        )?;
        return Err(
            HostRootChildBeginWorkPreflightError::UnsupportedSuspenseChildShape {
                root: root_id,
                host_root_work_in_progress,
                suspense: Box::new(suspense),
            },
        );
    }
    if child_tag == FiberTag::Offscreen {
        let offscreen = unsupported_offscreen_begin_work_record(
            store.fiber_arena(),
            BeginWorkRequest::new(child, render_lanes),
        )?;
        return Err(
            HostRootChildBeginWorkPreflightError::UnsupportedOffscreenChildShape {
                root: root_id,
                host_root_work_in_progress,
                offscreen: Box::new(offscreen),
            },
        );
    }
    if child_tag == FiberTag::SuspenseList {
        let suspense_list = unsupported_suspense_list_begin_work_record(
            store.fiber_arena(),
            BeginWorkRequest::new(child, render_lanes),
        )?;
        return Err(
            HostRootChildBeginWorkPreflightError::UnsupportedSuspenseListChildShape {
                root: root_id,
                host_root_work_in_progress,
                suspense_list: Box::new(suspense_list),
            },
        );
    }
    if child_tag == FiberTag::Activity {
        let activity = unsupported_activity_begin_work_record(
            store.fiber_arena(),
            BeginWorkRequest::new(child, render_lanes),
        )?;
        return Err(
            HostRootChildBeginWorkPreflightError::UnsupportedActivityChildShape {
                root: root_id,
                host_root_work_in_progress,
                activity: Box::new(activity),
            },
        );
    }

    if let Some(feature) = unsupported_reconciler_feature_for_fiber_tag(child_tag) {
        return Err(
            HostRootChildBeginWorkPreflightError::UnsupportedReconcilerFiberFeature {
                fiber: child,
                tag: feature.tag(),
                feature: feature.feature(),
            },
        );
    }

    Ok(HostRootChildPreflightValidation {
        child: Some(child),
        child_tag: Some(child_tag),
    })
}

pub(crate) fn preflight_host_root_child_begin_work<H: HostTypes>(
    store: &mut FiberRootStore<H>,
    root_id: FiberRootId,
    host_root_work_in_progress: FiberId,
    render_lanes: Lanes,
    invoker: &mut impl FunctionComponentInvoker,
) -> Result<HostRootChildBeginWorkPreflightRecord, HostRootChildBeginWorkPreflightError> {
    let validated = validate_host_root_child_preflight(
        store,
        root_id,
        host_root_work_in_progress,
        render_lanes,
    )?;
    let Some(child) = validated.child else {
        return Ok(HostRootChildBeginWorkPreflightRecord {
            root: root_id,
            host_root_work_in_progress,
            child: None,
            child_tag: None,
            render_lanes,
            begin_work: None,
        });
    };

    let begin_work = begin_work(
        store.fiber_arena_mut(),
        BeginWorkRequest::new(child, render_lanes),
        invoker,
    )?;

    Ok(HostRootChildBeginWorkPreflightRecord {
        root: root_id,
        host_root_work_in_progress,
        child: Some(child),
        child_tag: validated.child_tag,
        render_lanes,
        begin_work: Some(begin_work),
    })
}
