use fast_react_core::{FiberFlags, FiberTag, StateNodeHandle};
use fast_react_host_config::{
    HostCommit, HostFiberTokenPhase, HostFiberTokenRef, HostFiberTokenTarget,
};

use crate::FiberRootStore;
use crate::host_nodes::{
    HostNodePropertyUpdate, HostNodePropertyUpdateExecution, HostNodeScope,
    HostNodeUpdateCurrentness,
};
use crate::root_commit::HostRootMutationApplyRecord;
use crate::test_support::{FakeHostFiberToken, RecordingHost};

use super::{
    DetachedHostRecords, HostComponentUpdatePayload, HostWorkError,
    TestHostComponentPropertyPayloadKind, TestHostComponentPropertyPayloadRow,
    TestHostComponentPropertyPayloadViolation, TestHostRootMutationApplyStatus,
    TestHostRootMutationHostCall, TestHostRootPrivateStoreMutation, issue_commit_host_token,
};

pub(super) fn validate_test_host_component_property_update_payload(
    store: &FiberRootStore<RecordingHost>,
    mutation: HostRootMutationApplyRecord,
    payload: &HostComponentUpdatePayload,
    detached_hosts: &DetachedHostRecords,
) -> Result<HostNodeScope, HostWorkError> {
    let row = payload.property_row();
    if payload.root() != mutation.root() {
        return Err(invalid_component_property_payload(
            mutation,
            row,
            TestHostComponentPropertyPayloadViolation::WrongRoot,
        ));
    }
    if payload.work_in_progress() != mutation.fiber() {
        return Err(invalid_component_property_payload(
            mutation,
            row,
            TestHostComponentPropertyPayloadViolation::WrongFiber,
        ));
    }
    if Some(payload.current()) != mutation.alternate_fiber() {
        return Err(invalid_component_property_payload(
            mutation,
            row,
            TestHostComponentPropertyPayloadViolation::WrongAlternateFiber,
        ));
    }
    if payload.state_node() != mutation.state_node() {
        return Err(invalid_component_property_payload(
            mutation,
            row,
            TestHostComponentPropertyPayloadViolation::WrongStateNode,
        ));
    }
    if payload.new_props() != mutation.pending_props() {
        return Err(invalid_component_property_payload(
            mutation,
            row,
            TestHostComponentPropertyPayloadViolation::WrongPendingProps,
        ));
    }
    if payload.new_props() != mutation.memoized_props() {
        return Err(invalid_component_property_payload(
            mutation,
            row,
            TestHostComponentPropertyPayloadViolation::WrongMemoizedProps,
        ));
    }
    if Some(payload.old_props()) != mutation.alternate_memoized_props() {
        return Err(invalid_component_property_payload(
            mutation,
            row,
            TestHostComponentPropertyPayloadViolation::WrongAlternateMemoizedProps,
        ));
    }
    if row.old_props() != payload.old_props() || row.new_props() != payload.new_props() {
        return Err(invalid_component_property_payload(
            mutation,
            row,
            TestHostComponentPropertyPayloadViolation::WrongPayloadRowProps,
        ));
    }

    match row.kind() {
        TestHostComponentPropertyPayloadKind::SafeTestProperty
        | TestHostComponentPropertyPayloadKind::Style
        | TestHostComponentPropertyPayloadKind::DangerousHtml => {}
        TestHostComponentPropertyPayloadKind::TextContent => {
            if host_component_payload_conflicts_with_text_update(store, payload, detached_hosts)? {
                return Err(invalid_component_property_payload(
                    mutation,
                    row,
                    TestHostComponentPropertyPayloadViolation::ConflictingTextUpdate,
                ));
            }
        }
    }

    debug_assert!(row.kind().is_supported_for_private_execution());
    let scope = detached_hosts.validated_scope(
        store.host_tokens(),
        mutation.state_node(),
        mutation.root(),
        payload.current(),
        HostFiberTokenTarget::Instance,
    )?;
    detached_hosts
        .nodes
        .instance(mutation.state_node(), scope)?;
    Ok(scope)
}

