export const DEFAULT_ROLE_IDS = {
  owners: "1360016269088129274",
  mods: "1360016476593193070",
  crew: "1446958709086621746",
} as const;

export const DEFAULT_SPECIALIZED_ROLE_IDS = {
  voiceActor: "1446958400981434409",
  sva: "1446958519470395422",
  bva: "1446958458959302777",
  artist: "1360465893573922907",
  editor: "1360466126726762596",
  designer: "1451054105140134019",
  gfx: "1443435828549390446",
  cardEditor: "1443435773494821006",
  translyricist: "1360466435876458586",
  vocalGuide: "1466239213648216096",
} as const;

export type SpecializedRoleKey = keyof typeof DEFAULT_SPECIALIZED_ROLE_IDS;

export const SPECIALIZED_ROLE_LABELS: Readonly<Record<SpecializedRoleKey, string>> = {
  voiceActor: "Voice actor",
  sva: "SVA",
  bva: "BVA",
  artist: "Artist",
  editor: "Editor",
  designer: "Designer",
  gfx: "GFX",
  cardEditor: "Card editor",
  translyricist: "Translyricist",
  vocalGuide: "Vocal guide",
};
