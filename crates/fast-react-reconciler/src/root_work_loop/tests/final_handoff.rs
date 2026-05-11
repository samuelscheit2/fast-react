use super::*;

#[test]
fn root_work_loop_context_handoff_preserves_unsupported_child_preflight() {
    let cases = [
        (
            FiberTag::Suspense,
            Some(SUSPENSE_UNSUPPORTED_FEATURE),
            Lanes::from(Lane::RETRY_1),
        ),
        (
            FiberTag::Offscreen,
            Some(OFFSCREEN_UNSUPPORTED_FEATURE),
            Lanes::OFFSCREEN,
        ),
        (
            FiberTag::Activity,
            Some(ACTIVITY_UNSUPPORTED_FEATURE),
            Lanes::from(Lane::RETRY_2),
        ),
        (
            FiberTag::ViewTransition,
            Some(VIEW_TRANSITION_UNSUPPORTED_FEATURE),
            Lanes::DEFAULT,
        ),
        (FiberTag::Portal, None, Lanes::DEFAULT),
    ];

    for (index, (tag, feature, render_lanes)) in cases.into_iter().enumerate() {
        let raw = index as u64;
        let (mut store, root_id, host) = root_store();
        let current = store.root(root_id).unwrap().current();
        update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(1_100 + raw),
            None,
        )
        .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let (child, descendant) = match tag {
            FiberTag::Portal => {
                let (portal, portal_child) =
                    attach_portal_wip_child(&mut store, render.work_in_progress());
                (portal, Some(portal_child))
            }
            _ => (
                attach_wip_child_with_tag(&mut store, render.work_in_progress(), tag),
                None,
            ),
        };
        let context_store = FunctionComponentContextRenderStore::new();
        let registry = TestFunctionComponentRegistry::default();

        match tag {
            FiberTag::Portal => {
                let error = validate_host_root_child_preflight(
                    &store,
                    root_id,
                    render.work_in_progress(),
                    render_lanes,
                )
                .unwrap_err();
                let portal_record = match error {
                    HostRootChildBeginWorkPreflightError::UnsupportedPortal {
                        root,
                        host_root_work_in_progress,
                        portal,
                    } => {
                        assert_eq!(root, root_id);
                        assert_eq!(host_root_work_in_progress, render.work_in_progress());
                        portal
                    }
                    other => panic!("expected portal preflight diagnostic, got {other:?}"),
                };
                assert_eq!(portal_record.fiber(), child);
                assert_eq!(portal_record.render_lanes(), render_lanes);
                assert_eq!(
                    portal_record.feature(),
                    PORTAL_RECONCILER_UNSUPPORTED_FEATURE
                );
            }
            _ => {
                let error = validate_host_root_child_preflight(
                    &store,
                    root_id,
                    render.work_in_progress(),
                    render_lanes,
                )
                .unwrap_err();
                assert_root_child_preflight_blocks_unsupported_tag(
                    error,
                    root_id,
                    render.work_in_progress(),
                    child,
                    tag,
                    feature.unwrap(),
                    render_lanes,
                );
            }
        }

        assert!(registry.calls().is_empty());
        assert!(context_store.context_reads().is_empty());
        assert_client_root_fail_closed_without_side_effects(
            &store, &host, root_id, current, render, child,
        );
        if let Some(descendant) = descendant {
            let descendant_node = store.fiber_arena().get(descendant).unwrap();
            assert_eq!(descendant_node.return_fiber(), Some(child));
            assert_eq!(descendant_node.lanes(), Lanes::NO);
            assert_eq!(descendant_node.flags(), FiberFlags::NO);
        }
    }
}

#[test]
fn root_work_loop_complete_work_handoff_requires_completed_render() {
    let (mut store, root_id, mut host) = root_store();
    let mut source = TestHostTree::new();
    let element = source.insert_text("blocked");
    update_container(&mut store, root_id, element, None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
    store
        .root_mut(root_id)
        .unwrap()
        .scheduling_mut()
        .clear_render_phase_work();

    let error = handoff_completed_host_root_render_to_test_complete_work(
        &mut store, &mut host, render, &source,
    )
    .unwrap_err();

    assert_eq!(
        error,
        HostRootCompleteWorkHandoffError::RenderPhaseWorkMismatch {
            root: root_id,
            expected: None,
            actual: render.work_in_progress(),
        }
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
    assert_eq!(
        store
            .fiber_arena()
            .get(render.work_in_progress())
            .unwrap()
            .child(),
        None
    );
}

#[test]
fn root_work_loop_complete_work_handoff_fails_closed_for_missing_test_source() {
    let (mut store, root_id, mut host) = root_store();
    let source = TestHostTree::new();
    let element = RootElementHandle::from_raw(404);
    update_container(&mut store, root_id, element, None).unwrap();
    let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

    let error = handoff_completed_host_root_render_to_test_complete_work(
        &mut store, &mut host, render, &source,
    )
    .unwrap_err();

    assert_eq!(
        error,
        HostRootCompleteWorkHandoffError::HostWork(HostWorkError::MissingTestRootElement {
            handle: element,
        })
    );
    assert_eq!(host.operations(), Vec::<&'static str>::new());
    assert_eq!(
        store
            .fiber_arena()
            .get(render.work_in_progress())
            .unwrap()
            .child(),
        None
    );
}

#[test]
fn root_work_loop_render_phase_does_not_commit_mutate_host_or_switch_current() {
    let (mut store, root_id, host) = root_store();
    let current = store.root(root_id).unwrap().current();
    update_container(&mut store, root_id, RootElementHandle::from_raw(99), None).unwrap();

    let record = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();

    assert_eq!(host.operations(), Vec::<&'static str>::new());
    assert_eq!(store.root(root_id).unwrap().current(), current);
    assert_eq!(store.root(root_id).unwrap().finished_work(), None);
    assert_eq!(store.root(root_id).unwrap().finished_lanes(), Lanes::NO);
    assert_eq!(
        store.root(root_id).unwrap().scheduling().work_in_progress(),
        Some(record.work_in_progress())
    );
    assert_eq!(
        store
            .root(root_id)
            .unwrap()
            .scheduling()
            .work_in_progress_root_render_lanes(),
        Lanes::DEFAULT
    );
    assert_eq!(
        store
            .root(root_id)
            .unwrap()
            .scheduling()
            .render_exit_status(),
        RootRenderExitStatus::Completed
    );
}
