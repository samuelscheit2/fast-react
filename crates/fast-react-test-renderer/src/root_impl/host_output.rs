use super::super::*;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum StableSiblingInsertionCanaryMode {
    StableCommittedSibling,
    AmbiguousMissingSiblingStateNode,
}

impl TestRendererRoot {
    pub fn render_latest_scheduled_host_root_for_commit_handoff(
        &mut self,
    ) -> Result<Option<HostRootRenderPhaseRecord>, TestRendererRootError> {
        let Some(update) = self.scheduled_updates.last() else {
            return Ok(None);
        };

        Ok(Some(render_host_root_for_lanes(
            &mut self.store,
            self.root_id,
            update.container_update.lane().to_lanes(),
        )?))
    }

    pub fn commit_host_root_render_for_canary(
        &mut self,
        render: HostRootRenderPhaseRecord,
    ) -> Result<HostRootCommitRecord, TestRendererRootError> {
        Ok(commit_finished_host_root(&mut self.store, render)?)
    }

    pub fn render_and_commit_host_output_for_canary(
        &mut self,
    ) -> Result<Option<TestRendererCommittedHostOutput>, TestRendererRootError> {
        let Some(render) = self.render_latest_scheduled_host_root_for_commit_handoff()? else {
            return Ok(None);
        };
        let fixture = self
            .host_output_fixture(render.resulting_element())?
            .clone();
        let prepared = prepare_test_renderer_host_output_canary_fibers(
            &mut self.store,
            render,
            fixture.canary_fixture,
        )?;
        let (instance, text) = self.create_detached_host_output_for_canary(&fixture, prepared)?;
        let completed = finish_test_renderer_host_output_canary_fibers(
            &mut self.store,
            prepared,
            Self::instance_state_node_raw(instance),
            Self::text_state_node_raw(text),
        )?;
        let commit = self.commit_host_root_render_for_canary(render)?;
        let fiber_inspection = self.describe_committed_fiber_tree_for_canary(&commit)?;
        let mut container = self.container;
        let commit_state = self.renderer.prepare_for_commit(&container)?;
        self.renderer
            .append_child_to_container(&mut container, HostChild::Instance(&instance))?;
        self.renderer.reset_after_commit(&container, commit_state)?;
        let snapshot = self.diagnostic_container_snapshot()?;
        self.host_nodes.track_current(
            completed.current(),
            completed.component_state_node_raw(),
            completed.text_state_node_raw(),
        );
        self.current_host_output = Some(TestRendererCurrentHostOutput {
            fixture,
            fibers: completed.current(),
            instance,
            text,
        });
        self.current_nested_host_output = None;

        Ok(Some(TestRendererCommittedHostOutput {
            render,
            prepared_fibers: prepared,
            completed_fibers: completed,
            commit,
            fiber_inspection,
            snapshot,
        }))
    }

    pub fn render_and_commit_nested_host_output_for_canary(
        &mut self,
    ) -> Result<Option<TestRendererNestedCommittedHostOutput>, TestRendererRootError> {
        let Some(render) = self.render_latest_scheduled_host_root_for_commit_handoff()? else {
            return Ok(None);
        };
        let fixture = self
            .nested_host_output_fixture(render.resulting_element())?
            .clone();
        let (outer_prepared, inner_prepared) = self
            .store
            .prepare_test_renderer_nested_host_output_canary_fibers(
                render,
                fixture.outer_canary_fixture,
                fixture.inner_canary_fixture,
            )?;
        let (outer_instance, inner_instance, text) = self
            .create_detached_nested_host_output_for_canary(
                &fixture,
                outer_prepared,
                inner_prepared,
            )?;
        let (outer_fibers, inner_fibers) = self
            .store
            .finish_test_renderer_nested_host_output_canary_fibers(
                outer_prepared,
                inner_prepared,
                Self::instance_state_node_raw(outer_instance),
                Self::instance_state_node_raw(inner_instance),
                Self::text_state_node_raw(text),
            )?;
        let commit = self.commit_host_root_render_for_canary(render)?;
        let fiber_inspection = self.describe_committed_fiber_tree_for_canary(&commit)?;
        let commit_diagnostics = inspect_test_renderer_host_output_canary_commit(&commit);
        let mut container = self.container;
        let commit_state = self.renderer.prepare_for_commit(&container)?;
        self.renderer
            .append_child_to_container(&mut container, HostChild::Instance(&outer_instance))?;
        self.renderer.reset_after_commit(&container, commit_state)?;
        let snapshot = self.diagnostic_container_snapshot()?;
        self.current_host_output = None;
        self.current_nested_host_output = Some(TestRendererCurrentNestedHostOutput {
            fixture,
            outer_fibers,
            inner_fibers,
            outer_instance,
            inner_instance,
            text,
        });

        Ok(Some(TestRendererNestedCommittedHostOutput {
            render,
            outer_fibers,
            inner_fibers,
            commit,
            fiber_inspection,
            commit_diagnostics,
            snapshot,
        }))
    }

