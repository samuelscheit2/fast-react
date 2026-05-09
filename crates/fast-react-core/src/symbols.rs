use std::fmt::{self, Display, Formatter};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum ReactSymbolTag {
    TransitionalElement,
    Portal,
    Fragment,
    StrictMode,
    Profiler,
    Consumer,
    Context,
    ForwardRef,
    Suspense,
    SuspenseList,
    Memo,
    Lazy,
    Activity,
    ViewTransition,
    ClientReference,
}

impl ReactSymbolTag {
    pub const ALL: [Self; 15] = [
        Self::TransitionalElement,
        Self::Portal,
        Self::Fragment,
        Self::StrictMode,
        Self::Profiler,
        Self::Consumer,
        Self::Context,
        Self::ForwardRef,
        Self::Suspense,
        Self::SuspenseList,
        Self::Memo,
        Self::Lazy,
        Self::Activity,
        Self::ViewTransition,
        Self::ClientReference,
    ];

    pub const PUBLIC_RUNTIME_TAGS: [Self; 12] = [
        Self::TransitionalElement,
        Self::Portal,
        Self::Fragment,
        Self::StrictMode,
        Self::Profiler,
        Self::Consumer,
        Self::Context,
        Self::ForwardRef,
        Self::Suspense,
        Self::Memo,
        Self::Lazy,
        Self::Activity,
    ];

    pub const CONDITIONAL_OR_INTERNAL_TAGS: [Self; 3] = [
        Self::SuspenseList,
        Self::ViewTransition,
        Self::ClientReference,
    ];

    #[must_use]
    pub const fn symbol_for_name(self) -> &'static str {
        match self {
            Self::TransitionalElement => "react.transitional.element",
            Self::Portal => "react.portal",
            Self::Fragment => "react.fragment",
            Self::StrictMode => "react.strict_mode",
            Self::Profiler => "react.profiler",
            Self::Consumer => "react.consumer",
            Self::Context => "react.context",
            Self::ForwardRef => "react.forward_ref",
            Self::Suspense => "react.suspense",
            Self::SuspenseList => "react.suspense_list",
            Self::Memo => "react.memo",
            Self::Lazy => "react.lazy",
            Self::Activity => "react.activity",
            Self::ViewTransition => "react.view_transition",
            Self::ClientReference => "react.client.reference",
        }
    }

    #[must_use]
    pub const fn is_react_element_brand(self) -> bool {
        matches!(self, Self::TransitionalElement)
    }

    #[must_use]
    pub const fn is_exotic_component_brand(self) -> bool {
        matches!(
            self,
            Self::Consumer | Self::Context | Self::ForwardRef | Self::Memo | Self::Lazy
        )
    }

    #[must_use]
    pub const fn is_public_runtime_tag(self) -> bool {
        matches!(
            self,
            Self::TransitionalElement
                | Self::Portal
                | Self::Fragment
                | Self::StrictMode
                | Self::Profiler
                | Self::Consumer
                | Self::Context
                | Self::ForwardRef
                | Self::Suspense
                | Self::Memo
                | Self::Lazy
                | Self::Activity
        )
    }

    #[must_use]
    pub const fn is_conditional_or_internal_tag(self) -> bool {
        matches!(
            self,
            Self::SuspenseList | Self::ViewTransition | Self::ClientReference
        )
    }

    #[must_use]
    pub fn from_symbol_for_name(name: &str) -> Option<Self> {
        match name {
            "react.transitional.element" => Some(Self::TransitionalElement),
            "react.portal" => Some(Self::Portal),
            "react.fragment" => Some(Self::Fragment),
            "react.strict_mode" => Some(Self::StrictMode),
            "react.profiler" => Some(Self::Profiler),
            "react.consumer" => Some(Self::Consumer),
            "react.context" => Some(Self::Context),
            "react.forward_ref" => Some(Self::ForwardRef),
            "react.suspense" => Some(Self::Suspense),
            "react.suspense_list" => Some(Self::SuspenseList),
            "react.memo" => Some(Self::Memo),
            "react.lazy" => Some(Self::Lazy),
            "react.activity" => Some(Self::Activity),
            "react.view_transition" => Some(Self::ViewTransition),
            "react.client.reference" => Some(Self::ClientReference),
            _ => None,
        }
    }
}

impl Display for ReactSymbolTag {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        formatter.write_str(self.symbol_for_name())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn symbol_names_match_react_19_2_6_symbol_for_tags() {
        let names: Vec<_> = ReactSymbolTag::ALL
            .into_iter()
            .map(ReactSymbolTag::symbol_for_name)
            .collect();

        assert_eq!(
            names,
            vec![
                "react.transitional.element",
                "react.portal",
                "react.fragment",
                "react.strict_mode",
                "react.profiler",
                "react.consumer",
                "react.context",
                "react.forward_ref",
                "react.suspense",
                "react.suspense_list",
                "react.memo",
                "react.lazy",
                "react.activity",
                "react.view_transition",
                "react.client.reference",
            ]
        );
    }

    #[test]
    fn public_symbol_subset_excludes_conditional_or_internal_tags() {
        assert_eq!(
            ReactSymbolTag::PUBLIC_RUNTIME_TAGS
                .into_iter()
                .map(ReactSymbolTag::symbol_for_name)
                .collect::<Vec<_>>(),
            vec![
                "react.transitional.element",
                "react.portal",
                "react.fragment",
                "react.strict_mode",
                "react.profiler",
                "react.consumer",
                "react.context",
                "react.forward_ref",
                "react.suspense",
                "react.memo",
                "react.lazy",
                "react.activity",
            ]
        );
        assert!(ReactSymbolTag::SuspenseList.is_conditional_or_internal_tag());
        assert!(ReactSymbolTag::ViewTransition.is_conditional_or_internal_tag());
        assert!(ReactSymbolTag::ClientReference.is_conditional_or_internal_tag());
        assert!(!ReactSymbolTag::SuspenseList.is_public_runtime_tag());
    }

    #[test]
    fn parses_known_symbol_names_only() {
        assert_eq!(
            ReactSymbolTag::from_symbol_for_name("react.transitional.element"),
            Some(ReactSymbolTag::TransitionalElement)
        );
        assert_eq!(ReactSymbolTag::from_symbol_for_name("react.element"), None);
    }

    #[test]
    fn classifies_element_and_exotic_brands() {
        assert!(ReactSymbolTag::TransitionalElement.is_react_element_brand());
        assert!(!ReactSymbolTag::Portal.is_react_element_brand());
        assert!(ReactSymbolTag::Memo.is_exotic_component_brand());
        assert!(!ReactSymbolTag::Suspense.is_exotic_component_brand());
    }
}