fn host_component_payload_conflicts_with_text_update(
    store: &FiberRootStore<RecordingHost>,
    payload: &HostComponentUpdatePayload,
    detached_hosts: &DetachedHostRecords,
) -> Result<bool, HostWorkError> {
    if !payload.property_row().kind().affects_text_content() {
        return Ok(false);
    }

    let mut stack = store.fiber_arena().child_ids(payload.work_in_progress())?;
    while let Some(fiber) = stack.pop() {
        let node = store.fiber_arena().get(fiber)?;
        if node.tag() == FiberTag::HostText
            && node.flags().contains_all(FiberFlags::UPDATE)
            && detached_hosts.text_updates.iter().any(|text_payload| {
                text_payload.work_in_progress() == fiber
                    && text_payload.state_node() == node.state_node()
                    && Some(text_payload.current()) == node.alternate()
            })
        {
            return Ok(true);
        }

        let children = store.fiber_arena().child_ids(fiber)?;
        stack.extend(children.iter().rev().copied());
    }

    Ok(false)
}

fn invalid_component_property_payload(
    mutation: HostRootMutationApplyRecord,
    row: TestHostComponentPropertyPayloadRow,
    violation: TestHostComponentPropertyPayloadViolation,
) -> HostWorkError {
    HostWorkError::InvalidHostComponentPropertyUpdatePayload {
        root: mutation.root(),
        fiber: mutation.fiber(),
        prop_name: row.prop_name(),
        violation,
    }
}

pub(super) fn apply_test_host_component_update_record(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    mutation: HostRootMutationApplyRecord,
    detached_hosts: &mut DetachedHostRecords,
) -> Result<TestHostRootMutationApplyStatus, HostWorkError> {
    detached_hosts.ensure_host_update_not_consumed(mutation)?;
    let Some(payload) = detached_hosts.component_update_payload(mutation) else {
        return Ok(TestHostRootMutationApplyStatus::RecordedOnly);
    };
    let scope = validate_test_host_component_property_update_payload(
        store,
        mutation,
        &payload,
        detached_hosts,
    )?;
    if should_commit_component_property_payload_to_private_host_store_only(
        payload.property_row().kind(),
    ) {
        let commit = detached_hosts
            .nodes
            .commit_instance_property_update_to_private_store(
                mutation.state_node(),
                scope,
                host_node_property_update_for_component_payload(
                    &payload,
                    mutation.state_node(),
                    scope,
                    HostNodePropertyUpdateExecution::CommitUpdate,
                ),
            )?;
        debug_assert!(commit.private_host_store_only());
        debug_assert!(!commit.public_dom_compatibility_claimed());
        detached_hosts.mark_host_update_consumed(mutation);
        return Ok(TestHostRootMutationApplyStatus::PrivateHostStoreOnly(
            TestHostRootPrivateStoreMutation::HostComponentPropertyAndLatestProps,
        ));
    }
    let host_call = apply_test_host_component_property_payload_host_call(
        store,
        host,
        mutation,
        &payload,
        scope,
        detached_hosts,
    )?;
    detached_hosts.nodes.apply_instance_property_update(
        mutation.state_node(),
        scope,
        host_node_property_update_for_component_payload(
            &payload,
            mutation.state_node(),
            scope,
            host_node_property_update_execution_for_host_call(host_call),
        ),
    )?;
    detached_hosts.mark_host_update_consumed(mutation);
    Ok(TestHostRootMutationApplyStatus::Applied(host_call))
}

const fn should_commit_component_property_payload_to_private_host_store_only(
    kind: TestHostComponentPropertyPayloadKind,
) -> bool {
    matches!(kind, TestHostComponentPropertyPayloadKind::Style)
}

fn host_node_property_update_for_component_payload(
    payload: &HostComponentUpdatePayload,
    handle: StateNodeHandle,
    scope: HostNodeScope,
    execution: HostNodePropertyUpdateExecution,
) -> HostNodePropertyUpdate {
    HostNodePropertyUpdate::new(
        payload.property_row().prop_name(),
        payload.property_row().property_name(),
        payload.old_props(),
        payload.new_props(),
    )
    .with_payload_kind(payload.property_row().kind().as_str())
    .with_execution(execution)
    .with_currentness(HostNodeUpdateCurrentness::for_scope(
        handle,
        scope,
        HostFiberTokenTarget::Instance,
    ))
}