    pub fn render_and_commit_host_output_update_for_canary(
        &mut self,
    ) -> Result<Option<TestRendererUpdatedHostOutput>, TestRendererRootError> {
        let Some(update) = self.scheduled_updates.last() else {
            return Ok(None);
        };
        let scheduled_update_sequence = self.scheduled_updates.len();
        if update.kind() != TestRendererRootUpdateKind::Update {
            return Err(TestRendererRootError::UnexpectedHostOutputUpdateKind {
                expected: TestRendererRootUpdateKind::Update,
                actual: update.kind(),
            });
        }
        let current = self.current_host_output.clone().ok_or(
            TestRendererRootError::MissingCommittedHostOutput {
                operation: TestRendererRootUpdateKind::Update,
            },
        )?;
        let Some(render) = self.render_latest_scheduled_host_root_for_commit_handoff()? else {
            return Ok(None);
        };
        let next_fixture = self
            .host_output_fixture(render.resulting_element())?
            .clone();
        let previous_snapshot = self.diagnostic_container_snapshot()?;
        let updated = prepare_test_renderer_host_output_update_canary_fibers(
            &mut self.store,
            render,
            current.fibers,
            next_fixture.canary_fixture,
            Self::instance_state_node_raw(current.instance),
            Self::text_state_node_raw(current.text),
        )?;
        let commit = self.commit_host_root_render_for_canary(render)?;
        let fiber_inspection = self.describe_committed_fiber_tree_for_canary(&commit)?;
        let commit_diagnostics = inspect_test_renderer_host_output_canary_commit(&commit);
        let text_update_requested =
            updated.text_props_changed() || current.fixture.text != next_fixture.text;
        if text_update_requested
            && !commit.has_test_only_host_text_update_apply_for_canary(
                current.fibers.text(),
                updated.current().text(),
                Self::text_state_node_raw(current.text),
            )
        {
            return Err(TestRendererRootError::MissingHostTextUpdateApply {
                current_text_slot: current.fibers.text().slot().get(),
                updated_text_slot: updated.current().text().slot().get(),
                text_state_node_raw: Self::text_state_node_raw(current.text),
            });
        }

        let container = self.container;
        let mut instance = current.instance;
        let mut text = current.text;
        let commit_state = self.renderer.prepare_for_commit(&container)?;
        if updated.component_props_changed() {
            let component_token = updated.component_commit_token().raw();
            self.renderer.commit_update(
                HostFiberTokenRef::new(
                    &component_token,
                    HostFiberTokenPhase::Commit,
                    HostFiberTokenTarget::Instance,
                ),
                &mut instance,
                TestUpdatePayload::replace_props(next_fixture.props.clone()),
                &next_fixture.element_type,
                &current.fixture.props,
                &next_fixture.props,
            )?;
        }
        if text_update_requested {
            self.renderer.commit_text_update(
                &mut text,
                &current.fixture.text,
                &next_fixture.text,
            )?;
        }
        self.renderer.reset_after_commit(&container, commit_state)?;
        let snapshot = self.diagnostic_container_snapshot()?;
        self.host_nodes.retarget_current(updated.current());
        self.current_host_output = Some(TestRendererCurrentHostOutput {
            fixture: next_fixture,
            fibers: updated.current(),
            instance,
            text,
        });
        self.current_nested_host_output = None;

        Ok(Some(TestRendererUpdatedHostOutput {
            scheduled_update_sequence,
            render,
            updated_fibers: updated,
            commit,
            fiber_inspection,
            commit_diagnostics,
            previous_snapshot,
            snapshot,
        }))
    }

