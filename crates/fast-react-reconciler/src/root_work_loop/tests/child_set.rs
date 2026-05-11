use super::*;

#[test]
fn root_work_loop_one_level_child_set_handoff_fails_closed_for_keyed_or_nested_shapes() {
    let (mut keyed_fragment_store, keyed_fragment_root, mut keyed_fragment_host) = root_store();
    let keyed_fragment_source = TestHostTree::new();
    let keyed_fragment_element = RootElementHandle::from_raw(1_230);
    let keyed_fragment_current = keyed_fragment_store
        .root(keyed_fragment_root)
        .unwrap()
        .current();
    update_container(
        &mut keyed_fragment_store,
        keyed_fragment_root,
        keyed_fragment_element,
        None,
    )
    .unwrap();
    let keyed_fragment_render = render_host_root_for_lanes(
        &mut keyed_fragment_store,
        keyed_fragment_root,
        Lanes::DEFAULT,
    )
    .unwrap();
    let keyed_fragment_set = HostRootOneLevelChildSet::fragment(
        keyed_fragment_element,
        Some(ReactKey::from_normalized("root-fragment")),
        vec![
            HostRootOneLevelChildSetEntry::host(RootElementHandle::from_raw(1_231)),
            HostRootOneLevelChildSetEntry::host(RootElementHandle::from_raw(1_232)),
        ],
    );

    let keyed_fragment_error =
        handoff_completed_host_root_render_to_test_complete_work_for_one_level_child_set(
            &mut keyed_fragment_store,
            &mut keyed_fragment_host,
            keyed_fragment_render,
            &keyed_fragment_source,
            &keyed_fragment_set,
        )
        .unwrap_err();

    assert_eq!(
        keyed_fragment_error,
        HostRootOneLevelChildSetCompleteWorkHandoffError::BeginWork(
            HostRootOneLevelChildSetBeginWorkError::KeyedFragmentUnsupported {
                root_element: keyed_fragment_element,
                key: ReactKey::from_normalized("root-fragment"),
            },
        )
    );
    assert_one_level_child_set_handoff_failed_before_host_work(
        &keyed_fragment_store,
        &keyed_fragment_host,
        keyed_fragment_root,
        keyed_fragment_current,
        keyed_fragment_render,
    );

    let (mut keyed_host_store, keyed_host_root, mut keyed_host_host) = root_store();
    let mut keyed_host_source = TestHostTree::new();
    let keyed_host_element = RootElementHandle::from_raw(1_240);
    let keyed_child = keyed_host_source.insert_text("keyed child");
    let second_child = keyed_host_source.insert_text("plain child");
    let keyed_host_current = keyed_host_store.root(keyed_host_root).unwrap().current();
    update_container(
        &mut keyed_host_store,
        keyed_host_root,
        keyed_host_element,
        None,
    )
    .unwrap();
    let keyed_host_render =
        render_host_root_for_lanes(&mut keyed_host_store, keyed_host_root, Lanes::DEFAULT).unwrap();
    let keyed_host_set = HostRootOneLevelChildSet::array(
        keyed_host_element,
        vec![
            HostRootOneLevelChildSetEntry::keyed_host(
                keyed_child,
                ReactKey::from_normalized("child"),
            ),
            HostRootOneLevelChildSetEntry::host(second_child),
        ],
    );

    let keyed_host_error =
        handoff_completed_host_root_render_to_test_complete_work_for_one_level_child_set(
            &mut keyed_host_store,
            &mut keyed_host_host,
            keyed_host_render,
            &keyed_host_source,
            &keyed_host_set,
        )
        .unwrap_err();

    assert_eq!(
        keyed_host_error,
        HostRootOneLevelChildSetCompleteWorkHandoffError::BeginWork(
            HostRootOneLevelChildSetBeginWorkError::KeyedHostChildUnsupported {
                root_element: keyed_host_element,
                kind: HostRootOneLevelChildSetKind::Array,
                child_index: 0,
                element: keyed_child,
                key: ReactKey::from_normalized("child"),
            },
        )
    );
    assert_one_level_child_set_handoff_failed_before_host_work(
        &keyed_host_store,
        &keyed_host_host,
        keyed_host_root,
        keyed_host_current,
        keyed_host_render,
    );

    let (mut nested_array_store, nested_array_root, mut nested_array_host) = root_store();
    let mut nested_array_source = TestHostTree::new();
    let nested_array_element = RootElementHandle::from_raw(1_250);
    let nested_first = nested_array_source.insert_text("nested first");
    let nested_second = nested_array_source.insert_text("nested second");
    let nested_array_current = nested_array_store
        .root(nested_array_root)
        .unwrap()
        .current();
    update_container(
        &mut nested_array_store,
        nested_array_root,
        nested_array_element,
        None,
    )
    .unwrap();
    let nested_array_render =
        render_host_root_for_lanes(&mut nested_array_store, nested_array_root, Lanes::DEFAULT)
            .unwrap();
    let nested_array_set = HostRootOneLevelChildSet::array(
        nested_array_element,
        vec![
            HostRootOneLevelChildSetEntry::host(nested_first),
            HostRootOneLevelChildSetEntry::nested_array(Some(nested_second)),
        ],
    );

    let nested_array_error =
        handoff_completed_host_root_render_to_test_complete_work_for_one_level_child_set(
            &mut nested_array_store,
            &mut nested_array_host,
            nested_array_render,
            &nested_array_source,
            &nested_array_set,
        )
        .unwrap_err();

    assert_eq!(
        nested_array_error,
        HostRootOneLevelChildSetCompleteWorkHandoffError::BeginWork(
            HostRootOneLevelChildSetBeginWorkError::NestedChildSetUnsupported {
                root_element: nested_array_element,
                kind: HostRootOneLevelChildSetKind::Array,
                child_index: 1,
                nested_kind: HostRootOneLevelChildSetKind::Array,
                first_child: Some(nested_second),
            },
        )
    );
    assert_one_level_child_set_handoff_failed_before_host_work(
        &nested_array_store,
        &nested_array_host,
        nested_array_root,
        nested_array_current,
        nested_array_render,
    );

    let (mut nested_fragment_store, nested_fragment_root, mut nested_fragment_host) = root_store();
    let mut nested_fragment_source = TestHostTree::new();
    let nested_fragment_element = RootElementHandle::from_raw(1_260);
    let fragment_first = nested_fragment_source.insert_text("fragment first");
    let fragment_second = nested_fragment_source.insert_text("fragment second");
    let nested_fragment_current = nested_fragment_store
        .root(nested_fragment_root)
        .unwrap()
        .current();
    update_container(
        &mut nested_fragment_store,
        nested_fragment_root,
        nested_fragment_element,
        None,
    )
    .unwrap();
    let nested_fragment_render = render_host_root_for_lanes(
        &mut nested_fragment_store,
        nested_fragment_root,
        Lanes::DEFAULT,
    )
    .unwrap();
    let nested_fragment_set = HostRootOneLevelChildSet::fragment(
        nested_fragment_element,
        None,
        vec![
            HostRootOneLevelChildSetEntry::nested_fragment(
                Some(ReactKey::from_normalized("nested-fragment")),
                Some(fragment_first),
            ),
            HostRootOneLevelChildSetEntry::host(fragment_second),
        ],
    );

    let nested_fragment_error =
        handoff_completed_host_root_render_to_test_complete_work_for_one_level_child_set(
            &mut nested_fragment_store,
            &mut nested_fragment_host,
            nested_fragment_render,
            &nested_fragment_source,
            &nested_fragment_set,
        )
        .unwrap_err();

    assert_eq!(
        nested_fragment_error,
        HostRootOneLevelChildSetCompleteWorkHandoffError::BeginWork(
            HostRootOneLevelChildSetBeginWorkError::NestedChildSetUnsupported {
                root_element: nested_fragment_element,
                kind: HostRootOneLevelChildSetKind::Fragment,
                child_index: 0,
                nested_kind: HostRootOneLevelChildSetKind::Fragment,
                first_child: Some(fragment_first),
            },
        )
    );
    assert_one_level_child_set_handoff_failed_before_host_work(
        &nested_fragment_store,
        &nested_fragment_host,
        nested_fragment_root,
        nested_fragment_current,
        nested_fragment_render,
    );
}

