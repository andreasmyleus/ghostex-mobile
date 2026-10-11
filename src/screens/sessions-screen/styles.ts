/**
 * SessionsScreen StyleSheet, moved verbatim from src/screens/SessionsScreen.tsx.
 */

import { StyleSheet } from 'react-native';

import { ds, PROJECT_RAIL_WIDTH, SIDEBAR_BACKGROUND } from '../../components/sessions/rows';
import { GhostexPalette, GhostexRadii, GhostexStrokeWidth, SidebarPalette } from '../../theme/palette';

/** The track's padding around the tile and chips. */
const SPACE_TRACK_PADDING = 6;
/** A Space chip's height (SpaceTabs `SPACE_CHIP_HEIGHT`) plus the track's padding and hairline. */
const SPACE_TRACK_HEIGHT = 30 + 2 * (SPACE_TRACK_PADDING + GhostexStrokeWidth);

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SIDEBAR_BACKGROUND,
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  /** Owns the header row's leading space so the title can be long-pressed. */
  titlePressable: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    justifyContent: 'center',
  },
  title: {
    color: GhostexPalette.FOREGROUND,
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerButton: {
    width: 48,
    height: 48,
    backgroundColor: GhostexPalette.CARD_ACTIVE,
    borderRadius: GhostexRadii.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  tailscaleWarning: {
    minHeight: 54,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: GhostexRadii.card,
    borderWidth: 1,
    borderColor: 'rgba(255,180,84,0.35)',
    backgroundColor: 'rgba(255,180,84,0.10)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tailscaleWarningCopy: {
    flex: 1,
    minWidth: 0,
  },
  tailscaleWarningTitle: {
    color: GhostexPalette.FOREGROUND,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '600',
  },
  tailscaleWarningBody: {
    color: GhostexPalette.MUTED,
    fontSize: 11,
    lineHeight: 15,
  },
  statusPressable: {
    flex: 1,
    minWidth: 0,
  },
  statusLine: {
    color: GhostexPalette.MUTED,
    fontSize: 12,
  },
  /*
   * The list owns every point the header, the machine strip, and the Space row
   * do not. A ScrollView (which a FlatList is) ships
   * `flexGrow: 1, flexShrink: 1` with a content-sized basis, so without an
   * explicit `flex: 1` a long session list overflows the column and Yoga takes
   * the difference back out of its shrinkable siblings — which is what used to
   * squeeze the Space row flat.
   */
  list: {
    flex: 1,
    marginTop: 12,
  },
  /**
   * The rounded track behind the workspace tile and the Space row: the page's full width, the tile
   * and chips left-aligned inside it and scrolling once they outgrow the line; fixed height so the
   * list cannot squeeze it.
   *
   * CDXC:Spaces 2026-10-11 SEE-ALSO:
   * The desktop's Space row became a full-width rounded track holding borderless, filled buttons
   * (user decision on `space_track_fill` in apps/desktop/src/app/native_sidebar/selectors.rs); the
   * phone follows, so the chips and the workspace tile have no outline either.
   */
  spaceTrack: {
    marginTop: 6,
    alignSelf: 'stretch',
    height: SPACE_TRACK_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: SPACE_TRACK_PADDING,
    borderRadius: GhostexRadii.pill,
    borderWidth: GhostexStrokeWidth,
    borderColor: SidebarPalette.SPACE_TRACK_BORDER,
    backgroundColor: SidebarPalette.SPACE_TRACK_BG,
    flexShrink: 0,
    overflow: 'hidden',
  },
  /**
   * The Space row inside the track: as wide as its chips, shrinking (and scrolling) once they
   * outgrow the line. The track owns the top margin. SpaceTabs' own box sets `flexShrink: 0`, so the
   * shrink is spelled out here.
   */
  spaceTrackSpaces: {
    marginTop: 0,
    flexGrow: 0,
    flexShrink: 1,
    minWidth: 0,
  },
  listContent: {
    paddingBottom: 24,
  },
  longPressHint: {
    color: GhostexPalette.MUTED,
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 12,
    opacity: 0.72,
  },
  tailscaleIndicator: {
    minHeight: 28,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  tailscaleIndicatorLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
  },
  /*
   * Desktop project group in branched mode (hierarchy-panels.css
   * .group[data-project-group]): transparent, borderless, and preceded by its
   * branch column instead of being drawn as a card.
   */
  projectCard: {
    flexDirection: 'row',
    /*
     * The branch column stretches to the whole card so its absolutely placed
     * line stays inside its parent's box. A zero-height column would leave the
     * line painting outside its bounds, which Android does not guarantee.
     */
    alignItems: 'stretch',
  },
  projectCardBody: {
    flex: 1,
  },
  /** No left inset: a top-level card starts at the page's edge, like the Space row above it. */
  projectCardTopLevel: {
    marginRight: ds(5),
    marginBottom: ds(10),
  },
  projectCardInPanel: {
    marginRight: ds(5),
    marginBottom: ds(5),
  },
  projectCardExpanded: {
    marginBottom: ds(7),
  },
  /** Card session area (.group-sessions): 3dp inner inset. */
  cardSessions: {
    paddingHorizontal: ds(3),
    paddingBottom: ds(3),
  },
  /*
   * Desktop collection in branched mode (section.project-collection): no panel
   * border or fill, a 2dp colored rail down its left edge, and a tinted header
   * chip. `margin: 0 5px 10px 3px` with the rail sitting at the panel's left.
   */
  collectionPanel: {
    position: 'relative',
    marginLeft: ds(3),
    marginRight: ds(5),
    marginBottom: ds(10),
    paddingBottom: ds(5),
  },
  collectionRail: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: ds(5),
    width: PROJECT_RAIL_WIDTH,
  },
  collectionHeaderChip: {
    borderRadius: ds(5),
    minHeight: ds(30),
    justifyContent: 'center',
  },
  /** Panel member area (.project-collection-projects): starts at the rail. */
  collectionProjects: {
    paddingLeft: PROJECT_RAIL_WIDTH,
    paddingTop: ds(5),
    paddingBottom: ds(3),
  },
});