    pub fn render_and_commit_sibling_text_host_output_update_for_canary(
        &mut self,
        text: impl Into<String>,
    ) -> Result<Option<TestRendererSiblingTextHostOutput>, TestRendererRootError> {
        let current = self.current_host_output.clone().ok_or(
            TestRendererRootError::MissingCommittedHostOutput {
                operation: TestRendererRootUpdateKind::Update,
            },
        )?;
        let scheduled = self.schedule_root_update(
            TestRendererRootUpdateKind::Update,
            current.fixture.element,
            None,
        )?;
        self.scheduled_updates.push(scheduled);
        let scheduled_update_sequence = self.scheduled_updates.len();
        let Some(render) = self.render_latest_scheduled_host_root_for_commit_handoff()? else {
            return Ok(None);
        };
        let previous_snapshot = self.diagnostic_container_snapshot()?;
        let root_text = text.into();
        let root_text_props_raw = self.next_sibling_text_props_raw_for_canary(&current);
        let (stable_fibers, root_text_fiber, root_text_token) = self
            .store
            .prepare_test_renderer_sibling_text_host_output_update_canary_fibers(
                render,
                current.fibers,
                root_text_props_raw,
                Self::instance_state_node_raw(current.instance),
                Self::text_state_node_raw(current.text),
            )?;

        let container = self.container;
        let root_context = self.renderer.root_host_context(&container)?;
        let root_text_token_raw = root_text_token.raw();
        let root_text_instance = self.renderer.create_text_instance(
            HostFiberTokenRef::new(
                &root_text_token_raw,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::TextInstance,
            ),
            &root_text,
            &container,
            &root_context,
        )?;
        let root_text_state_node_raw = Self::text_state_node_raw(root_text_instance);
        self.store
            .finish_test_renderer_sibling_text_host_output_update_canary_fibers(
                stable_fibers,
                root_text_fiber,
                root_text_state_node_raw,
                root_text_props_raw,
            )?;

        let commit = self.commit_host_root_render_for_canary(render)?;
        let fiber_inspection = self.describe_committed_fiber_tree_for_canary(&commit)?;
        let commit_diagnostics = inspect_test_renderer_host_output_canary_commit(&commit);
        let placement_records = commit.host_root_placement_apply_diagnostics_for_canary();
        if placement_records.len() != 1 {
            return Err(
                TestRendererStableSiblingInsertionCanaryError::MultiplePlacementRecords {
                    actual: placement_records.len(),
                }
                .into(),
            );
        }
        let placement = placement_records[0];
        if placement.fiber() != root_text_fiber
            || placement.tag_name() != "HostText"
            || placement.sibling() != Some(stable_fibers.component())
            || placement.apply_kind() != "insert-placement-in-container-before"
            || !placement.can_insert_before()
        {
            return Err(
                TestRendererStableSiblingInsertionCanaryError::UnexpectedInsertedFiber.into(),
            );
        }

        let mut container = self.container;
        let commit_state = self.renderer.prepare_for_commit(&container)?;
        self.renderer.insert_in_container_before(
            &mut container,
            HostChild::Text(&root_text_instance),
            HostChild::Instance(&current.instance),
        )?;
        self.renderer.reset_after_commit(&container, commit_state)?;
        let snapshot = self.diagnostic_container_snapshot()?;
        let root_text_snapshot = self.renderer.snapshot_text(&root_text_instance)?;
        self.host_nodes.retarget_current(stable_fibers.current());
        self.current_host_output = None;
        self.current_nested_host_output = None;

        macro_rules! fiber_handle {
            ($fiber:expr) => {{
                let fiber = $fiber;
                TestRendererFiberHandleDiagnostics {
                    arena_id: fiber.arena_id().get(),
                    slot: fiber.slot().get(),
                    generation: fiber.generation().get(),
                }
            }};
        }

        Ok(Some(TestRendererSiblingTextHostOutput {
            scheduled_update_sequence,
            render,
            stable_fibers,
            root_text_fiber: fiber_handle!(root_text_fiber),
            root_text_props_raw,
            root_text_state_node_raw,
            component_state_node_raw: Self::instance_state_node_raw(current.instance),
            component_text_state_node_raw: Self::text_state_node_raw(current.text),
            commit,
            fiber_inspection,
            commit_diagnostics,
            previous_snapshot,
            snapshot,
            root_text_snapshot,
        }))
    }