#[test]
fn root_work_loop_one_level_child_set_handoff_fails_closed_for_mismatch_or_missing_source() {
    let (mut mismatch_store, mismatch_root, mut mismatch_host) = root_store();
    let mut mismatch_source = TestHostTree::new();
    let render_element = RootElementHandle::from_raw(1_270);
    let child_set_element = RootElementHandle::from_raw(1_271);
    let first = mismatch_source.insert_text("mismatch first");
    let second = mismatch_source.insert_text("mismatch second");
    let mismatch_current = mismatch_store.root(mismatch_root).unwrap().current();
    update_container(&mut mismatch_store, mismatch_root, render_element, None).unwrap();
    let mismatch_render =
        render_host_root_for_lanes(&mut mismatch_store, mismatch_root, Lanes::DEFAULT).unwrap();
    let mismatch_set = HostRootOneLevelChildSet::array(
        child_set_element,
        vec![
            HostRootOneLevelChildSetEntry::host(first),
            HostRootOneLevelChildSetEntry::host(second),
        ],
    );

    let mismatch_error =
        handoff_completed_host_root_render_to_test_complete_work_for_one_level_child_set(
            &mut mismatch_store,
            &mut mismatch_host,
            mismatch_render,
            &mismatch_source,
            &mismatch_set,
        )
        .unwrap_err();

    assert_eq!(
        mismatch_error,
        HostRootOneLevelChildSetCompleteWorkHandoffError::RootElementMismatch {
            render_element,
            child_set_element,
        }
    );
    assert_one_level_child_set_handoff_failed_before_host_work(
        &mismatch_store,
        &mismatch_host,
        mismatch_root,
        mismatch_current,
        mismatch_render,
    );

    let (mut missing_store, missing_root, mut missing_host) = root_store();
    let mut missing_source = TestHostTree::new();
    let root_element = RootElementHandle::from_raw(1_280);
    let missing_child = RootElementHandle::from_raw(1_281);
    let present_child = missing_source.insert_text("present child");
    let missing_current = missing_store.root(missing_root).unwrap().current();
    update_container(&mut missing_store, missing_root, root_element, None).unwrap();
    let missing_render =
        render_host_root_for_lanes(&mut missing_store, missing_root, Lanes::DEFAULT).unwrap();
    let missing_set = HostRootOneLevelChildSet::array(
        root_element,
        vec![
            HostRootOneLevelChildSetEntry::host(missing_child),
            HostRootOneLevelChildSetEntry::host(present_child),
        ],
    );

    let missing_error =
        handoff_completed_host_root_render_to_test_complete_work_for_one_level_child_set(
            &mut missing_store,
            &mut missing_host,
            missing_render,
            &missing_source,
            &missing_set,
        )
        .unwrap_err();

    assert_eq!(
        missing_error,
        HostRootOneLevelChildSetCompleteWorkHandoffError::MissingTestRootElement {
            element: missing_child,
        }
    );
    assert_one_level_child_set_handoff_failed_before_host_work(
        &missing_store,
        &missing_host,
        missing_root,
        missing_current,
        missing_render,
    );
}

