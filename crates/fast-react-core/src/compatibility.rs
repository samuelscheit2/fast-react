use std::fmt::{self, Display, Formatter};

pub const REACT_COMPATIBILITY_TARGET: &str = "react@19.2.6";
pub const REACT_DOM_COMPATIBILITY_TARGET: &str = "react-dom@19.2.6";
pub const TYPES_REACT_COMPATIBILITY_TARGET: &str = "@types/react@19.2.14";

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct PackageCompatibilityTarget {
    package: &'static str,
    version: &'static str,
}

impl PackageCompatibilityTarget {
    #[must_use]
    pub const fn new(package: &'static str, version: &'static str) -> Self {
        Self { package, version }
    }

    #[must_use]
    pub const fn package(&self) -> &'static str {
        self.package
    }

    #[must_use]
    pub const fn version(&self) -> &'static str {
        self.version
    }
}

impl Display for PackageCompatibilityTarget {
    fn fmt(&self, formatter: &mut Formatter<'_>) -> fmt::Result {
        write!(formatter, "{}@{}", self.package, self.version)
    }
}

pub const REACT_PACKAGE_TARGET: PackageCompatibilityTarget =
    PackageCompatibilityTarget::new("react", "19.2.6");

pub const REACT_DOM_PACKAGE_TARGET: PackageCompatibilityTarget =
    PackageCompatibilityTarget::new("react-dom", "19.2.6");

pub const TYPES_REACT_PACKAGE_TARGET: PackageCompatibilityTarget =
    PackageCompatibilityTarget::new("@types/react", "19.2.14");

pub const COMPATIBILITY_TARGETS: [PackageCompatibilityTarget; 3] = [
    REACT_PACKAGE_TARGET,
    REACT_DOM_PACKAGE_TARGET,
    TYPES_REACT_PACKAGE_TARGET,
];

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn display_matches_package_version_labels() {
        assert_eq!(REACT_PACKAGE_TARGET.to_string(), REACT_COMPATIBILITY_TARGET);
        assert_eq!(
            REACT_DOM_PACKAGE_TARGET.to_string(),
            REACT_DOM_COMPATIBILITY_TARGET
        );
        assert_eq!(
            TYPES_REACT_PACKAGE_TARGET.to_string(),
            TYPES_REACT_COMPATIBILITY_TARGET
        );
    }
}