    pub fn render_and_commit_host_parent_text_placement_for_canary(
        &mut self,
        text: impl Into<String>,
    ) -> Result<TestRendererHostParentPlacedHostOutput, TestRendererRootError> {
        let current = self.current_host_output.clone().ok_or(
            TestRendererRootError::MissingCommittedHostOutput {
                operation: TestRendererRootUpdateKind::Update,
            },
        )?;
        let scheduled = self.schedule_root_update(
            TestRendererRootUpdateKind::Update,
            current.fixture.element,
            None,
        )?;
        self.scheduled_updates.push(scheduled);
        let scheduled_update_sequence = self.scheduled_updates.len();
        let render = self
            .render_latest_scheduled_host_root_for_commit_handoff()?
            .expect("host-parent placement canary schedules an update before rendering");
        let previous_snapshot = self.diagnostic_container_snapshot()?;
        let placed_text = text.into();
        let placed_text_props_raw =
            self.next_host_parent_placement_text_props_raw_for_canary(&current);
        let (next_fibers, placed_text_fiber, text_token) = self
            .store
            .prepare_test_renderer_host_parent_text_placement_canary_fibers(
                render,
                current.fibers,
                placed_text_props_raw,
            )?;

        let container = self.container;
        let root_context = self.renderer.root_host_context(&container)?;
        let child_context = self.renderer.child_host_context(
            &root_context,
            &current.fixture.element_type,
            &current.fixture.props,
        )?;
        let text_token_raw = text_token.raw();
        let placed_text_instance = self.renderer.create_text_instance(
            HostFiberTokenRef::new(
                &text_token_raw,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::TextInstance,
            ),
            &placed_text,
            &container,
            &child_context,
        )?;
        let parent_state_node_raw = Self::instance_state_node_raw(current.instance);
        let child_state_node_raw = Self::text_state_node_raw(placed_text_instance);
        self.store
            .finish_test_renderer_host_parent_text_placement_canary_fibers(
                next_fibers,
                placed_text_fiber,
                child_state_node_raw,
                placed_text_props_raw,
            )?;

        let commit = self.commit_host_root_render_for_canary(render)?;
        let commit_diagnostics = inspect_test_renderer_host_output_canary_commit(&commit);
        let host_parent_placement_apply_count =
            commit.test_only_host_parent_placement_apply_count_for_canary();
        if !commit.has_test_only_host_parent_placement_apply_for_canary(
            parent_state_node_raw,
            child_state_node_raw,
        ) {
            return Err(TestRendererRootError::MissingHostParentPlacementApply {
                parent_state_node_raw,
                child_state_node_raw,
            });
        }

        let mut parent = current.instance;
        let commit_state = self.renderer.prepare_for_commit(&container)?;
        self.renderer
            .append_child(&mut parent, HostChild::Text(&placed_text_instance))?;
        self.renderer.reset_after_commit(&container, commit_state)?;
        let snapshot = self.diagnostic_container_snapshot()?;
        let placed_text_snapshot = self.renderer.snapshot_text(&placed_text_instance)?;
        self.current_host_output = Some(TestRendererCurrentHostOutput {
            fixture: current.fixture,
            fibers: next_fibers,
            instance: parent,
            text: current.text,
        });
        self.current_nested_host_output = None;

        macro_rules! fiber_handle {
            ($fiber:expr) => {{
                let fiber = $fiber;
                TestRendererFiberHandleDiagnostics {
                    arena_id: fiber.arena_id().get(),
                    slot: fiber.slot().get(),
                    generation: fiber.generation().get(),
                }
            }};
        }

        Ok(TestRendererHostParentPlacedHostOutput {
            scheduled_update_sequence,
            render,
            updated_fibers: next_fibers,
            placed_text_fiber: fiber_handle!(placed_text_fiber),
            placed_text_props_raw,
            parent_state_node_raw,
            placed_text_state_node_raw: child_state_node_raw,
            commit,
            commit_diagnostics,
            previous_snapshot,
            snapshot,
            placed_text_snapshot,
            host_parent_placement_apply_count,
        })
    }