fn apply_test_host_component_property_payload_host_call(
    store: &mut FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    mutation: HostRootMutationApplyRecord,
    payload: &HostComponentUpdatePayload,
    scope: HostNodeScope,
    detached_hosts: &mut DetachedHostRecords,
) -> Result<TestHostRootMutationHostCall, HostWorkError> {
    match payload.property_row().kind() {
        TestHostComponentPropertyPayloadKind::SafeTestProperty
        | TestHostComponentPropertyPayloadKind::DangerousHtml => {
            let token = issue_commit_host_token(
                store,
                mutation.root(),
                mutation.fiber(),
                HostFiberTokenTarget::Instance,
            )?;
            let fake_token = FakeHostFiberToken(token.raw());
            let instance = detached_hosts
                .nodes
                .instance_mut(mutation.state_node(), scope)?;
            host.commit_update(
                HostFiberTokenRef::new(
                    &fake_token,
                    HostFiberTokenPhase::Commit,
                    HostFiberTokenTarget::Instance,
                ),
                instance,
                (),
                &payload.ty(),
                &(),
                &(),
            )?;
            Ok(TestHostRootMutationHostCall::CommitUpdate)
        }
        TestHostComponentPropertyPayloadKind::Style => {
            unreachable!("style payloads use the private host-store commit path")
        }
        TestHostComponentPropertyPayloadKind::TextContent => {
            let instance = detached_hosts
                .nodes
                .instance_mut(mutation.state_node(), scope)?;
            host.reset_text_content(instance)?;
            Ok(TestHostRootMutationHostCall::ResetTextContent)
        }
    }
}

const fn host_node_property_update_execution_for_host_call(
    host_call: TestHostRootMutationHostCall,
) -> HostNodePropertyUpdateExecution {
    match host_call {
        TestHostRootMutationHostCall::ResetTextContent => {
            HostNodePropertyUpdateExecution::ResetTextContent
        }
        TestHostRootMutationHostCall::AppendChild
        | TestHostRootMutationHostCall::AppendChildToContainer
        | TestHostRootMutationHostCall::InsertBefore
        | TestHostRootMutationHostCall::InsertInContainerBefore
        | TestHostRootMutationHostCall::RemoveChild
        | TestHostRootMutationHostCall::RemoveChildFromContainer
        | TestHostRootMutationHostCall::CommitUpdate
        | TestHostRootMutationHostCall::CommitTextUpdate => {
            HostNodePropertyUpdateExecution::CommitUpdate
        }
    }
}

pub(super) fn apply_test_host_text_update_record(
    store: &FiberRootStore<RecordingHost>,
    host: &mut RecordingHost,
    mutation: HostRootMutationApplyRecord,
    detached_hosts: &mut DetachedHostRecords,
) -> Result<TestHostRootMutationApplyStatus, HostWorkError> {
    detached_hosts.ensure_host_update_not_consumed(mutation)?;
    let Some(payload) = detached_hosts.text_update_payload(mutation) else {
        return Ok(TestHostRootMutationApplyStatus::RecordedOnly);
    };
    if payload.old_text() == payload.new_text() {
        return Err(HostWorkError::UnchangedHostTextUpdatePayload {
            root: mutation.root(),
            current: payload.current(),
            work_in_progress: payload.work_in_progress(),
            state_node: payload.state_node(),
        });
    }

    let scope = detached_hosts.validated_text_update_execution_scope(
        store.host_tokens(),
        mutation.state_node(),
        mutation.root(),
        payload.current(),
    )?;
    let old_text = payload.old_text().to_owned();
    let new_text = payload.new_text().to_owned();
    let update = detached_hosts.preflight_test_host_text_record_update(
        mutation.state_node(),
        scope,
        &old_text,
        &new_text,
        payload.source_currentness(),
    )?;
    {
        let text = detached_hosts
            .nodes
            .text_mut(mutation.state_node(), scope)?;
        host.commit_text_update(text, &old_text, &new_text)?;
    }
    detached_hosts.commit_preflighted_test_host_text_record(
        mutation.state_node(),
        scope,
        update,
    )?;
    detached_hosts.mark_host_update_consumed(mutation);
    Ok(TestHostRootMutationApplyStatus::Applied(
        TestHostRootMutationHostCall::CommitTextUpdate,
    ))
}
