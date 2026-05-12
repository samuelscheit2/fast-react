use super::*;

use fast_react_host_config::HostTreeUpdateMode;

#[test]
fn reports_mutation_only_capabilities() {
    let renderer = TestRenderer::new();
    let capabilities = renderer.capabilities();

    assert_eq!(renderer.renderer_name(), TEST_RENDERER_NAME);
    assert_eq!(
        capabilities.tree_update_mode(),
        Ok(HostTreeUpdateMode::Mutation)
    );
    assert!(capabilities.supports(HostCapability::Mutation));
    assert!(!capabilities.supports(HostCapability::Persistence));
    assert!(!capabilities.supports(HostCapability::Hydration));
    assert!(!capabilities.supports(HostCapability::Resources));
    assert!(!capabilities.supports(HostCapability::Singletons));
    assert!(!capabilities.supports(HostCapability::ViewTransitions));
    assert_mutation_renderer(&renderer);
}

#[test]
fn creates_instances_text_and_host_context() {
    let mut renderer = TestRenderer::new();
    let container = renderer.create_container();
    let context = renderer.root_host_context(&container).unwrap();
    let child_context = renderer
        .child_host_context(&context, &element_type("View"), &props())
        .unwrap();
    let text_props = TestProps::with_text_content("inline");

    let instance = renderer
        .create_instance(
            creation_instance_token(),
            &element_type("View"),
            &props().with_attribute("role", "main"),
            &container,
            &context,
        )
        .unwrap();
    let text = renderer
        .create_text_instance(creation_text_token(), "hello", &container, &context)
        .unwrap();

    assert_eq!(context.depth(), 0);
    assert_eq!(child_context.depth(), 1);
    assert!(renderer.should_set_text_content(&element_type("Text"), &text_props, &context));
    assert_eq!(
        renderer
            .snapshot_instance(&instance)
            .unwrap()
            .element_type()
            .as_str(),
        "View"
    );
    assert_eq!(
        renderer
            .snapshot_instance(&instance)
            .unwrap()
            .props()
            .attributes()["role"],
        "main"
    );
    assert_eq!(renderer.snapshot_text(&text).unwrap().text(), "hello");
    assert_eq!(renderer.get_public_instance(&instance).unwrap(), instance);
}

#[test]
fn append_initial_child_records_detached_children() {
    let mut renderer = TestRenderer::new();
    let container = renderer.create_container();
    let mut parent = create_instance(&mut renderer, &container, "View");
    let text = create_text(&mut renderer, &container, "alpha");

    renderer
        .append_initial_child(&mut parent, HostChild::Text(&text))
        .unwrap();
    let finalization = renderer
        .finalize_initial_children(
            &mut parent,
            &element_type("View"),
            &props(),
            &container,
            &renderer.root_host_context(&container).unwrap(),
        )
        .unwrap();

    assert_eq!(finalization, InitialChildrenFinalization::NoCommitMount);
    assert_eq!(
        child_texts(&renderer.snapshot_instance(&parent).unwrap()),
        vec!["alpha"]
    );
}

#[test]
fn append_child_and_append_child_to_container_record_order() {
    let mut renderer = TestRenderer::new();
    let mut container = renderer.create_container();
    let mut parent = create_instance(&mut renderer, &container, "View");
    let child = create_instance(&mut renderer, &container, "Text");
    let text = create_text(&mut renderer, &container, "inside");

    renderer
        .append_child(&mut parent, HostChild::Instance(&child))
        .unwrap();
    renderer
        .append_child(&mut parent, HostChild::Text(&text))
        .unwrap();
    renderer
        .append_child_to_container(&mut container, HostChild::Instance(&parent))
        .unwrap();

    let parent_snapshot = renderer.snapshot_instance(&parent).unwrap();
    assert_eq!(parent_snapshot.children().len(), 2);
    match &parent_snapshot.children()[0] {
        TestNodeSnapshot::Element(element) => {
            assert_eq!(element.element_type().as_str(), "Text");
        }
        TestNodeSnapshot::Text(_) => panic!("expected element child"),
    }
    match &parent_snapshot.children()[1] {
        TestNodeSnapshot::Text(text) => {
            assert_eq!(text.text(), "inside");
        }
        TestNodeSnapshot::Element(_) => panic!("expected text child"),
    }
    assert_eq!(
        container_element_names(&renderer.snapshot_container(&container).unwrap()),
        vec!["View"]
    );
}