    pub fn render_and_commit_nested_host_parent_text_placement_for_canary(
        &mut self,
        text: impl Into<String>,
    ) -> Result<TestRendererNestedHostParentPlacedHostOutput, TestRendererRootError> {
        let current = self.current_nested_host_output.clone().ok_or(
            TestRendererRootError::MissingCommittedHostOutput {
                operation: TestRendererRootUpdateKind::Update,
            },
        )?;
        let scheduled = self.schedule_root_update(
            TestRendererRootUpdateKind::Update,
            current.fixture.element,
            None,
        )?;
        self.scheduled_updates.push(scheduled);
        let scheduled_update_sequence = self.scheduled_updates.len();
        let render = self
            .render_latest_scheduled_host_root_for_commit_handoff()?
            .expect("nested host-parent placement canary schedules an update before rendering");
        let previous_snapshot = self.diagnostic_container_snapshot()?;
        let placed_text = text.into();
        let placed_text_props_raw =
            self.next_nested_host_parent_placement_text_props_raw_for_canary(&current);
        let (next_outer_fibers, next_inner_fibers, placed_text_fiber, text_token) = self
            .store
            .prepare_test_renderer_nested_host_parent_text_placement_canary_fibers(
                render,
                current.outer_fibers,
                current.inner_fibers,
                placed_text_props_raw,
            )?;

        let container = self.container;
        let root_context = self.renderer.root_host_context(&container)?;
        let outer_child_context = self.renderer.child_host_context(
            &root_context,
            &current.fixture.outer_element_type,
            &current.fixture.outer_props,
        )?;
        let inner_child_context = self.renderer.child_host_context(
            &outer_child_context,
            &current.fixture.inner_element_type,
            &current.fixture.inner_props,
        )?;
        let text_token_raw = text_token.raw();
        let placed_text_instance = self.renderer.create_text_instance(
            HostFiberTokenRef::new(
                &text_token_raw,
                HostFiberTokenPhase::Creation,
                HostFiberTokenTarget::TextInstance,
            ),
            &placed_text,
            &container,
            &inner_child_context,
        )?;
        let nested_parent_state_node_raw = Self::instance_state_node_raw(current.inner_instance);
        let placed_text_state_node_raw = Self::text_state_node_raw(placed_text_instance);
        self.store
            .finish_test_renderer_nested_host_parent_text_placement_canary_fibers(
                next_outer_fibers,
                next_inner_fibers,
                placed_text_fiber,
                placed_text_state_node_raw,
                placed_text_props_raw,
            )?;

        let commit = self.commit_host_root_render_for_canary(render)?;
        let fiber_inspection = self.describe_committed_fiber_tree_for_canary(&commit)?;
        let commit_diagnostics = inspect_test_renderer_host_output_canary_commit(&commit);
        let host_parent_placement_apply_count =
            commit.test_only_host_parent_placement_apply_count_for_canary();
        if !commit.has_test_only_host_parent_placement_apply_for_canary(
            nested_parent_state_node_raw,
            placed_text_state_node_raw,
        ) {
            return Err(TestRendererRootError::MissingHostParentPlacementApply {
                parent_state_node_raw: nested_parent_state_node_raw,
                child_state_node_raw: placed_text_state_node_raw,
            });
        }

        let mut inner_instance = current.inner_instance;
        let commit_state = self.renderer.prepare_for_commit(&container)?;
        self.renderer
            .append_child(&mut inner_instance, HostChild::Text(&placed_text_instance))?;
        self.renderer.reset_after_commit(&container, commit_state)?;
        let snapshot = self.diagnostic_container_snapshot()?;
        let placed_text_snapshot = self.renderer.snapshot_text(&placed_text_instance)?;
        self.current_nested_host_output = Some(TestRendererCurrentNestedHostOutput {
            fixture: current.fixture,
            outer_fibers: next_outer_fibers,
            inner_fibers: next_inner_fibers,
            outer_instance: current.outer_instance,
            inner_instance,
            text: current.text,
        });
        self.current_host_output = None;

        Ok(TestRendererNestedHostParentPlacedHostOutput {
            scheduled_update_sequence,
            render,
            outer_fibers: next_outer_fibers,
            inner_fibers: next_inner_fibers,
            commit,
            fiber_inspection,
            commit_diagnostics,
            previous_snapshot,
            snapshot,
            placed_text_snapshot,
            nested_parent_state_node_raw,
            placed_text_state_node_raw,
            host_parent_placement_apply_count,
        })
    }

