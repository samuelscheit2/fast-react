use std::fmt::{self, Display, Formatter};

use crate::ReactSymbolTag;

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct ReactKey(String);

impl ReactKey {
    #[must_use]
    pub fn from_normalized(normalized_key: impl Into<String>) -> Self {
        Self(normalized_key.into())
    }

    #[must_use]
    pub fn as_str(&self) -> &str {
        &self.0
    }

    #[must_use]
    pub fn into_string(self) -> String {
        self.0
    }
}

impl AsRef<str> for ReactKey {
    fn as_ref(&self) -> &str {
        self.as_str()
    }
}

impl Display for ReactKey {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        formatter.write_str(self.as_str())
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct ReactOwner<Owner = ()> {
    handle: Owner,
}

impl<Owner> ReactOwner<Owner> {
    #[must_use]
    pub const fn from_handle(handle: Owner) -> Self {
        Self { handle }
    }

    #[must_use]
    pub const fn handle(&self) -> &Owner {
        &self.handle
    }

    #[must_use]
    pub fn into_handle(self) -> Owner {
        self.handle
    }
}

#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Hash)]
pub enum ReactOwnerSlot<Owner = ()> {
    #[default]
    NoOwner,
    Captured(ReactOwner<Owner>),
}

impl<Owner> ReactOwnerSlot<Owner> {
    #[must_use]
    pub const fn none() -> Self {
        Self::NoOwner
    }

    #[must_use]
    pub const fn captured(owner: ReactOwner<Owner>) -> Self {
        Self::Captured(owner)
    }

    #[must_use]
    pub const fn is_no_owner(&self) -> bool {
        matches!(self, Self::NoOwner)
    }

    #[must_use]
    pub const fn is_captured(&self) -> bool {
        matches!(self, Self::Captured(_))
    }

    #[must_use]
    pub fn owner(&self) -> Option<&ReactOwner<Owner>> {
        match self {
            Self::Captured(owner) => Some(owner),
            Self::NoOwner => None,
        }
    }

    #[must_use]
    pub fn handle(&self) -> Option<&Owner> {
        self.owner().map(ReactOwner::handle)
    }
}

#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Hash)]
pub enum ReactRefSlot<Ref = ()> {
    #[default]
    Unset,
    Null,
    Value(Ref),
}

impl<Ref> ReactRefSlot<Ref> {
    #[must_use]
    pub const fn unset() -> Self {
        Self::Unset
    }

    #[must_use]
    pub const fn null() -> Self {
        Self::Null
    }

    #[must_use]
    pub const fn value(value: Ref) -> Self {
        Self::Value(value)
    }

    #[must_use]
    pub const fn is_unset(&self) -> bool {
        matches!(self, Self::Unset)
    }

    #[must_use]
    pub const fn is_null(&self) -> bool {
        matches!(self, Self::Null)
    }

    #[must_use]
    pub const fn is_value(&self) -> bool {
        matches!(self, Self::Value(_))
    }

    #[must_use]
    pub const fn overrides_existing_ref(&self) -> bool {
        !matches!(self, Self::Unset)
    }

    #[must_use]
    pub fn as_ref(&self) -> ReactRefSlot<&Ref> {
        match self {
            Self::Unset => ReactRefSlot::Unset,
            Self::Null => ReactRefSlot::Null,
            Self::Value(value) => ReactRefSlot::Value(value),
        }
    }

    #[must_use]
    pub fn value_ref(&self) -> Option<&Ref> {
        match self {
            Self::Value(value) => Some(value),
            Self::Unset | Self::Null => None,
        }
    }

