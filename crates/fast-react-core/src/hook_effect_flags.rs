//! React 19.2.6 hook effect flag bitset primitives.
//!
//! These constants are anchored to
//! `packages/react-reconciler/src/ReactHookEffectTags.js` from the React
//! `v19.2.6` source tag.

use std::ops::{BitAnd, BitAndAssign, BitOr, BitOrAssign, BitXor, BitXorAssign, Not, Sub};

pub const VALID_HOOK_EFFECT_FLAG_BITS: u8 = 0x0f;

#[repr(transparent)]
#[derive(Debug, Default, Clone, Copy, PartialEq, Eq, Hash)]
pub struct HookEffectFlags(u8);

impl HookEffectFlags {
    pub const NO: Self = Self(0);
    pub const ALL: Self = Self(VALID_HOOK_EFFECT_FLAG_BITS);

    pub const HAS_EFFECT: Self = Self(1 << 0);
    pub const INSERTION: Self = Self(1 << 1);
    pub const LAYOUT: Self = Self(1 << 2);
    pub const PASSIVE: Self = Self(1 << 3);

    pub const INSERTION_EFFECT: Self = Self(Self::HAS_EFFECT.0 | Self::INSERTION.0);
    pub const LAYOUT_EFFECT: Self = Self(Self::HAS_EFFECT.0 | Self::LAYOUT.0);
    pub const PASSIVE_EFFECT: Self = Self(Self::HAS_EFFECT.0 | Self::PASSIVE.0);
    pub const PHASE_MASK: Self = Self(Self::INSERTION.0 | Self::LAYOUT.0 | Self::PASSIVE.0);

    #[must_use]
    pub const fn from_bits(bits: u8) -> Option<Self> {
        if bits & !VALID_HOOK_EFFECT_FLAG_BITS == 0 {
            Some(Self(bits))
        } else {
            None
        }
    }

    #[must_use]
    pub const fn from_bits_truncate(bits: u8) -> Self {
        Self(bits & VALID_HOOK_EFFECT_FLAG_BITS)
    }

    #[must_use]
    pub const fn bits(self) -> u8 {
        self.0
    }

    #[must_use]
    pub const fn is_empty(self) -> bool {
        self.0 == 0
    }

    #[must_use]
    pub const fn is_non_empty(self) -> bool {
        self.0 != 0
    }

    #[must_use]
    pub const fn merge(self, other: Self) -> Self {
        Self(self.0 | other.0)
    }

    #[must_use]
    pub const fn remove(self, subset: Self) -> Self {
        Self(self.0 & !subset.0)
    }

    #[must_use]
    pub const fn intersect(self, other: Self) -> Self {
        Self(self.0 & other.0)
    }

    #[must_use]
    pub const fn contains_any(self, other: Self) -> bool {
        self.intersect(other).is_non_empty()
    }

    #[must_use]
    pub const fn contains_all(self, subset: Self) -> bool {
        self.0 & subset.0 == subset.0
    }

    #[must_use]
    pub const fn is_subset_of(self, set: Self) -> bool {
        set.contains_all(self)
    }

    #[must_use]
    pub const fn should_fire(self) -> bool {
        self.contains_all(Self::HAS_EFFECT)
    }

    #[must_use]
    pub const fn phase_flags(self) -> Self {
        self.intersect(Self::PHASE_MASK)
    }

    #[must_use]
    pub const fn fires_in_insertion(self) -> bool {
        self.should_fire() && self.contains_all(Self::INSERTION)
    }

    #[must_use]
    pub const fn fires_in_layout(self) -> bool {
        self.should_fire() && self.contains_all(Self::LAYOUT)
    }

    #[must_use]
    pub const fn fires_in_passive(self) -> bool {
        self.should_fire() && self.contains_all(Self::PASSIVE)
    }
}

impl BitOr for HookEffectFlags {
    type Output = Self;

    fn bitor(self, rhs: Self) -> Self::Output {
        self.merge(rhs)
    }
}

impl BitOrAssign for HookEffectFlags {
    fn bitor_assign(&mut self, rhs: Self) {
        *self = self.merge(rhs);
    }
}

impl BitAnd for HookEffectFlags {
    type Output = Self;

