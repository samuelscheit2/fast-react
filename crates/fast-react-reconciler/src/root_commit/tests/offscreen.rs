use super::helpers::*;
use super::*;

#[test]
fn root_commit_offscreen_reveal_complete_metadata_handoff_records_private_commit_proof() {
    let (mut store, root_id, host) = root_store();
    let fixture = prepare_offscreen_reveal_commit_fixture(
        &mut store,
        root_id,
        RootElementHandle::from_raw(8_610),
        true,
        Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN),
        FiberTag::HostComponent,
    );

    let handoff = commit_offscreen_reveal_complete_metadata_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        fixture.reveal_metadata.clone(),
        2,
    )
    .unwrap();

    assert_eq!(handoff.pending(), fixture.pending);
    assert_eq!(handoff.reveal_metadata(), &fixture.reveal_metadata);
    assert_eq!(handoff.commit_order(), 2);
    assert_eq!(handoff.finished_work_handoff().commit_order(), 2);
    assert_eq!(
        handoff.current_after_commit(),
        fixture.render.finished_work()
    );
    assert!(handoff.consumed_finished_work_record());
    assert!(handoff.complete_metadata_matches_commit());
    assert!(handoff.visibility_commit_work_blocked());
    assert!(handoff.passive_visibility_effects_deferred());
    assert!(handoff.public_compatibility_blocked());
    assert!(handoff.public_passive_compatibility_blocked());
    assert_eq!(handoff.commit().root(), root_id);
    assert_eq!(
        handoff.commit().previous_current(),
        fixture.render.current()
    );
    assert_eq!(
        handoff.commit().finished_work(),
        fixture.render.finished_work()
    );
    assert_eq!(
        handoff.commit().finished_lanes(),
        Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN)
    );
    assert!(handoff.commit().mutation_log().is_empty());
    assert!(handoff.commit().mutation_apply_log().is_empty());

    let request = handoff.execution_request();
    assert_eq!(request.root(), root_id);
    assert_eq!(request.root_token(), root_id.state_node_handle());
    assert_eq!(request.previous_current(), fixture.render.current());
    assert_eq!(request.finished_work(), fixture.render.finished_work());
    assert_eq!(
        request.render_lanes(),
        Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN)
    );
    assert_eq!(request.pending_lanes_before_commit(), Lanes::DEFAULT);
    assert_eq!(request.source_handoff_order(), 1);
    assert_eq!(request.request_order(), 2);
    assert_eq!(request.hidden_update_lane(), Lane::DEFAULT);
    assert_eq!(request.hidden_update_count(), 1);
    assert_eq!(request.offscreen(), fixture.offscreen);
    assert_eq!(request.child(), fixture.child);
    assert_eq!(request.child_tag(), FiberTag::HostComponent);
    assert_eq!(request.committed_lanes(), request.render_lanes());
    assert_eq!(
        request.status(),
        HostRootOffscreenRevealCommitExecutionStatusForCanary::ValidatedForCommitHandoff
    );
    assert!(request.execution_requested());
    assert_eq!(
        request.blockers(),
        &HOST_ROOT_OFFSCREEN_REVEAL_COMMIT_EXECUTION_BLOCKERS
    );
    assert!(request.committed_lanes_match_render());
    assert!(request.offscreen_lane_metadata_recorded());
    assert!(request.hidden_to_visible_reveal());
    assert!(request.host_visibility_mutation_blocked());
    assert!(request.passive_visibility_effects_blocked());
    assert!(request.passive_visibility_effects_deferred());
    assert!(request.newly_visible_suspensey_commit_traversal_blocked());
    assert!(request.would_accumulate_newly_visible_suspensey_commit());
    assert!(request.public_offscreen_compatibility_blocked());
    assert!(request.public_activity_compatibility_blocked());
    assert!(request.public_root_rendering_blocked());
    assert!(request.public_compatibility_claim_blocked());
    assert!(request.public_passive_compatibility_blocked());
    assert_eq!(
        request.actual_candidate_subtree_flags(),
        fixture.reveal_metadata.candidate_subtree_flags()
    );
    assert!(
        request
            .actual_child_flags()
            .contains_all(FiberFlags::PLACEMENT | FiberFlags::MAY_SUSPEND_COMMIT)
    );
    assert_eq!(request.actual_child_subtree_flags(), FiberFlags::NO);
    assert_eq!(
        fixture.reveal_metadata.transition().previous(),
        fixture.previous_offscreen
    );
    assert_eq!(
        store
            .update_queues()
            .update(fixture.hidden_update)
            .unwrap()
            .lane(),
        Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN)
    );
    assert_eq!(
        store.root(root_id).unwrap().current(),
        fixture.render.finished_work()
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_offscreen_hidden_update_is_deferred_then_revealed_with_lane_metadata() {
    let (mut store, root_id, host) = root_store();
    let fixture = prepare_offscreen_reveal_commit_fixture(
        &mut store,
        root_id,
        RootElementHandle::from_raw(8_615),
        true,
        Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN),
        FiberTag::HostText,
    );
    let before_commit_callbacks = store
        .update_queues()
        .peek_root_update_callback_records(fixture.render.work_in_progress_update_queue())
        .unwrap();

    assert!(before_commit_callbacks.visible().is_empty());
    assert_eq!(
        callback_handles(before_commit_callbacks.hidden()),
        vec![fixture.hidden_callback]
    );
    assert!(before_commit_callbacks.deferred_hidden().is_empty());
    assert_eq!(
        before_commit_callbacks.hidden()[0].update(),
        fixture.hidden_update
    );
    assert_eq!(
        before_commit_callbacks.hidden()[0].visibility(),
        RootUpdateCallbackVisibility::Hidden
    );

    let handoff = commit_offscreen_reveal_complete_metadata_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        fixture.reveal_metadata.clone(),
        3,
    )
    .unwrap();

    assert!(handoff.proves_hidden_update_deferred_and_revealed_through_commit_metadata());
    assert!(handoff.deferred_hidden_update_callbacks_match_reveal_metadata());
    assert!(handoff.complete_metadata_matches_commit());
    assert_eq!(handoff.commit_order(), 3);

    let request = handoff.execution_request();
    assert_eq!(request.hidden_update_lane(), Lane::DEFAULT);
    assert_eq!(request.hidden_update_count(), 1);
    assert!(request.offscreen_lane_metadata_recorded());
    assert!(request.hidden_to_visible_reveal());
    assert_eq!(
        request.render_lanes(),
        Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN)
    );
    assert_eq!(request.committed_lanes(), request.render_lanes());
    assert!(request.committed_lanes_match_render());

    let callbacks = handoff.commit().root_update_callbacks();
    assert!(callbacks.visible().is_empty());
    assert!(callbacks.hidden().is_empty());
    assert_eq!(
        callback_handles(callbacks.deferred_hidden()),
        vec![fixture.hidden_callback]
    );
    assert_eq!(
        callbacks.deferred_hidden()[0].update(),
        fixture.hidden_update
    );
    assert_eq!(
        callbacks.deferred_hidden()[0].visibility(),
        RootUpdateCallbackVisibility::DeferredHidden
    );

    let diagnostics = handoff
        .commit()
        .root_update_callback_drain_snapshot_for_canary(
            &store,
            handoff.commit_order(),
            request.render_lanes(),
        )
        .unwrap();

    assert_eq!(diagnostics.root(), root_id);
    assert_eq!(diagnostics.commit_order(), handoff.commit_order());
    assert_eq!(diagnostics.render_lanes(), request.render_lanes());
    assert_eq!(diagnostics.finished_lanes(), request.render_lanes());
    assert_eq!(diagnostics.pending_lanes_after_commit(), Lanes::NO);
    assert_eq!(diagnostics.len(), 1);
    assert_eq!(diagnostics.visible_callback_count(), 0);
    assert_eq!(diagnostics.hidden_callback_count(), 1);
    assert!(diagnostics.records_match_commit_lanes());
    assert!(diagnostics.hidden_callbacks_deferred_without_invocation());
    assert!(diagnostics.proves_deterministic_lane_order());
    assert!(!diagnostics.public_callbacks_invoked());
    assert!(!diagnostics.public_root_callback_behavior_exposed());

    let record = diagnostics.records()[0];
    assert_eq!(record.update(), fixture.hidden_update);
    assert_eq!(record.callback(), fixture.hidden_callback);
    assert_eq!(
        record.visibility(),
        RootUpdateCallbackVisibility::DeferredHidden
    );
    assert_eq!(
        record.update_lanes(),
        Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN)
    );
    assert_eq!(record.callback_lanes(), Lanes::DEFAULT);
    assert!(record.update_lanes_include_offscreen());
    assert!(record.callback_lanes_match_commit());
    assert!(!record.public_callback_invoked());
    assert!(!record.public_root_callback_behavior_exposed());
    assert_eq!(
        store
            .update_queues()
            .update(fixture.hidden_update)
            .unwrap()
            .lane(),
        Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN)
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_offscreen_reveal_complete_metadata_requires_retained_offscreen_lane() {
    let (mut store, root_id, host) = root_store();
    let fixture = prepare_offscreen_reveal_commit_fixture(
        &mut store,
        root_id,
        RootElementHandle::from_raw(8_620),
        false,
        Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN),
        FiberTag::HostText,
    );
    let previous_current = fixture.render.current();

    let error = commit_offscreen_reveal_complete_metadata_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        fixture.reveal_metadata,
        2,
    )
    .unwrap_err();

    assert_eq!(
        error,
        HostRootOffscreenRevealCommitHandoffErrorForCanary::OffscreenLaneMetadataMissing {
            root: root_id,
            pending_lanes_before_commit: Lanes::DEFAULT,
            render_lanes: Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN),
        }
    );
    assert_eq!(store.root(root_id).unwrap().current(), previous_current);
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(fixture.render.finished_work())
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
#[test]
fn root_commit_offscreen_reveal_complete_metadata_rejects_stale_records_before_switching_current() {
    let (mut store, root_id, host) = root_store();
    let lanes = Lanes::DEFAULT.merge_lane(Lane::OFFSCREEN);
    let fixture = prepare_offscreen_reveal_commit_fixture(
        &mut store,
        root_id,
        RootElementHandle::from_raw(8_630),
        true,
        Lanes::DEFAULT,
        FiberTag::HostComponent,
    );
    let previous_current = fixture.render.current();

    assert_eq!(
        commit_offscreen_reveal_complete_metadata_handoff_for_canary(
            &mut store,
            fixture.render,
            Some(fixture.pending),
            fixture.reveal_metadata,
            2,
        )
        .unwrap_err(),
        HostRootOffscreenRevealCommitHandoffErrorForCanary::RevealCommitLanesMismatch {
            root: root_id,
            expected_render_lanes: lanes,
            expected_finished_lanes: lanes,
            actual_committed_lanes: Lanes::DEFAULT,
        }
    );
    assert_eq!(store.root(root_id).unwrap().current(), previous_current);
    assert_eq!(host.operations(), Vec::<&'static str>::new());

    let (mut store, root_id, host) = root_store();
    let fixture = prepare_offscreen_reveal_commit_fixture(
        &mut store,
        root_id,
        RootElementHandle::from_raw(8_640),
        true,
        lanes,
        FiberTag::HostText,
    );
    let previous_current = fixture.render.current();
    store
        .fiber_arena_mut()
        .get_mut(fixture.child)
        .unwrap()
        .merge_flags(FiberFlags::UPDATE);

    match commit_offscreen_reveal_complete_metadata_handoff_for_canary(
        &mut store,
        fixture.render,
        Some(fixture.pending),
        fixture.reveal_metadata.clone(),
        2,
    )
    .unwrap_err()
    {
        HostRootOffscreenRevealCommitHandoffErrorForCanary::StaleRevealChildFlags {
            offscreen,
            child,
            expected_candidate_subtree_flags,
            actual_candidate_subtree_flags,
        } => {
            assert_eq!(offscreen, fixture.offscreen);
            assert_eq!(child, fixture.child);
            assert_eq!(
                expected_candidate_subtree_flags,
                fixture.reveal_metadata.candidate_subtree_flags()
            );
            assert!(
                actual_candidate_subtree_flags
                    .contains_all(FiberFlags::PLACEMENT | FiberFlags::UPDATE)
            );
        }
        other => panic!("expected stale reveal child flags, got {other:?}"),
    }
    assert_eq!(store.root(root_id).unwrap().current(), previous_current);
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(fixture.render.finished_work())
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
}