    #[must_use]
    pub fn map<Mapped>(self, map: impl FnOnce(Ref) -> Mapped) -> ReactRefSlot<Mapped> {
        match self {
            Self::Unset => ReactRefSlot::Unset,
            Self::Null => ReactRefSlot::Null,
            Self::Value(value) => ReactRefSlot::Value(map(value)),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ReactElementRecord<Type = (), Props = (), Ref = (), Owner = ()> {
    symbol_tag: ReactSymbolTag,
    element_type: Type,
    key: Option<ReactKey>,
    ref_slot: ReactRefSlot<Ref>,
    props: Props,
    owner: ReactOwnerSlot<Owner>,
}

impl<Type, Props, Ref, Owner> ReactElementRecord<Type, Props, Ref, Owner> {
    #[must_use]
    pub fn from_normalized_parts(
        element_type: Type,
        key: Option<ReactKey>,
        ref_slot: ReactRefSlot<Ref>,
        props: Props,
        owner: ReactOwnerSlot<Owner>,
    ) -> Self {
        Self {
            symbol_tag: ReactSymbolTag::TransitionalElement,
            element_type,
            key,
            ref_slot,
            props,
            owner,
        }
    }

    #[must_use]
    pub const fn symbol_tag(&self) -> ReactSymbolTag {
        self.symbol_tag
    }

    #[must_use]
    pub const fn element_type(&self) -> &Type {
        &self.element_type
    }

    #[must_use]
    pub fn key(&self) -> Option<&ReactKey> {
        self.key.as_ref()
    }

    #[must_use]
    pub const fn ref_slot(&self) -> &ReactRefSlot<Ref> {
        &self.ref_slot
    }

    #[must_use]
    pub const fn props(&self) -> &Props {
        &self.props
    }

    #[must_use]
    pub const fn owner_slot(&self) -> &ReactOwnerSlot<Owner> {
        &self.owner
    }

    #[must_use]
    pub fn owner(&self) -> Option<&ReactOwner<Owner>> {
        self.owner.owner()
    }

    #[must_use]
    pub fn owner_handle(&self) -> Option<&Owner> {
        self.owner.handle()
    }

    #[must_use]
    pub fn into_parts(
        self,
    ) -> (
        Type,
        Option<ReactKey>,
        ReactRefSlot<Ref>,
        Props,
        ReactOwnerSlot<Owner>,
    ) {
        (
            self.element_type,
            self.key,
            self.ref_slot,
            self.props,
            self.owner,
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn keys_store_already_normalized_strings() {
        let key = ReactKey::from_normalized("null");
        assert_eq!(key.as_str(), "null");
        assert_eq!(key.to_string(), "null");
    }

    #[test]
    fn owner_slots_store_explicit_owner_metadata() {
        assert!(ReactOwnerSlot::<usize>::none().is_no_owner());

        let owner = ReactOwner::from_handle(42);
        let slot = ReactOwnerSlot::captured(owner);
        assert!(slot.is_captured());
        assert_eq!(slot.handle(), Some(&42));
    }

    #[test]
    fn refs_distinguish_unset_null_and_value() {
        assert!(ReactRefSlot::<usize>::unset().is_unset());
        assert!(ReactRefSlot::<usize>::null().is_null());

        let slot = ReactRefSlot::value(7);
        assert!(slot.is_value());
        assert!(slot.overrides_existing_ref());
        assert_eq!(slot.value_ref(), Some(&7));
        assert!(!ReactRefSlot::<usize>::unset().overrides_existing_ref());
        assert!(ReactRefSlot::<usize>::null().overrides_existing_ref());
    }

    #[test]
    fn element_records_use_react_19_transitional_element_brand() {
        let element = ReactElementRecord::from_normalized_parts(
            "Example",
            Some(ReactKey::from_normalized("user-key")),
            ReactRefSlot::value("ref-handle"),
            ("props", 1),
            ReactOwnerSlot::captured(ReactOwner::from_handle("owner-handle")),
        );

        assert_eq!(element.symbol_tag(), ReactSymbolTag::TransitionalElement);
        assert_eq!(element.element_type(), &"Example");
        assert_eq!(element.key().map(ReactKey::as_str), Some("user-key"));
        assert_eq!(element.ref_slot().value_ref(), Some(&"ref-handle"));
        assert_eq!(element.props(), &("props", 1));
        assert_eq!(element.owner_handle(), Some(&"owner-handle"));
    }

    #[test]
    fn props_can_carry_ref_like_data_separately_from_ref_slot() {
        #[derive(Debug, PartialEq, Eq)]
        struct Props {
            ref_prop: &'static str,
        }

        let element = ReactElementRecord::from_normalized_parts(
            "button",
            None,
            ReactRefSlot::<&str>::Unset,
            Props {
                ref_prop: "regular-prop-ref",
            },
            ReactOwnerSlot::<()>::NoOwner,
        );

        assert_eq!(element.props().ref_prop, "regular-prop-ref");
        assert!(element.ref_slot().is_unset());
        assert!(element.owner_slot().is_no_owner());
    }

    #[test]
    fn element_records_round_trip_normalized_parts() {
        let element = ReactElementRecord::from_normalized_parts(
            "div",
            None,
            ReactRefSlot::<()>::Null,
            (),
            ReactOwnerSlot::<()>::NoOwner,
        );

        let (element_type, key, ref_slot, props, owner) = element.into_parts();
        assert_eq!(element_type, "div");
        assert_eq!(key, None);
        assert_eq!(ref_slot, ReactRefSlot::Null);
        assert_eq!(props, ());
        assert_eq!(owner, ReactOwnerSlot::NoOwner);
    }
}