    pub fn render_and_commit_host_output_insert_before_stable_sibling_for_canary(
        &mut self,
    ) -> Result<Option<TestRendererStableSiblingInsertedHostOutput>, TestRendererRootError> {
        self.render_and_commit_host_output_insert_before_current_sibling_for_canary(
            StableSiblingInsertionCanaryMode::StableCommittedSibling,
        )
    }

    pub fn render_and_commit_host_output_insert_before_ambiguous_sibling_for_canary(
        &mut self,
    ) -> Result<Option<TestRendererStableSiblingInsertedHostOutput>, TestRendererRootError> {
        self.render_and_commit_host_output_insert_before_current_sibling_for_canary(
            StableSiblingInsertionCanaryMode::AmbiguousMissingSiblingStateNode,
        )
    }

    fn render_and_commit_host_output_insert_before_current_sibling_for_canary(
        &mut self,
        mode: StableSiblingInsertionCanaryMode,
    ) -> Result<Option<TestRendererStableSiblingInsertedHostOutput>, TestRendererRootError> {
        let Some(update) = self.scheduled_updates.last() else {
            return Ok(None);
        };
        if update.kind() != TestRendererRootUpdateKind::Update {
            return Err(TestRendererRootError::UnexpectedHostOutputUpdateKind {
                expected: TestRendererRootUpdateKind::Update,
                actual: update.kind(),
            });
        }
        let stable = self.current_host_output.clone().ok_or(
            TestRendererRootError::MissingCommittedHostOutput {
                operation: TestRendererRootUpdateKind::Update,
            },
        )?;
        let Some(render) = self.render_latest_scheduled_host_root_for_commit_handoff()? else {
            return Ok(None);
        };
        let inserted_fixture = self
            .host_output_fixture(render.resulting_element())?
            .clone();
        let previous_snapshot = self.diagnostic_container_snapshot()?;
        let stable_fibers = prepare_test_renderer_host_output_update_canary_fibers(
            &mut self.store,
            render,
            stable.fibers,
            stable.fixture.canary_fixture,
            Self::instance_state_node_raw(stable.instance),
            Self::text_state_node_raw(stable.text),
        )?;
        let inserted_prepared = prepare_test_renderer_host_output_canary_fibers(
            &mut self.store,
            render,
            inserted_fixture.canary_fixture,
        )?;
        self.store
            .prepare_test_renderer_host_output_stable_sibling_insertion_children_for_canary(
                render,
                inserted_prepared,
                stable_fibers,
                mode == StableSiblingInsertionCanaryMode::AmbiguousMissingSiblingStateNode,
            )?;

        let (inserted_instance, inserted_text) =
            self.create_detached_host_output_for_canary(&inserted_fixture, inserted_prepared)?;
        let inserted_completed = finish_test_renderer_host_output_canary_fibers(
            &mut self.store,
            inserted_prepared,
            Self::instance_state_node_raw(inserted_instance),
            Self::text_state_node_raw(inserted_text),
        )?;
        let commit = self.commit_host_root_render_for_canary(render)?;
        let commit_diagnostics = inspect_test_renderer_host_output_canary_commit(&commit);
        let placement = self.stable_sibling_insertion_diagnostics_for_canary(
            &commit,
            inserted_completed,
            stable_fibers,
        )?;

        let mut container = self.container;
        let commit_state = self.renderer.prepare_for_commit(&container)?;
        let mutation_status = if placement.can_insert_before()
            && placement.apply_kind()
                == TestRendererStableSiblingInsertionApplyKind::InsertInContainerBefore
        {
            self.renderer.insert_in_container_before(
                &mut container,
                HostChild::Instance(&inserted_instance),
                HostChild::Instance(&stable.instance),
            )?;
            TestRendererStableSiblingInsertionMutationStatus::AppliedInsertInContainerBefore
        } else {
            TestRendererStableSiblingInsertionMutationStatus::RecordedOnly
        };
        self.renderer.reset_after_commit(&container, commit_state)?;
        let insertion_diagnostics = TestRendererStableSiblingInsertionDiagnostics {
            mutation_status,
            ..placement
        };
        let snapshot = self.diagnostic_container_snapshot()?;
        self.current_host_output = None;
        self.current_nested_host_output = None;

        Ok(Some(TestRendererStableSiblingInsertedHostOutput {
            render,
            stable_fibers,
            inserted_fibers: inserted_completed,
            commit,
            commit_diagnostics,
            insertion_diagnostics,
            previous_snapshot,
            snapshot,
        }))
    }