    fn bitand(self, rhs: Self) -> Self::Output {
        self.intersect(rhs)
    }
}

impl BitAndAssign for HookEffectFlags {
    fn bitand_assign(&mut self, rhs: Self) {
        *self = self.intersect(rhs);
    }
}

impl BitXor for HookEffectFlags {
    type Output = Self;

    fn bitxor(self, rhs: Self) -> Self::Output {
        Self(self.0 ^ rhs.0)
    }
}

impl BitXorAssign for HookEffectFlags {
    fn bitxor_assign(&mut self, rhs: Self) {
        *self = Self(self.0 ^ rhs.0);
    }
}

impl Sub for HookEffectFlags {
    type Output = Self;

    fn sub(self, rhs: Self) -> Self::Output {
        self.remove(rhs)
    }
}

impl Not for HookEffectFlags {
    type Output = Self;

    fn not(self) -> Self::Output {
        Self::from_bits_truncate(!self.0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hook_effect_flag_constants_match_react_19_2_6_source() {
        assert_eq!(VALID_HOOK_EFFECT_FLAG_BITS, 0x0f);
        assert_eq!(HookEffectFlags::NO.bits(), 0b0000);
        assert_eq!(HookEffectFlags::HAS_EFFECT.bits(), 0b0001);
        assert_eq!(HookEffectFlags::INSERTION.bits(), 0b0010);
        assert_eq!(HookEffectFlags::LAYOUT.bits(), 0b0100);
        assert_eq!(HookEffectFlags::PASSIVE.bits(), 0b1000);
        assert_eq!(HookEffectFlags::ALL.bits(), VALID_HOOK_EFFECT_FLAG_BITS);
    }

    #[test]
    fn hook_effect_masks_cover_phase_membership() {
        assert_eq!(HookEffectFlags::INSERTION_EFFECT.bits(), 0b0011);
        assert_eq!(HookEffectFlags::LAYOUT_EFFECT.bits(), 0b0101);
        assert_eq!(HookEffectFlags::PASSIVE_EFFECT.bits(), 0b1001);
        assert_eq!(HookEffectFlags::PHASE_MASK.bits(), 0b1110);

        assert!(HookEffectFlags::INSERTION_EFFECT.fires_in_insertion());
        assert!(HookEffectFlags::LAYOUT_EFFECT.fires_in_layout());
        assert!(HookEffectFlags::PASSIVE_EFFECT.fires_in_passive());
        assert!(!HookEffectFlags::INSERTION.fires_in_insertion());
        assert!(!HookEffectFlags::HAS_EFFECT.fires_in_passive());
    }

    #[test]
    fn hook_effect_flags_support_empty_and_bitwise_operations() {
        let mut flags = HookEffectFlags::NO;
        assert!(flags.is_empty());
        assert!(!flags.should_fire());

        flags |= HookEffectFlags::HAS_EFFECT | HookEffectFlags::LAYOUT;
        assert_eq!(flags, HookEffectFlags::LAYOUT_EFFECT);
        assert!(flags.is_non_empty());
        assert!(flags.contains_all(HookEffectFlags::HAS_EFFECT));
        assert!(flags.contains_any(HookEffectFlags::PHASE_MASK));
        assert_eq!(flags.phase_flags(), HookEffectFlags::LAYOUT);

        flags ^= HookEffectFlags::LAYOUT;
        assert_eq!(flags, HookEffectFlags::HAS_EFFECT);
        assert_eq!(
            HookEffectFlags::PASSIVE_EFFECT - HookEffectFlags::HAS_EFFECT,
            HookEffectFlags::PASSIVE
        );
        assert_eq!((!HookEffectFlags::NO).bits(), VALID_HOOK_EFFECT_FLAG_BITS);
    }

    #[test]
    fn hook_effect_flags_constructors_reject_unknown_bits() {
        assert_eq!(
            HookEffectFlags::from_bits(0b1111),
            Some(HookEffectFlags::ALL)
        );
        assert_eq!(HookEffectFlags::from_bits(0b1_0000), None);
        assert_eq!(
            HookEffectFlags::from_bits_truncate(u8::MAX),
            HookEffectFlags::ALL
        );
        assert!(HookEffectFlags::PASSIVE.is_subset_of(HookEffectFlags::PHASE_MASK));
    }
}