#[test]
fn insert_before_reorders_instance_children() {
    let mut renderer = TestRenderer::new();
    let container = renderer.create_container();
    let mut parent = create_instance(&mut renderer, &container, "View");
    let a = create_text(&mut renderer, &container, "a");
    let b = create_text(&mut renderer, &container, "b");
    let c = create_text(&mut renderer, &container, "c");

    renderer
        .append_child(&mut parent, HostChild::Text(&a))
        .unwrap();
    renderer
        .append_child(&mut parent, HostChild::Text(&c))
        .unwrap();
    renderer
        .insert_before(&mut parent, HostChild::Text(&b), HostChild::Text(&c))
        .unwrap();
    renderer
        .insert_before(&mut parent, HostChild::Text(&a), HostChild::Text(&c))
        .unwrap();

    assert_eq!(
        child_texts(&renderer.snapshot_instance(&parent).unwrap()),
        vec!["b", "a", "c"]
    );
}

#[test]
fn insert_in_container_before_reorders_root_children() {
    let mut renderer = TestRenderer::new();
    let mut container = renderer.create_container();
    let first = create_instance(&mut renderer, &container, "First");
    let second = create_instance(&mut renderer, &container, "Second");

    renderer
        .append_child_to_container(&mut container, HostChild::Instance(&second))
        .unwrap();
    renderer
        .insert_in_container_before(
            &mut container,
            HostChild::Instance(&first),
            HostChild::Instance(&second),
        )
        .unwrap();

    assert_eq!(
        container_element_names(&renderer.snapshot_container(&container).unwrap()),
        vec!["First", "Second"]
    );
}

#[test]
fn moving_children_detaches_from_previous_parent_or_container() {
    let mut renderer = TestRenderer::new();
    let mut container = renderer.create_container();
    let mut old_parent = create_instance(&mut renderer, &container, "OldParent");
    let mut new_parent = create_instance(&mut renderer, &container, "NewParent");
    let child = create_text(&mut renderer, &container, "move me");

    renderer
        .append_child(&mut old_parent, HostChild::Text(&child))
        .unwrap();
    renderer
        .append_child_to_container(&mut container, HostChild::Text(&child))
        .unwrap();
    assert!(
        renderer
            .snapshot_instance(&old_parent)
            .unwrap()
            .children()
            .is_empty()
    );

    renderer
        .append_child(&mut new_parent, HostChild::Text(&child))
        .unwrap();
    assert!(
        renderer
            .snapshot_container(&container)
            .unwrap()
            .children()
            .is_empty()
    );
    assert_eq!(
        child_texts(&renderer.snapshot_instance(&new_parent).unwrap()),
        vec!["move me"]
    );
}

#[test]
fn remove_child_and_remove_child_from_container_detach_links_only() {
    let mut renderer = TestRenderer::new();
    let mut container = renderer.create_container();
    let mut parent = create_instance(&mut renderer, &container, "View");
    let text = create_text(&mut renderer, &container, "remove me");

    renderer
        .append_child(&mut parent, HostChild::Text(&text))
        .unwrap();
    renderer
        .append_child_to_container(&mut container, HostChild::Instance(&parent))
        .unwrap();
    renderer
        .remove_child(&mut parent, HostChild::Text(&text))
        .unwrap();
    renderer
        .remove_child_from_container(&mut container, HostChild::Instance(&parent))
        .unwrap();

    assert!(
        renderer
            .snapshot_instance(&parent)
            .unwrap()
            .children()
            .is_empty()
    );
    assert!(
        renderer
            .snapshot_container(&container)
            .unwrap()
            .children()
            .is_empty()
    );
    assert_eq!(renderer.snapshot_text(&text).unwrap().text(), "remove me");
}

#[test]
fn clear_container_removes_all_root_children() {
    let mut renderer = TestRenderer::new();
    let mut container = renderer.create_container();
    let first = create_instance(&mut renderer, &container, "First");
    let second = create_instance(&mut renderer, &container, "Second");

    renderer
        .append_child_to_container(&mut container, HostChild::Instance(&first))
        .unwrap();
    renderer
        .append_child_to_container(&mut container, HostChild::Instance(&second))
        .unwrap();
    renderer.clear_container(&mut container).unwrap();

    assert!(
        renderer
            .snapshot_container(&container)
            .unwrap()
            .children()
            .is_empty()
    );
}

