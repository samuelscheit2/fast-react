    #[cfg(test)]
    mod tests {
        use super::*;
        use crate::handle_table::{
            BridgeHandleKind, BridgeHandleTableError, PlaceholderRootRecord,
        };

        fn admitted_create_sequence() -> (
            BridgeHandleTable,
            NativeRootBridgeRequestSequenceValidator,
            BridgeEnvironmentId,
            BridgeHandle,
            BridgeHandle,
        ) {
            let environment_id = BridgeEnvironmentId::from_raw(468);
            let root_handle = BridgeHandle::new(environment_id, 1, 1, BridgeHandleKind::Root);
            let value_handle = BridgeHandle::new(environment_id, 2, 1, BridgeHandleKind::Value);
            let create = NativeRootBridgeRequestRecord::from_js_native_handoff_record(
                1,
                NativeRootBridgeRequestKind::Create,
                environment_id,
                root_handle,
                1,
                Some(value_handle),
                NativeRootBridgeRootHandleState::Active,
            );
            let mut table = BridgeHandleTable::new(environment_id);
            let mut validator = NativeRootBridgeRequestSequenceValidator::new();

            admit_js_native_root_bridge_handoff_record(&mut table, create, None).unwrap();
            validator.validate_next(&table, create).unwrap();

            (table, validator, environment_id, root_handle, value_handle)
        }

        #[test]
        fn sequence_teardown_rejects_late_create_without_reviving_next_generation_handles() {
            let (mut table, mut validator, environment_id, root_handle, value_handle) =
                admitted_create_sequence();
            let teardown = table.teardown_environment(environment_id);
            let late_root_handle = BridgeHandle::new(
                environment_id,
                root_handle.slot(),
                root_handle.generation() + 1,
                BridgeHandleKind::Root,
            );
            let late_value_handle = BridgeHandle::new(
                environment_id,
                value_handle.slot(),
                value_handle.generation() + 1,
                BridgeHandleKind::Value,
            );
            let late_create = NativeRootBridgeRequestRecord::from_js_native_handoff_record(
                2,
                NativeRootBridgeRequestKind::Create,
                environment_id,
                late_root_handle,
                1,
                Some(late_value_handle),
                NativeRootBridgeRootHandleState::Active,
            );

            assert!(teardown.environment_matched());
            assert_eq!(teardown.root_handles_invalidated(), 1);
            assert_eq!(teardown.value_handles_invalidated(), 1);

            let admission_error = admit_js_native_root_bridge_handoff_record(
                &mut table,
                late_create,
                Some(NativeRootBridgeRootHandleState::Active),
            )
            .unwrap_err();
            let validation_error = validator.validate_next(&table, late_create).unwrap_err();

            assert_eq!(
                admission_error,
                NativeRootBridgeRequestError::CreateAfterRootCreated { request_id: 2 }
            );
            assert_eq!(validation_error, admission_error);
            assert_eq!(
                table.get_root(root_handle).unwrap_err(),
                BridgeHandleTableError::StaleHandle {
                    handle: root_handle,
                    current_generation: 2,
                }
            );
            assert_eq!(
                table.get_value(value_handle).unwrap_err(),
                BridgeHandleTableError::StaleHandle {
                    handle: value_handle,
                    current_generation: 2,
                }
            );
            assert_eq!(
                table.get_root(late_root_handle).unwrap_err(),
                BridgeHandleTableError::StaleHandle {
                    handle: late_root_handle,
                    current_generation: 2,
                }
            );
            assert_eq!(
                table.get_value(late_value_handle).unwrap_err(),
                BridgeHandleTableError::StaleHandle {
                    handle: late_value_handle,
                    current_generation: 2,
                }
            );
        }

        #[test]
        fn sequence_teardown_keeps_root_value_and_transport_handles_stale() {
            let (mut table, _validator, environment_id, root_handle, value_handle) =
                admitted_create_sequence();
            table.teardown_environment(environment_id);

            let stale_root_render = NativeRootBridgeRequestRecord::from_js_native_handoff_record(
                2,
                NativeRootBridgeRequestKind::Render,
                environment_id,
                root_handle,
                1,
                Some(value_handle),
                NativeRootBridgeRootHandleState::Active,
            );
            let stale_root_error = admit_js_native_root_bridge_handoff_record(
                &mut table,
                stale_root_render,
                Some(NativeRootBridgeRootHandleState::Active),
            )
            .unwrap_err();

            assert_eq!(
                stale_root_error,
                NativeRootBridgeRequestError::HandleTable(BridgeHandleTableError::StaleHandle {
                    handle: root_handle,
                    current_generation: 2,
                })
            );

            let stale_root_transport_record = NativeRootBridgeJsonTransportRecord::new(
                3,
                "render",
                environment_id.raw(),
                NativeRootBridgeJsonTransportHandle::new(
                    environment_id.raw(),
                    root_handle.slot(),
                    root_handle.generation(),
                    "root",
                ),
                1,
                None,
                "active",
            );
            let stale_root_transport_request = stale_root_transport_record.decode().unwrap();
            let stale_root_transport_error = admit_js_native_root_bridge_handoff_record(
                &mut table,
                stale_root_transport_request,
                Some(NativeRootBridgeRootHandleState::Active),
            )
            .unwrap_err();

            assert_eq!(
                stale_root_transport_error,
                NativeRootBridgeRequestError::HandleTable(BridgeHandleTableError::StaleHandle {
                    handle: root_handle,
                    current_generation: 2,
                })
            );

            let replacement_root = table.insert_root(PlaceholderRootRecord::new(1));
            let stale_value_render = NativeRootBridgeRequestRecord::from_js_native_handoff_record(
                4,
                NativeRootBridgeRequestKind::Render,
                environment_id,
                replacement_root,
                1,
                Some(value_handle),
                NativeRootBridgeRootHandleState::Active,
            );
            let stale_value_error = admit_js_native_root_bridge_handoff_record(
                &mut table,
                stale_value_render,
                Some(NativeRootBridgeRootHandleState::Active),
            )
            .unwrap_err();

            assert_eq!(
                stale_value_error,
                NativeRootBridgeRequestError::HandleTable(BridgeHandleTableError::StaleHandle {
                    handle: value_handle,
                    current_generation: 2,
                })
            );

            let transport_record = NativeRootBridgeJsonTransportRecord::new(
                5,
                "render",
                environment_id.raw(),
                NativeRootBridgeJsonTransportHandle::new(
                    environment_id.raw(),
                    replacement_root.slot(),
                    replacement_root.generation(),
                    "root",
                ),
                1,
                Some(NativeRootBridgeJsonTransportHandle::new(
                    environment_id.raw(),
                    value_handle.slot(),
                    value_handle.generation(),
                    "value",
                )),
                "active",
            );
            let transport_request = transport_record.decode().unwrap();
            let transport_error = admit_js_native_root_bridge_handoff_record(
                &mut table,
                transport_request,
                Some(NativeRootBridgeRootHandleState::Active),
            )
            .unwrap_err();

            assert_eq!(
                transport_error,
                NativeRootBridgeRequestError::HandleTable(BridgeHandleTableError::StaleHandle {
                    handle: value_handle,
                    current_generation: 2,
                })
            );
            assert_eq!(
                table.get_value(value_handle).unwrap_err(),
                BridgeHandleTableError::StaleHandle {
                    handle: value_handle,
                    current_generation: 2,
                }
            );
        }
    }
