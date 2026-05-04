# UI Plan

## Status
Future shadcn/ui dashboard design only. No UI files or components are created in this milestone.

## shadcn-only interpretation
- All UI primitives must come from shadcn/ui.
- Custom application components are allowed only as thin compositions of shadcn primitives plus business logic.
- No custom design-system primitives and no third-party UI libraries without explicit approval.
- Use semantic tokens and shadcn component variants rather than raw color overrides.

## App shell
Recommended shadcn primitives:
- `Sidebar` for navigation.
- `Breadcrumb` for hierarchy.
- `Card` for dashboard panels.
- `DropdownMenu` for user/actions.
- `Command` for product search/command palette.
- `Separator` for layout separation.

## Product list screen
Purpose: triage products by quality and missing information.

Component tree:
```text
SidebarProvider
  AppSidebar
  Main
    Breadcrumb
    Card metrics summary
    Card filters
      FieldGroup / Field / Input / Select / ToggleGroup
    Card product table
      Table/Data Table pattern
      Badge status/category
      Progress or Badge for quality score band
      DropdownMenu row actions
```

Columns:
- Product title / SKU / identifier.
- Category.
- Provider/seller count.
- Quality score and band.
- Missing required/recommended attributes count.
- Candidate count.
- Source status and stale flag.
- Last synced/enriched date.

Score bands:
- 0-39: red/destructive semantic presentation.
- 40-69: amber/warning presentation.
- 70-84: neutral/informational presentation.
- 85-100: success/positive presentation.

## Product detail screen
Tabs using shadcn `Tabs`:
1. Overview.
2. Attributes.
3. Candidates.
4. Evidence.
5. Jobs.
6. Export history.

Recommended primitives:
- `Card`, `Tabs`, `Badge`, `Table`, `Sheet`, `Dialog`, `Alert`, `Tooltip`, `Popover`, `ScrollArea`, `Skeleton`, `Empty`.

## Source-vs-target diff review
Custom business component allowed: `ProductDiffReviewPanel`, composed from:
- `Card` for field groups.
- `Table` rows for attribute comparison.
- `Badge` for candidate status/confidence.
- `Button` for accept/reject/request-evidence actions.
- `Sheet` for evidence detail.
- `AlertDialog` for approval-sensitive actions.

State mapping:
| Candidate state | UI treatment | Allowed action |
| --- | --- | --- |
| `PROPOSED` | Pending badge | Approve, reject, request more evidence. |
| `APPROVED` | Approved badge | Include in draft export unless stale. |
| `REJECTED` | Muted/rejected badge | No export; view rationale. |
| `STALE_REVIEW_REQUIRED` | Warning alert | Re-review after source refresh. |
| `EXPORTED` | Exported badge | Read-only. |
| `IMPORT_FAILED` | Destructive alert | Rework candidate/export row. |

## Evidence panel
Use `Sheet` or `Dialog` with:
- `Card` for evidence metadata.
- `Badge` for confidence/source type.
- `Table` for field support mapping.
- `Alert` for policy-pending or low-confidence sources.
- `Button` links for opening source URLs.

Required evidence fields displayed:
- Source type.
- URL or document reference.
- Access date.
- Excerpt/snippet.
- PDF page if applicable.
- Extraction method.
- Confidence tier.
- Retention class.

## Job history screen
Use `Table`, `Badge`, `Progress`, `Alert`, `Collapsible`.
- Job type, status, started/completed timestamps.
- Error summary and retry/backoff state.
- Linked audit events.
- Products/candidates affected.

## Category completeness screen
Use `Card`, `Table`, `Badge`, `Chart` if needed.
- Category code/label.
- Required/recommended attributes.
- Coverage percentage.
- Drift/stale schema warning.
- Top missing attributes.

## Loading and empty states
- `Skeleton` for loading tables/details.
- `Empty` for no candidates/evidence/jobs.
- `Alert` for stale source, policy-pending evidence, or approval-gated actions.
- Toast via `sonner` for non-blocking feedback.

## Accessibility requirements
- Dialog/Sheet/Drawer always include titles.
- Buttons must have accessible labels for icon-only actions.
- Score colors must not be the only status signal; include text/badges.
- Review actions must be keyboard reachable.

## Acceptance criteria
- Every planned screen maps to shadcn primitives.
- Diff/review UX is described as shadcn composition, not custom design-system primitives.
- Review state transitions are visible and actionable.

## Product detail enrichment dashboard additions

The product detail page must show three layers side by side:

1. **Mirakl baseline** — current values from Mirakl/MCM, including warnings and noisy text.
2. **External retailer source** — parsed values from the public Retailer page when available.
3. **Candidate target** — proposed values from Retailer + external research, with confidence and evidence.

Recommended shadcn composition:
- `Tabs`: Baseline, Retailer Source, Research Candidates, Evidence, Review, Export History.
- `Table`: field-by-field baseline/source/candidate comparison.
- `Badge`: source type, confidence, warning/error state.
- `Sheet`: evidence detail with URL/snippet/access date.
- `Alert`: missing brand, noisy description, category mismatch, low confidence, conflicting evidence.
- `Button`: "Research missing info", "Accept field", "Reject field", "Request more evidence".

For products like Huawei FreeClip 2, the UI should make obvious that the Mirakl description is storefront noise and that a cleaner candidate description exists from research sources.

The research launch button must create a job and show progress/history. It must not directly update Mirakl.