    pub fn render_and_commit_host_output_unmount_for_canary(
        &mut self,
    ) -> Result<Option<TestRendererUnmountedHostOutput>, TestRendererRootError> {
        self.render_and_commit_host_output_unmount_inner_for_canary(false)
    }

    pub fn render_and_commit_host_output_unmount_with_ref_passive_cleanup_for_canary(
        &mut self,
    ) -> Result<Option<TestRendererUnmountedHostOutput>, TestRendererRootError> {
        self.render_and_commit_host_output_unmount_inner_for_canary(true)
    }

    fn render_and_commit_host_output_unmount_inner_for_canary(
        &mut self,
        include_ref_passive_cleanup: bool,
    ) -> Result<Option<TestRendererUnmountedHostOutput>, TestRendererRootError> {
        let Some(update) = self.scheduled_updates.last() else {
            return Ok(None);
        };
        if update.kind() != TestRendererRootUpdateKind::Unmount {
            return Err(TestRendererRootError::UnexpectedHostOutputUpdateKind {
                expected: TestRendererRootUpdateKind::Unmount,
                actual: update.kind(),
            });
        }
        let current = self.current_host_output.clone().ok_or(
            TestRendererRootError::MissingCommittedHostOutput {
                operation: TestRendererRootUpdateKind::Unmount,
            },
        )?;
        let Some(render) = self.render_latest_scheduled_host_root_for_commit_handoff()? else {
            return Ok(None);
        };
        let previous_snapshot = self.diagnostic_container_snapshot()?;
        let ref_passive_cleanup = if include_ref_passive_cleanup {
            Some(
                prepare_test_renderer_host_output_unmount_ref_passive_cleanup_canary(
                    &mut self.store,
                    render,
                    current.fibers,
                )?,
            )
        } else {
            None
        };
        let deleted = prepare_test_renderer_host_output_unmount_canary_fibers(
            &mut self.store,
            render,
            current.fibers,
        )?;
        let mut commit = self.commit_host_root_render_for_canary(render)?;
        if let Some(ref_passive_cleanup) = ref_passive_cleanup {
            ref_passive_cleanup.record_passive_destroy_metadata_for_canary(&mut commit)?;
        }
        let commit_diagnostics = inspect_test_renderer_host_output_canary_commit(&commit);

        let mut container = self.container;
        let commit_state = self.renderer.prepare_for_commit(&container)?;
        self.renderer
            .remove_child_from_container(&mut container, HostChild::Instance(&current.instance))?;
        let deletion_token = deleted.component_deletion_token().raw();
        self.renderer.detach_deleted_instance(
            HostFiberTokenRef::new(
                &deletion_token,
                HostFiberTokenPhase::Deletion,
                HostFiberTokenTarget::Instance,
            ),
            current.instance,
        )?;
        self.renderer.reset_after_commit(&container, commit_state)?;
        let host_node_cleanup = self.host_nodes.apply_cleanup(self.root_id, &commit);
        let snapshot = self.diagnostic_container_snapshot()?;
        let detached_instance_snapshot = self.renderer.snapshot_instance(&current.instance)?;
        self.current_host_output = None;
        self.current_nested_host_output = None;

        Ok(Some(TestRendererUnmountedHostOutput {
            render,
            deleted_fibers: deleted,
            commit,
            commit_diagnostics,
            host_node_cleanup,
            previous_snapshot,
            snapshot,
            detached_instance_snapshot,
        }))
    }

