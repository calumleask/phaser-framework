# Bug 08 — Make dialogue documentation framework-specific

**Status:** Planned  
**Priority:** P3

The framework dialogue guide includes another repository's revision, working-tree files, game-specific validation and rollback instructions, and directs readers to a roadmap outside this package. The framework documentation should stand on its own and describe its API, ownership, usage and limits.

Revise the guide to keep framework-specific validation evidence, relevant rollback information and remaining review gates. Move or retain game integration evidence in the game repository's own documentation as appropriate; avoid requiring a sibling checkout to understand the framework contract. Preserve accurate historical validation and avoid implying that unperformed checks passed. Review the architecture link and any affected links for consistency.

Acceptance: the guide explains framework lifecycle, API and rollback without depending on another repository's files or working-tree state; its links resolve within the documented context and its validation claims remain accurate. Check the documentation and links against the current source and package configuration. Do not edit generated artifacts by hand.