#[test]
fn commit_hooks_update_props_text_visibility_and_detachment() {
    let mut renderer = TestRenderer::new();
    let container = renderer.create_container();
    let mut instance = create_instance(&mut renderer, &container, "View");
    let mut text = create_text(&mut renderer, &container, "old");
    let commit_state = renderer.prepare_for_commit(&container).unwrap();

    renderer
        .commit_update(
            commit_instance_token(),
            &mut instance,
            TestUpdatePayload::replace_props(props().with_attribute("updated", "yes")),
            &element_type("View"),
            &props(),
            &props().with_attribute("updated", "yes"),
        )
        .unwrap();
    renderer
        .commit_text_update(&mut text, "old", "new")
        .unwrap();
    renderer.hide_instance(&mut instance).unwrap();
    renderer.hide_text_instance(&mut text).unwrap();
    renderer
        .reset_after_commit(&container, commit_state)
        .unwrap();

    assert!(renderer.snapshot_instance(&instance).unwrap().is_hidden());
    assert!(renderer.snapshot_text(&text).unwrap().is_hidden());
    assert_eq!(
        renderer
            .snapshot_instance(&instance)
            .unwrap()
            .props()
            .attributes()["updated"],
        "yes"
    );
    assert_eq!(renderer.snapshot_text(&text).unwrap().text(), "new");

    renderer.unhide_instance(&mut instance, &props()).unwrap();
    renderer.unhide_text_instance(&mut text, "new").unwrap();
    renderer
        .detach_deleted_instance(deletion_instance_token(), instance)
        .unwrap();

    let snapshot = renderer.snapshot_instance(&instance).unwrap();
    assert!(!snapshot.is_hidden());
    assert!(snapshot.is_detached());
    assert!(snapshot.children().is_empty());
}

#[test]
fn lifecycle_hooks_reject_wrong_fiber_token_phase_or_target() {
    let mut renderer = TestRenderer::new();
    let container = renderer.create_container();
    let context = renderer.root_host_context(&container).unwrap();
    let mut instance = create_instance(&mut renderer, &container, "View");

    assert_operation_error(
        renderer
            .create_instance(
                commit_instance_token(),
                &element_type("View"),
                &props(),
                &container,
                &context,
            )
            .unwrap_err(),
        HostOperationErrorKind::InvalidFiberToken {
            phase: HostFiberTokenPhase::Commit,
            target: HostFiberTokenTarget::Instance,
            violation: HostFiberTokenViolation::WrongPhase,
        },
    );

    assert_operation_error(
        renderer
            .create_text_instance(creation_instance_token(), "text", &container, &context)
            .unwrap_err(),
        HostOperationErrorKind::InvalidFiberToken {
            phase: HostFiberTokenPhase::Creation,
            target: HostFiberTokenTarget::Instance,
            violation: HostFiberTokenViolation::WrongTarget,
        },
    );

    assert_operation_error(
        renderer
            .commit_mount(
                creation_instance_token(),
                &mut instance,
                &element_type("View"),
                &props(),
            )
            .unwrap_err(),
        HostOperationErrorKind::InvalidFiberToken {
            phase: HostFiberTokenPhase::Creation,
            target: HostFiberTokenTarget::Instance,
            violation: HostFiberTokenViolation::WrongPhase,
        },
    );

    assert_operation_error(
        renderer
            .commit_update(
                creation_instance_token(),
                &mut instance,
                TestUpdatePayload::replace_props(props().with_attribute("updated", "no")),
                &element_type("View"),
                &props(),
                &props().with_attribute("updated", "no"),
            )
            .unwrap_err(),
        HostOperationErrorKind::InvalidFiberToken {
            phase: HostFiberTokenPhase::Creation,
            target: HostFiberTokenTarget::Instance,
            violation: HostFiberTokenViolation::WrongPhase,
        },
    );

    assert_operation_error(
        renderer
            .detach_deleted_instance(commit_instance_token(), instance)
            .unwrap_err(),
        HostOperationErrorKind::InvalidFiberToken {
            phase: HostFiberTokenPhase::Commit,
            target: HostFiberTokenTarget::Instance,
            violation: HostFiberTokenViolation::WrongPhase,
        },
    );

    let snapshot = renderer.snapshot_instance(&instance).unwrap();
    assert!(!snapshot.is_detached());
    assert!(snapshot.props().attributes().is_empty());
}