    pub fn diagnostic_container_snapshot(
        &self,
    ) -> Result<TestContainerSnapshot, TestRendererRootError> {
        Ok(self.renderer.snapshot_container(&self.container)?)
    }

    fn stable_sibling_insertion_diagnostics_for_canary(
        &self,
        commit: &HostRootCommitRecord,
        inserted: TestRendererHostOutputCanaryCompletedFibers,
        stable: TestRendererHostOutputCanaryUpdatedFibers,
    ) -> Result<TestRendererStableSiblingInsertionDiagnostics, TestRendererRootError> {
        let placement_records = commit.host_root_placement_apply_diagnostics_for_canary();
        if placement_records.is_empty() {
            return Err(
                TestRendererStableSiblingInsertionCanaryError::MissingPlacementRecord.into(),
            );
        }
        if placement_records.len() != 1 {
            return Err(
                TestRendererStableSiblingInsertionCanaryError::MultiplePlacementRecords {
                    actual: placement_records.len(),
                }
                .into(),
            );
        }

        let placement = placement_records[0];
        if placement.fiber() != inserted.component() {
            return Err(
                TestRendererStableSiblingInsertionCanaryError::UnexpectedInsertedFiber.into(),
            );
        }
        if placement.sibling() != Some(stable.component()) {
            return Err(
                TestRendererStableSiblingInsertionCanaryError::UnexpectedStableSibling.into(),
            );
        }

        macro_rules! fiber_handle {
            ($fiber:expr) => {{
                let fiber = $fiber;
                TestRendererFiberHandleDiagnostics {
                    arena_id: fiber.arena_id().get(),
                    slot: fiber.slot().get(),
                    generation: fiber.generation().get(),
                }
            }};
        }

        Ok(TestRendererStableSiblingInsertionDiagnostics {
            apply_kind: TestRendererStableSiblingInsertionApplyKind::from_reconciler_apply_kind(
                placement.apply_kind(),
            ),
            sibling_status:
                TestRendererStableSiblingInsertionSiblingStatus::from_reconciler_sibling_status(
                    placement.sibling_status(),
                ),
            mutation_status: TestRendererStableSiblingInsertionMutationStatus::RecordedOnly,
            fiber: fiber_handle!(placement.fiber()),
            sibling: placement.sibling().map(|fiber| fiber_handle!(fiber)),
            state_node_raw: placement.state_node_raw(),
            sibling_state_node_raw: placement.sibling_state_node_raw(),
            can_insert_before: placement.can_insert_before(),
        })
    }
}
