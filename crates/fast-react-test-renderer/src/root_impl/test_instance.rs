use super::super::*;

impl TestRendererRoot {
    pub fn describe_private_test_instance_find_all_query_for_canary(
        &self,
        output: &TestRendererCommittedHostOutput,
    ) -> Result<TestRendererPrivateTestInstanceFindAllQueryDiagnostics, TestRendererRootError> {
        let tree_report = self.describe_private_tree_metadata_for_canary(output)?;

        Ok(Self::private_test_instance_find_all_query_from_tree_report(
            &tree_report,
        ))
    }

    pub fn describe_private_test_instance_find_all_query_after_update_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
    ) -> Result<TestRendererPrivateTestInstanceFindAllQueryDiagnostics, TestRendererRootError> {
        let tree_report = self.describe_private_tree_metadata_after_update_for_canary(output)?;

        Ok(Self::private_test_instance_find_all_query_from_tree_report(
            &tree_report,
        ))
    }

    pub fn describe_private_test_instance_find_by_query_for_canary(
        &self,
        output: &TestRendererCommittedHostOutput,
    ) -> Result<TestRendererPrivateTestInstanceFindByQueryDiagnostics, TestRendererRootError> {
        let find_all_report =
            self.describe_private_test_instance_find_all_query_for_canary(output)?;

        Ok(Self::private_test_instance_find_by_query_from_find_all_report(&find_all_report))
    }

    pub fn describe_private_test_instance_find_by_query_after_update_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
    ) -> Result<TestRendererPrivateTestInstanceFindByQueryDiagnostics, TestRendererRootError> {
        let find_all_report =
            self.describe_private_test_instance_find_all_query_after_update_for_canary(output)?;

        Ok(Self::private_test_instance_find_by_query_from_find_all_report(&find_all_report))
    }

    pub fn describe_private_test_instance_query_bridge_preflight_for_canary(
        &self,
        output: &TestRendererCommittedHostOutput,
    ) -> Result<TestRendererPrivateTestInstanceQueryBridgePreflightDiagnostics, TestRendererRootError>
    {
        let find_all_report =
            self.describe_private_test_instance_find_all_query_for_canary(output)?;
        let find_by_report =
            Self::private_test_instance_find_by_query_from_find_all_report(&find_all_report);

        Ok(
            Self::private_test_instance_query_bridge_preflight_from_query_reports(
                &find_all_report,
                &find_by_report,
            ),
        )
    }

    pub fn describe_private_test_instance_query_bridge_preflight_after_update_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
    ) -> Result<TestRendererPrivateTestInstanceQueryBridgePreflightDiagnostics, TestRendererRootError>
    {
        let find_all_report =
            self.describe_private_test_instance_find_all_query_after_update_for_canary(output)?;
        let find_by_report =
            Self::private_test_instance_find_by_query_from_find_all_report(&find_all_report);

        Ok(
            Self::private_test_instance_query_bridge_preflight_from_query_reports(
                &find_all_report,
                &find_by_report,
            ),
        )
    }

    pub fn describe_private_test_instance_query_after_create_native_execution_for_canary(
        &self,
        output: &TestRendererCommittedHostOutput,
        execution: TestRendererPrivateCreateNativeBridgeHostOutputHandoff,
    ) -> Result<TestRendererPrivateTestInstanceNativeQueryExecutionEvidence, TestRendererRootError>
    {
        self.validate_private_test_instance_create_native_execution_record_for_canary(execution)?;
        let preflight =
            self.describe_private_test_instance_query_bridge_preflight_for_canary(output)?;
        let find_by = self.describe_private_test_instance_find_by_query_for_canary(output)?;

        self.private_test_instance_native_query_execution_evidence_from_reports(
            "create",
            "create().root/ReactTestInstance.findByType",
            TEST_RENDERER_PRIVATE_CREATE_NATIVE_BRIDGE_HOST_OUTPUT_HANDOFF_DIAGNOSTIC_ID,
            TEST_RENDERER_PRIVATE_CREATE_NATIVE_BRIDGE_HOST_OUTPUT_HANDOFF_STATUS,
            TestRendererRootUpdateKind::Create,
            true,
            false,
            &preflight,
            &find_by,
        )
    }

    pub fn describe_private_test_instance_query_after_update_native_execution_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
        execution: TestRendererUpdateNativeBridgeAdmission,
    ) -> Result<TestRendererPrivateTestInstanceNativeQueryExecutionEvidence, TestRendererRootError>
    {
        self.validate_private_test_instance_update_native_execution_record_for_canary(execution)?;
        let preflight = self
            .describe_private_test_instance_query_bridge_preflight_after_update_for_canary(
                output,
            )?;
        let find_by =
            self.describe_private_test_instance_find_by_query_after_update_for_canary(output)?;

        self.private_test_instance_native_query_execution_evidence_from_reports(
            "update",
            "create().update -> create().root/ReactTestInstance.findByType",
            TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID,
            TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_STATUS,
            TestRendererRootUpdateKind::Update,
            false,
            true,
            &preflight,
            &find_by,
        )
    }

    pub fn describe_private_test_instance_class_root_query_after_update_native_execution_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
        execution: TestRendererUpdateNativeBridgeAdmission,
    ) -> Result<TestRendererPrivateTestInstanceClassRootQueryExecutionEvidence, TestRendererRootError>
    {
        self.validate_private_test_instance_update_native_execution_record_for_canary(execution)?;
        let preflight = self
            .describe_private_test_instance_query_bridge_preflight_after_update_for_canary(
                output,
            )?;
        let find_by =
            self.describe_private_test_instance_find_by_query_after_update_for_canary(output)?;
        let class_root =
            self.describe_private_get_instance_class_root_after_update_for_canary(output)?;
        let previous_child_text =
            Self::first_host_component_text_from_snapshot(output.previous_snapshot()).ok_or(
                TestRendererPrivateTestInstanceNativeQueryExecutionError::NativeExecutionRecordMismatch {
                    operation: "update",
                    reason: "updated-host-child-previous-text-missing",
                },
            )?;

        self.private_test_instance_class_root_query_execution_evidence_from_reports(
            TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID,
            TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_STATUS,
            previous_child_text,
            &preflight,
            &find_by,
            &class_root,
        )
    }

    pub fn describe_private_get_instance_class_root_for_canary(
        &self,
        output: &TestRendererCommittedHostOutput,
    ) -> Result<TestRendererPrivateGetInstanceClassRootReport, TestRendererRootError> {
        let tree_report = self.describe_private_tree_metadata_for_canary(output)?;

        Ok(Self::private_get_instance_class_root_from_tree_report(
            tree_report,
        ))
    }

    pub fn describe_private_get_instance_class_root_after_update_for_canary(
        &self,
        output: &TestRendererUpdatedHostOutput,
    ) -> Result<TestRendererPrivateGetInstanceClassRootReport, TestRendererRootError> {
        let tree_report = self.describe_private_tree_metadata_after_update_for_canary(output)?;

        Ok(Self::private_get_instance_class_root_from_tree_report(
            tree_report,
        ))
    }

    fn private_test_instance_find_all_query_from_tree_report(
        tree_report: &TestRendererPrivateTreeMetadataReport,
    ) -> TestRendererPrivateTestInstanceFindAllQueryDiagnostics {
        let host_component = tree_report.host_component();
        let host_text = tree_report.host_text();
        let candidate_fiber_tags = vec![host_component.fiber_tag()];
        let skipped_fiber_tags = vec![host_text.fiber_tag()];

        TestRendererPrivateTestInstanceFindAllQueryDiagnostics {
            diagnostic_name: TEST_RENDERER_PRIVATE_TEST_INSTANCE_FIND_ALL_DIAGNOSTIC_NAME,
            source_tree_diagnostic_name: tree_report.diagnostic_name(),
            host_output_update_kind: tree_report.host_output_update_kind(),
            host_output_snapshot_current: tree_report.host_output_snapshot_current(),
            traversal_source: "ReactTestRenderer.js findAll(root, predicate, options)",
            traversal_order: "self-then-descendants",
            default_deep: true,
            candidate_fiber_tags: candidate_fiber_tags.clone(),
            skipped_fiber_tags: skipped_fiber_tags.clone(),
            type_predicate: TestRendererPrivateTestInstanceFindAllPredicateDiagnostic {
                predicate_kind: TestRendererPrivateTestInstanceFindAllPredicateKind::Type,
                source: "ReactTestRenderer.js ReactTestInstance.findAllByType",
                predicate_source: "node => node.type === type",
                expected_type: Some(host_component.element_type().clone()),
                expected_props: None,
                evaluated_fiber_tags: candidate_fiber_tags.clone(),
                matched_fiber_tags: vec![host_component.fiber_tag()],
                rejected_fiber_tags: Vec::new(),
                skipped_text_child_count: skipped_fiber_tags.len(),
                predicate_execution: false,
                public_query_method_available: false,
            },
            props_predicate: TestRendererPrivateTestInstanceFindAllPredicateDiagnostic {
                predicate_kind: TestRendererPrivateTestInstanceFindAllPredicateKind::Props,
                source: "ReactTestRenderer.js ReactTestInstance.findAllByProps",
                predicate_source: "node => node.props && propsMatch(node.props, props)",
                expected_type: None,
                expected_props: Some(host_component.props().clone()),
                evaluated_fiber_tags: candidate_fiber_tags.clone(),
                matched_fiber_tags: vec![host_component.fiber_tag()],
                rejected_fiber_tags: Vec::new(),
                skipped_text_child_count: skipped_fiber_tags.len(),
                predicate_execution: false,
                public_query_method_available: false,
            },
            predicate_like: TestRendererPrivateTestInstanceFindAllPredicateDiagnostic {
                predicate_kind: TestRendererPrivateTestInstanceFindAllPredicateKind::PredicateLike,
                source: "ReactTestRenderer.js ReactTestInstance.findAll",
                predicate_source: "metadata-only predicate matching accepted type and props diagnostics",
                expected_type: Some(host_component.element_type().clone()),
                expected_props: Some(host_component.props().clone()),
                evaluated_fiber_tags: candidate_fiber_tags,
                matched_fiber_tags: vec![host_component.fiber_tag()],
                rejected_fiber_tags: Vec::new(),
                skipped_text_child_count: skipped_fiber_tags.len(),
                predicate_execution: false,
                public_query_method_available: false,
            },
            public_blockers: tree_report.public_blockers(),
            public_test_instance_object_available: false,
            public_query_methods_available: false,
            compatibility_claimed: false,
        }
    }

    fn private_test_instance_find_by_query_from_find_all_report(
        find_all_report: &TestRendererPrivateTestInstanceFindAllQueryDiagnostics,
    ) -> TestRendererPrivateTestInstanceFindByQueryDiagnostics {
        let type_predicate = find_all_report.type_predicate();
        let props_predicate = find_all_report.props_predicate();
        let expected_type = type_predicate.expected_type().cloned();
        let expected_type_name = expected_type
            .as_ref()
            .map(TestElementType::as_str)
            .unwrap_or("Unknown");
        let expected_props = props_predicate.expected_props().cloned();
        let find_all_candidate_fiber_tags = find_all_report.candidate_fiber_tags().to_vec();
        let find_all_skipped_fiber_tags = find_all_report.skipped_fiber_tags().to_vec();

        TestRendererPrivateTestInstanceFindByQueryDiagnostics {
            diagnostic_name: TEST_RENDERER_PRIVATE_TEST_INSTANCE_FIND_BY_DIAGNOSTIC_NAME,
            source_find_all_diagnostic_name: find_all_report.diagnostic_name(),
            source_tree_diagnostic_name: find_all_report.source_tree_diagnostic_name(),
            host_output_update_kind: find_all_report.host_output_update_kind(),
            host_output_snapshot_current: find_all_report.host_output_snapshot_current(),
            source: "ReactTestRenderer.js ReactTestInstance.findByType/findByProps",
            accepted_find_all_traversal_source: find_all_report.traversal_source(),
            effective_deep: false,
            expect_one: true,
            find_all_candidate_fiber_tags,
            find_all_skipped_fiber_tags: find_all_skipped_fiber_tags.clone(),
            find_by_type: TestRendererPrivateTestInstanceFindByResultDiagnostic {
                query_kind: TestRendererPrivateTestInstanceFindByQueryKind::Type,
                public_surface: "ReactTestInstance.findByType",
                source: "ReactTestRenderer.js ReactTestInstance.findByType",
                based_on_find_all_source: type_predicate.source(),
                based_on_predicate_kind: type_predicate.predicate_kind(),
                expect_one_message: format!("with node type: \"{expected_type_name}\""),
                expected_type,
                expected_props: None,
                effective_deep: false,
                expect_one: true,
                result_kind: "single",
                expected_canary_match_count: type_predicate.matched_candidate_count(),
                matched_candidate_count: type_predicate.matched_candidate_count(),
                candidate_fiber_tags: type_predicate.matched_fiber_tags().to_vec(),
                traversed_candidate_fiber_tags: type_predicate.evaluated_fiber_tags().to_vec(),
                skipped_fiber_tags: find_all_skipped_fiber_tags.clone(),
                zero_match_error_prefix: "No instances found ",
                duplicate_match_error_prefix: "Expected 1 but found N instances ",
                predicate_execution: type_predicate.predicate_execution(),
                public_query_method_available: false,
                public_test_instance_object_available: false,
                compatibility_claimed: false,
            },
            find_by_props: TestRendererPrivateTestInstanceFindByResultDiagnostic {
                query_kind: TestRendererPrivateTestInstanceFindByQueryKind::Props,
                public_surface: "ReactTestInstance.findByProps",
                source: "ReactTestRenderer.js ReactTestInstance.findByProps",
                based_on_find_all_source: props_predicate.source(),
                based_on_predicate_kind: props_predicate.predicate_kind(),
                expect_one_message: format!(
                    "with props: {}",
                    if expected_props.as_ref().is_some_and(
                        |props| props.text_content().is_none() && props.attributes().is_empty()
                    ) {
                        "{}"
                    } else {
                        "<private-props>"
                    }
                ),
                expected_type: None,
                expected_props,
                effective_deep: false,
                expect_one: true,
                result_kind: "single",
                expected_canary_match_count: props_predicate.matched_candidate_count(),
                matched_candidate_count: props_predicate.matched_candidate_count(),
                candidate_fiber_tags: props_predicate.matched_fiber_tags().to_vec(),
                traversed_candidate_fiber_tags: props_predicate.evaluated_fiber_tags().to_vec(),
                skipped_fiber_tags: find_all_skipped_fiber_tags,
                zero_match_error_prefix: "No instances found ",
                duplicate_match_error_prefix: "Expected 1 but found N instances ",
                predicate_execution: props_predicate.predicate_execution(),
                public_query_method_available: false,
                public_test_instance_object_available: false,
                compatibility_claimed: false,
            },
            public_blockers: find_all_report.public_blockers(),
            public_test_instance_object_available: false,
            public_query_methods_available: false,
            compatibility_claimed: false,
        }
    }

    fn private_test_instance_query_bridge_preflight_from_query_reports(
        find_all_report: &TestRendererPrivateTestInstanceFindAllQueryDiagnostics,
        find_by_report: &TestRendererPrivateTestInstanceFindByQueryDiagnostics,
    ) -> TestRendererPrivateTestInstanceQueryBridgePreflightDiagnostics {
        TestRendererPrivateTestInstanceQueryBridgePreflightDiagnostics {
            diagnostic_name:
                TEST_RENDERER_PRIVATE_TEST_INSTANCE_QUERY_BRIDGE_PREFLIGHT_DIAGNOSTIC_NAME,
            source_find_all_diagnostic_name: find_all_report.diagnostic_name(),
            source_find_by_diagnostic_name: find_by_report.diagnostic_name(),
            bridge_status: "private-test-instance-query-bridge-preflight-ready-public-test-instance-blocked",
            bridge_source: "FastReactTestRendererPrivateRootRequestRecord.rustCanaryMetadata.testInstanceQuery",
            wrapper_record_symbol: "fast.react_test_renderer.private_test_instance_wrapper_record",
            host_output_update_kind: find_by_report.host_output_update_kind(),
            host_output_snapshot_current: find_by_report.host_output_snapshot_current(),
            accepted_find_all_traversal_source: find_all_report.traversal_source(),
            accepted_find_by_source: find_by_report.source(),
            find_all_candidate_fiber_tags: find_all_report.candidate_fiber_tags().to_vec(),
            find_all_skipped_fiber_tags: find_all_report.skipped_fiber_tags().to_vec(),
            find_by_queries: vec![
                find_by_report.find_by_type().query_kind().as_str(),
                find_by_report.find_by_props().query_kind().as_str(),
            ],
            consumes_accepted_find_all_diagnostics: true,
            consumes_accepted_find_by_diagnostics: true,
            record_only_diagnostic_consumption: true,
            native_bridge_available: false,
            native_execution: false,
            rust_execution_from_js: false,
            public_blockers: find_all_report.public_blockers(),
            public_root_available: false,
            public_test_instance_object_available: false,
            public_query_methods_available: false,
            compatibility_claimed: false,
        }
    }

    #[allow(
        clippy::too_many_arguments,
        reason = "private test-instance evidence builder mirrors the native query report shape"
    )]
    fn private_test_instance_native_query_execution_evidence_from_reports(
        &self,
        operation: &'static str,
        public_surface: &'static str,
        source_execution_record_id: &'static str,
        source_execution_status: &'static str,
        expected_host_output_update_kind: TestRendererRootUpdateKind,
        consumes_create: bool,
        consumes_update: bool,
        preflight: &TestRendererPrivateTestInstanceQueryBridgePreflightDiagnostics,
        find_by_report: &TestRendererPrivateTestInstanceFindByQueryDiagnostics,
    ) -> Result<TestRendererPrivateTestInstanceNativeQueryExecutionEvidence, TestRendererRootError>
    {
        let query = find_by_report.find_by_type();
        let expected_type = query.expected_type().cloned().ok_or(
            TestRendererPrivateTestInstanceNativeQueryExecutionError::NativeExecutionRecordMismatch {
                operation,
                reason: "find-by-type-query-type-missing",
            },
        )?;
        let minimal_host_component_query_path = preflight.host_output_snapshot_current()
            && preflight.host_output_update_kind() == expected_host_output_update_kind
            && preflight.find_all_candidate_fiber_tags() == ["HostComponent"]
            && preflight.find_all_skipped_fiber_tags() == ["HostText"]
            && preflight.find_by_queries() == ["findByType", "findByProps"]
            && query.query_kind() == TestRendererPrivateTestInstanceFindByQueryKind::Type
            && query.result_kind() == "single"
            && query.matched_candidate_count() == 1
            && query.candidate_fiber_tags() == ["HostComponent"]
            && query.skipped_fiber_tags() == ["HostText"]
            && !query.public_query_method_available()
            && !query.public_test_instance_object_available()
            && !query.compatibility_claimed();

        if !minimal_host_component_query_path {
            return self.private_test_instance_native_query_execution_record_error(
                operation,
                "minimal-host-component-query-path-missing",
            );
        }

        Ok(
            TestRendererPrivateTestInstanceNativeQueryExecutionEvidence {
                diagnostic_name:
                    TEST_RENDERER_PRIVATE_TEST_INSTANCE_NATIVE_QUERY_EXECUTION_DIAGNOSTIC_NAME,
                status: TEST_RENDERER_PRIVATE_TEST_INSTANCE_NATIVE_QUERY_EXECUTION_STATUS,
                root: self.root_id,
                operation,
                public_surface,
                source_execution_record_id,
                source_execution_status,
                source_query_diagnostic_name: preflight.diagnostic_name(),
                query_bridge_preflight_status: preflight.bridge_status(),
                host_output_update_kind: preflight.host_output_update_kind(),
                host_output_snapshot_current: preflight.host_output_snapshot_current(),
                query_surface: query.public_surface(),
                query_kind: query.query_kind(),
                expected_type,
                result_fiber_tag: "HostComponent",
                result_kind: query.result_kind(),
                matched_candidate_count: query.matched_candidate_count(),
                query_path_candidate_count: preflight.find_all_candidate_fiber_tags().len(),
                skipped_text_child_count: preflight.find_all_skipped_fiber_tags().len(),
                consumes_accepted_native_create_execution_record: consumes_create,
                consumes_accepted_native_update_execution_record: consumes_update,
                consumes_private_test_instance_query_diagnostics: true,
                consumes_query_bridge_preflight: true,
                consumes_accepted_find_all_diagnostics: preflight
                    .consumes_accepted_find_all_diagnostics(),
                consumes_accepted_find_by_diagnostics: preflight
                    .consumes_accepted_find_by_diagnostics(),
                minimal_host_component_query_path,
                public_root_available: false,
                public_query_methods_available: false,
                public_test_instance_object_available: false,
                native_bridge_available: false,
                native_execution_available: false,
                compatibility_claimed: false,
            },
        )
    }

    pub(crate) fn private_test_instance_class_root_query_execution_evidence_from_reports(
        &self,
        source_execution_record_id: &'static str,
        source_execution_status: &'static str,
        previous_child_text: String,
        preflight: &TestRendererPrivateTestInstanceQueryBridgePreflightDiagnostics,
        find_by_report: &TestRendererPrivateTestInstanceFindByQueryDiagnostics,
        class_root: &TestRendererPrivateGetInstanceClassRootReport,
    ) -> Result<TestRendererPrivateTestInstanceClassRootQueryExecutionEvidence, TestRendererRootError>
    {
        let query = find_by_report.find_by_type();
        let child_element_type = query.expected_type().cloned().ok_or(
            TestRendererPrivateTestInstanceNativeQueryExecutionError::NativeExecutionRecordMismatch {
                operation: "update",
                reason: "find-by-type-query-type-missing",
            },
        )?;
        let rendered_host_component = class_root.rendered_host_component();
        let class_component = class_root.class_component();
        let current_child_text = class_root.rendered_host_text().text().to_owned();
        let host_child_updated = previous_child_text != current_child_text;

        let class_root_query_path = preflight.host_output_snapshot_current()
            && class_root.host_output_snapshot_current()
            && preflight.host_output_update_kind() == TestRendererRootUpdateKind::Update
            && find_by_report.host_output_update_kind() == TestRendererRootUpdateKind::Update
            && class_root.host_output_update_kind() == TestRendererRootUpdateKind::Update
            && class_root.accepted_class_fiber_shape()
                == &TEST_RENDERER_PRIVATE_GET_INSTANCE_ACCEPTED_CLASS_FIBER_SHAPE
            && class_component.fiber_tag() == "ClassComponent"
            && class_component.component_type()
                == TEST_RENDERER_PRIVATE_GET_INSTANCE_CLASS_COMPONENT_TYPE
            && class_component.rendered_child_fiber_tag() == "HostComponent"
            && class_component.rendered_child_count() == 1
            && rendered_host_component.fiber_tag() == "HostComponent"
            && rendered_host_component.element_type() == &child_element_type
            && rendered_host_component.rendered_child_count() == 1
            && rendered_host_component.rendered_text() == current_child_text
            && class_root.rendered_host_text().fiber_tag() == "HostText"
            && host_child_updated
            && !class_component.public_get_instance_available()
            && !class_root.public_get_instance_available()
            && !class_root.native_bridge_available()
            && !class_root.compatibility_claimed()
            && query.query_kind() == TestRendererPrivateTestInstanceFindByQueryKind::Type
            && query.result_kind() == "single"
            && query.matched_candidate_count() == 1
            && query.candidate_fiber_tags() == ["HostComponent"]
            && query.skipped_fiber_tags() == ["HostText"]
            && !query.public_query_method_available()
            && !query.public_test_instance_object_available()
            && !query.compatibility_claimed();

        if !class_root_query_path {
            return self.private_test_instance_native_query_execution_record_error(
                "update",
                "class-root-updated-host-child-query-path-missing",
            );
        }

        Ok(
            TestRendererPrivateTestInstanceClassRootQueryExecutionEvidence {
                diagnostic_name:
                    TEST_RENDERER_PRIVATE_TEST_INSTANCE_CLASS_QUERY_EXECUTION_DIAGNOSTIC_NAME,
                status: TEST_RENDERER_PRIVATE_TEST_INSTANCE_CLASS_QUERY_EXECUTION_STATUS,
                root: self.root_id,
                operation: "update",
                public_surface: "create().update -> create().root/ReactTestInstance.findByType",
                source_execution_record_id,
                source_execution_status,
                source_query_diagnostic_name: preflight.diagnostic_name(),
                source_get_instance_diagnostic_name: class_root.diagnostic_name(),
                query_bridge_preflight_status: preflight.bridge_status(),
                host_output_update_kind: TestRendererRootUpdateKind::Update,
                host_output_snapshot_current: true,
                accepted_class_fiber_shape:
                    TEST_RENDERER_PRIVATE_GET_INSTANCE_ACCEPTED_CLASS_FIBER_SHAPE,
                root_query_surface: "create().root",
                root_result_fiber_tag: class_component.fiber_tag(),
                root_component_type: class_component.component_type(),
                root_props: class_component.props().clone(),
                root_child_count: class_component.rendered_child_count(),
                child_query_surface: query.public_surface(),
                child_query_kind: query.query_kind(),
                child_fiber_tag: rendered_host_component.fiber_tag(),
                child_element_type,
                child_props: rendered_host_component.props().clone(),
                previous_child_text,
                current_child_text,
                host_child_updated,
                class_root_query_path: vec!["ClassComponent", "HostComponent"],
                updated_host_child_query_path: vec!["ClassComponent", "HostComponent", "HostText"],
                consumes_accepted_native_update_execution_record: true,
                consumes_private_test_instance_query_diagnostics: true,
                consumes_query_bridge_preflight: true,
                consumes_private_get_instance_class_root_diagnostics: true,
                public_root_available: false,
                public_query_methods_available: false,
                public_test_instance_object_available: false,
                public_get_instance_available: false,
                native_bridge_available: false,
                native_execution_available: false,
                compatibility_claimed: false,
            },
        )
    }

    fn first_host_component_text_from_snapshot(snapshot: &TestContainerSnapshot) -> Option<String> {
        let TestNodeSnapshot::Element(component) = snapshot.children().first()? else {
            return None;
        };
        let TestNodeSnapshot::Text(text) = component.children().first()? else {
            return None;
        };
        Some(text.text().to_owned())
    }

    fn validate_private_test_instance_create_native_execution_record_for_canary(
        &self,
        execution: TestRendererPrivateCreateNativeBridgeHostOutputHandoff,
    ) -> Result<(), TestRendererRootError> {
        if execution.diagnostic_id()
            != TEST_RENDERER_PRIVATE_CREATE_NATIVE_BRIDGE_HOST_OUTPUT_HANDOFF_DIAGNOSTIC_ID
        {
            return self.private_test_instance_native_query_execution_record_error(
                "create",
                "record-id-mismatch",
            );
        }
        if execution.status()
            != TEST_RENDERER_PRIVATE_CREATE_NATIVE_BRIDGE_HOST_OUTPUT_HANDOFF_STATUS
        {
            return self.private_test_instance_native_query_execution_record_error(
                "create",
                "status-mismatch",
            );
        }
        if execution.root() != self.root_id
            || execution.operation() != "create"
            || execution.public_surface() != "create()"
            || execution.scheduled_update_kind() != TestRendererRootUpdateKind::Create
            || execution.host_output_update_kind() != TestRendererRootUpdateKind::Create
            || execution.host_output_shape()
                != TestRendererPrivateToJsonHostOutputShape::SingleHostText
            || execution.serialization_gate_status()
                != TestRendererSerializationGateStatus::ReadyForPrivateSerializationDiagnostics
        {
            return self.private_test_instance_native_query_execution_record_error(
                "create",
                "route-metadata-stale",
            );
        }
        let host_output = execution.host_output();
        if host_output.container_child_count() != 1
            || host_output.instance_count() != 1
            || host_output.text_count() != 1
            || !host_output.real_host_output_available()
            || !execution.create_route_admission_accepted()
            || !execution.host_output_handoff_accepted()
            || !execution.actual_rust_create_host_output_handoff()
            || !execution.host_output_produced_by_rust()
        {
            return self.private_test_instance_native_query_execution_record_error(
                "create",
                "accepted-create-host-output-evidence-missing",
            );
        }
        if execution.public_create_behavior_available()
            || execution.public_serialization_available()
            || execution.public_test_instance_available()
            || execution.native_addon_loaded()
            || execution.native_bridge_available()
            || execution.native_execution()
            || execution.rust_execution_from_js()
            || execution.host_output_produced_from_js()
            || execution.compatibility_claimed()
        {
            return self.private_test_instance_native_query_execution_record_error(
                "create",
                "public-or-native-compatibility-claim",
            );
        }

        Ok(())
    }

    fn validate_private_test_instance_update_native_execution_record_for_canary(
        &self,
        execution: TestRendererUpdateNativeBridgeAdmission,
    ) -> Result<(), TestRendererRootError> {
        if execution.diagnostic_id()
            != TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_DIAGNOSTIC_ID
        {
            return self.private_test_instance_native_query_execution_record_error(
                "update",
                "record-id-mismatch",
            );
        }
        if execution.status() != TEST_RENDERER_PRIVATE_UPDATE_NATIVE_BRIDGE_ADMISSION_STATUS {
            return self.private_test_instance_native_query_execution_record_error(
                "update",
                "status-mismatch",
            );
        }
        if execution.root() != self.root_id
            || execution.route_dependency_id()
                != TEST_RENDERER_PRIVATE_TO_JSON_UPDATE_ROUTE_DEPENDENCY_ID
            || execution.update_route_admission_id()
                != TEST_RENDERER_PRIVATE_UPDATE_ROUTE_ADMISSION_RECORD_ID
            || execution.lifecycle() != TestRendererRootLifecycle::Active
            || execution.scheduled_update_kind() != TestRendererRootUpdateKind::Update
            || execution.host_output_update_kind() != TestRendererRootUpdateKind::Update
        {
            return self.private_test_instance_native_query_execution_record_error(
                "update",
                "route-metadata-stale",
            );
        }
        if !execution.update_route_admission_accepted()
            || !execution.lifecycle_evidence_accepted()
            || !execution.root_work_loop_handoff_accepted()
            || !execution.host_output_handoff_accepted()
            || !execution.text_update_apply_recorded()
            || execution.host_text_update_apply_count() != 1
            || execution.host_component_update_apply_count() != 1
        {
            return self.private_test_instance_native_query_execution_record_error(
                "update",
                "accepted-update-host-output-evidence-missing",
            );
        }
        if execution.public_update_compatibility_claimed()
            || execution.public_serialization_available()
            || execution.act_flushing_claimed()
            || execution.native_bridge_available()
            || execution.native_execution()
            || execution.compatibility_claimed()
        {
            return self.private_test_instance_native_query_execution_record_error(
                "update",
                "public-or-native-compatibility-claim",
            );
        }

        Ok(())
    }

    fn private_test_instance_native_query_execution_record_error<T>(
        &self,
        operation: &'static str,
        reason: &'static str,
    ) -> Result<T, TestRendererRootError> {
        Err(
            TestRendererPrivateTestInstanceNativeQueryExecutionError::NativeExecutionRecordMismatch {
                operation,
                reason,
            }
            .into(),
        )
    }

    fn private_get_instance_class_root_from_tree_report(
        tree_report: TestRendererPrivateTreeMetadataReport,
    ) -> TestRendererPrivateGetInstanceClassRootReport {
        let class_props = TestProps::new().with_attribute("label", "class-root");
        let class_instance = TestRendererPrivateGetInstanceClassInstanceDiagnostic {
            constructor_name: TEST_RENDERER_PRIVATE_GET_INSTANCE_CLASS_CONSTRUCTOR_NAME,
            props: class_props.clone(),
            state_marker: TEST_RENDERER_PRIVATE_GET_INSTANCE_CLASS_STATE_MARKER,
            private_instance_available: true,
            public_get_instance_available: false,
            react_public_result: "class-instance",
        };

        TestRendererPrivateGetInstanceClassRootReport {
            diagnostic_name: TEST_RENDERER_PRIVATE_GET_INSTANCE_DIAGNOSTIC_NAME,
            source_tree_diagnostic_name: tree_report.diagnostic_name(),
            gate: tree_report.gate().clone(),
            host_output_update_kind: tree_report.host_output_update_kind(),
            host_output_snapshot_current: tree_report.host_output_snapshot_current(),
            accepted_class_fiber_shape:
                TEST_RENDERER_PRIVATE_GET_INSTANCE_ACCEPTED_CLASS_FIBER_SHAPE,
            host_root_fail_closed: TestRendererPrivateGetInstanceFailClosedRootDiagnostic {
                root_fiber_shape: TEST_RENDERER_PRIVATE_GET_INSTANCE_HOST_ROOT_FIBER_SHAPE,
                root_child_fiber_tag: "HostComponent",
                react_public_result: "null-with-default-createNodeMock",
                public_get_instance_available: false,
                private_class_instance_available: false,
                public_behavior_fail_closed: true,
            },
            function_root_fail_closed: TestRendererPrivateGetInstanceFailClosedRootDiagnostic {
                root_fiber_shape: TEST_RENDERER_PRIVATE_GET_INSTANCE_FUNCTION_ROOT_FIBER_SHAPE,
                root_child_fiber_tag: "FunctionComponent",
                react_public_result: "null",
                public_get_instance_available: false,
                private_class_instance_available: false,
                public_behavior_fail_closed: true,
            },
            class_component: TestRendererPrivateGetInstanceClassComponentDiagnostic {
                fiber_tag: "ClassComponent",
                component_type: TEST_RENDERER_PRIVATE_GET_INSTANCE_CLASS_COMPONENT_TYPE,
                props: class_props,
                state_node_available: true,
                rendered_child_fiber_tag: tree_report.host_component().fiber_tag(),
                rendered_child_count: 1,
                instance: class_instance,
                public_get_instance_available: false,
            },
            rendered_host_component: tree_report.host_component().clone(),
            rendered_host_text: tree_report.host_text().clone(),
            public_blockers: tree_report.public_blockers(),
            public_get_instance_available: false,
            native_bridge_available: false,
            compatibility_claimed: false,
        }
    }
}