#[test]
fn invalid_same_renderer_handles_are_structured_operation_errors() {
    let mut renderer = TestRenderer::new();
    let mut invalid_container = TestContainer {
        renderer_id: renderer.renderer_id,
        index: 0,
    };
    let invalid_instance = TestInstance {
        renderer_id: renderer.renderer_id,
        index: 0,
    };
    let mut invalid_text = TestTextInstance {
        renderer_id: renderer.renderer_id,
        index: 0,
    };

    assert_operation_error(
        renderer.root_host_context(&invalid_container).unwrap_err(),
        HostOperationErrorKind::InvalidHandle {
            handle: HostHandleKind::Container,
        },
    );
    assert_operation_error(
        renderer
            .create_instance(
                creation_instance_token(),
                &element_type("View"),
                &props(),
                &invalid_container,
                &TestHostContext::default(),
            )
            .unwrap_err(),
        HostOperationErrorKind::InvalidHandle {
            handle: HostHandleKind::Container,
        },
    );
    assert_operation_error(
        renderer
            .clear_container(&mut invalid_container)
            .unwrap_err(),
        HostOperationErrorKind::InvalidHandle {
            handle: HostHandleKind::Container,
        },
    );
    assert_operation_error(
        renderer.get_public_instance(&invalid_instance).unwrap_err(),
        HostOperationErrorKind::InvalidHandle {
            handle: HostHandleKind::Instance,
        },
    );
    assert_operation_error(
        renderer
            .commit_text_update(&mut invalid_text, "old", "new")
            .unwrap_err(),
        HostOperationErrorKind::InvalidHandle {
            handle: HostHandleKind::TextInstance,
        },
    );

    assert_operation_error(
        renderer.snapshot_container(&invalid_container).unwrap_err(),
        HostOperationErrorKind::InvalidHandle {
            handle: HostHandleKind::Container,
        },
    );
    assert_operation_error(
        renderer.snapshot_instance(&invalid_instance).unwrap_err(),
        HostOperationErrorKind::InvalidHandle {
            handle: HostHandleKind::Instance,
        },
    );
    assert_operation_error(
        renderer.snapshot_text(&invalid_text).unwrap_err(),
        HostOperationErrorKind::InvalidHandle {
            handle: HostHandleKind::TextInstance,
        },
    );
}

#[test]
fn cross_renderer_handles_are_rejected_even_with_same_indices() {
    let mut left = TestRenderer::new();
    let left_container = left.create_container();
    let mut right = TestRenderer::new();
    let right_container = right.create_container();
    let right_instance = create_instance(&mut right, &right_container, "Foreign");
    let mut right_text = create_text(&mut right, &right_container, "foreign");

    assert_eq!(left_container.index, right_container.index);
    assert_eq!(right_instance.index, 0);
    assert_eq!(right_text.index, 0);

    assert_operation_error(
        left.root_host_context(&right_container).unwrap_err(),
        HostOperationErrorKind::InvalidHandle {
            handle: HostHandleKind::Container,
        },
    );
    assert_operation_error(
        left.get_public_instance(&right_instance).unwrap_err(),
        HostOperationErrorKind::InvalidHandle {
            handle: HostHandleKind::Instance,
        },
    );
    assert_operation_error(
        left.commit_text_update(&mut right_text, "foreign", "changed")
            .unwrap_err(),
        HostOperationErrorKind::InvalidHandle {
            handle: HostHandleKind::TextInstance,
        },
    );
}

#[test]
fn missing_insert_targets_return_errors_without_detaching_existing_child() {
    let mut renderer = TestRenderer::new();
    let container = renderer.create_container();
    let mut old_parent = create_instance(&mut renderer, &container, "OldParent");
    let mut new_parent = create_instance(&mut renderer, &container, "NewParent");
    let moving = create_text(&mut renderer, &container, "moving");
    let missing_before = create_text(&mut renderer, &container, "missing");

    renderer
        .append_child(&mut old_parent, HostChild::Text(&moving))
        .unwrap();

    assert_operation_error(
        renderer
            .insert_before(
                &mut new_parent,
                HostChild::Text(&moving),
                HostChild::Text(&missing_before),
            )
            .unwrap_err(),
        HostOperationErrorKind::MissingInsertionTarget {
            parent: HostParentKind::Instance,
            target: HostChildKind::TextInstance,
        },
    );
    assert_eq!(
        child_texts(&renderer.snapshot_instance(&old_parent).unwrap()),
        vec!["moving"]
    );
    assert!(
        renderer
            .snapshot_instance(&new_parent)
            .unwrap()
            .children()
            .is_empty()
    );
}