#[test]
fn root_work_loop_multiple_sibling_handoff_preserves_fragment_portal_suspense_blockers() {
    for (index, tag) in [FiberTag::Fragment, FiberTag::Portal, FiberTag::Suspense]
        .into_iter()
        .enumerate()
    {
        let raw = index as u64;
        let (mut store, root_id, mut host) = root_store();
        let mut source = TestHostTree::new();
        let first_element = source.insert_text(format!("blocked first {raw}"));
        let second_element = source.insert_text(format!("blocked second {raw}"));
        let current = store.root(root_id).unwrap().current();
        update_container(
            &mut store,
            root_id,
            RootElementHandle::from_raw(990 + raw),
            None,
        )
        .unwrap();
        let render = render_host_root_for_lanes(&mut store, root_id, Lanes::DEFAULT).unwrap();
        let blocked_child = match tag {
            FiberTag::Fragment => {
                attach_fragment_wip_child_with_descendant(&mut store, render.work_in_progress()).0
            }
            FiberTag::Portal => attach_portal_wip_child(&mut store, render.work_in_progress()).0,
            FiberTag::Suspense => {
                attach_wip_child_with_tag(&mut store, render.work_in_progress(), tag)
            }
            _ => unreachable!("test only covers explicit blocker tags"),
        };

        let error = handoff_completed_host_root_render_to_test_complete_work_for_siblings(
            &mut store,
            &mut host,
            render,
            &source,
            &[first_element, second_element],
        )
        .unwrap_err();

        match tag {
            FiberTag::Fragment => assert_eq!(
                error,
                HostRootCompleteWorkHandoffError::ExistingRootChildUnsupported {
                    root: root_id,
                    host_root_work_in_progress: render.work_in_progress(),
                    child: blocked_child,
                    tag: FiberTag::Fragment,
                }
            ),
            FiberTag::Portal => match error {
                HostRootCompleteWorkHandoffError::ChildPreflight(error) => match *error {
                    HostRootChildBeginWorkPreflightError::UnsupportedPortal {
                        root,
                        host_root_work_in_progress,
                        portal,
                    } => {
                        assert_eq!(root, root_id);
                        assert_eq!(host_root_work_in_progress, render.work_in_progress());
                        assert_eq!(portal.fiber(), blocked_child);
                        assert_eq!(portal.feature(), PORTAL_RECONCILER_UNSUPPORTED_FEATURE);
                    }
                    other => panic!("expected portal blocker, got {other:?}"),
                },
                other => panic!("expected child preflight blocker, got {other:?}"),
            },
            FiberTag::Suspense => match error {
                HostRootCompleteWorkHandoffError::ChildPreflight(error) => {
                    assert_root_child_preflight_blocks_unsupported_tag(
                        *error,
                        root_id,
                        render.work_in_progress(),
                        blocked_child,
                        FiberTag::Suspense,
                        SUSPENSE_UNSUPPORTED_FEATURE,
                        render.render_lanes(),
                    );
                }
                other => panic!("expected child preflight blocker, got {other:?}"),
            },
            _ => unreachable!("test only covers explicit blocker tags"),
        }

        assert_client_root_fail_closed_without_side_effects(
            &store,
            &host,
            root_id,
            current,
            render,
            blocked_child,
        );
    }
}