#[test]
fn missing_container_insert_targets_return_errors_without_detaching_child() {
    let mut renderer = TestRenderer::new();
    let mut container = renderer.create_container();
    let mut old_parent = create_instance(&mut renderer, &container, "OldParent");
    let moving = create_text(&mut renderer, &container, "moving");
    let missing_before = create_text(&mut renderer, &container, "missing");

    renderer
        .append_child(&mut old_parent, HostChild::Text(&moving))
        .unwrap();

    assert_operation_error(
        renderer
            .insert_in_container_before(
                &mut container,
                HostChild::Text(&moving),
                HostChild::Text(&missing_before),
            )
            .unwrap_err(),
        HostOperationErrorKind::MissingInsertionTarget {
            parent: HostParentKind::Container,
            target: HostChildKind::TextInstance,
        },
    );
    assert_eq!(
        child_texts(&renderer.snapshot_instance(&old_parent).unwrap()),
        vec!["moving"]
    );
    assert!(
        renderer
            .snapshot_container(&container)
            .unwrap()
            .children()
            .is_empty()
    );
}

#[test]
fn missing_removal_targets_return_errors_without_changing_tree() {
    let mut renderer = TestRenderer::new();
    let mut container = renderer.create_container();
    let mut parent = create_instance(&mut renderer, &container, "Parent");
    let attached = create_text(&mut renderer, &container, "attached");
    let missing = create_text(&mut renderer, &container, "missing");

    renderer
        .append_child(&mut parent, HostChild::Text(&attached))
        .unwrap();
    renderer
        .append_child_to_container(&mut container, HostChild::Instance(&parent))
        .unwrap();

    assert_operation_error(
        renderer
            .remove_child(&mut parent, HostChild::Text(&missing))
            .unwrap_err(),
        HostOperationErrorKind::MissingRemovalTarget {
            parent: HostParentKind::Instance,
            child: HostChildKind::TextInstance,
        },
    );
    assert_operation_error(
        renderer
            .remove_child_from_container(&mut container, HostChild::Text(&missing))
            .unwrap_err(),
        HostOperationErrorKind::MissingRemovalTarget {
            parent: HostParentKind::Container,
            child: HostChildKind::TextInstance,
        },
    );
    assert_eq!(
        child_texts(&renderer.snapshot_instance(&parent).unwrap()),
        vec!["attached"]
    );
    assert_eq!(
        container_element_names(&renderer.snapshot_container(&container).unwrap()),
        vec!["Parent"]
    );
}

#[test]
fn impossible_self_and_cycle_mutations_return_operation_errors() {
    let mut renderer = TestRenderer::new();
    let container = renderer.create_container();
    let mut parent = create_instance(&mut renderer, &container, "Parent");
    let mut child = create_instance(&mut renderer, &container, "Child");

    let same_parent = parent;
    assert_operation_error(
        renderer
            .append_child(&mut parent, HostChild::Instance(&same_parent))
            .unwrap_err(),
        HostOperationErrorKind::ImpossibleMutation {
            parent: HostParentKind::Instance,
            child: HostChildKind::Instance,
            violation: HostMutationViolation::ChildIsParent,
        },
    );

    renderer
        .append_child(&mut parent, HostChild::Instance(&child))
        .unwrap();

    assert_operation_error(
        renderer
            .append_child(&mut child, HostChild::Instance(&parent))
            .unwrap_err(),
        HostOperationErrorKind::ImpossibleMutation {
            parent: HostParentKind::Instance,
            child: HostChildKind::Instance,
            violation: HostMutationViolation::ChildIsAncestorOfParent,
        },
    );
    assert_eq!(
        renderer
            .snapshot_instance(&parent)
            .unwrap()
            .children()
            .len(),
        1
    );
    assert!(
        renderer
            .snapshot_instance(&child)
            .unwrap()
            .children()
            .is_empty()
    );
}

#[test]
fn unsupported_capabilities_are_structured_errors() {
    let mut renderer = TestRenderer::new();

    for capability in [
        HostCapability::Persistence,
        HostCapability::Hydration,
        HostCapability::Resources,
        HostCapability::Singletons,
        HostCapability::ViewTransitions,
    ] {
        let error = renderer.require_capability(capability).unwrap_err();
        let unsupported = error.as_unsupported_capability().unwrap();
        assert_eq!(unsupported.renderer_name(), TEST_RENDERER_NAME);
        assert_eq!(unsupported.capability(), capability);
        assert!(error.as_operation_error().is_none());
    }

    let mut form = ();
    let error = renderer.reset_form_instance(&mut form).unwrap_err();
    let unsupported = error.as_unsupported_capability().unwrap();
    assert_eq!(unsupported.renderer_name(), TEST_RENDERER_NAME);
    assert_eq!(unsupported.capability(), HostCapability::Forms);
    assert!(error.as_operation_error().is_none());
}
