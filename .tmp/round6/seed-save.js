// 注入中後期進度存檔（全部 10 區解鎖＋各區全通＋模式解鎖）
const save = {
  v: 1, created: Date.now(), lastSeen: Date.now(),
  settings: { sound: false, music: false, speed: 1, reducedMotion: false },
  currencies: { gold: 5000000, gems: 500, honor: 50 },
  mats: { iron: 500, herb: 500, leather: 500, crystal: 500, ember: 500, ice: 500, poison: 500, void: 500, myth: 500 },
  kingdom: { level: 18, exp: 0 },
  buildings: { castle: 12, guild: 8, training: 10, forge: 10, gemworks: 8, alchemy: 8, library: 8, warehouse: 10, altar: 5, market: 6 },
  hunters: [],
  formation: [null, null, null, null, null],
  hunt: { region: 0, stage: 1, auto: true, autoRetry: true, speed: 1, dispatchIds: [], restUntil: 0, regionClearShown: {} },
  inventory: { items: [], cap: 200 },
  codex: { monsters: {}, items: {}, mats: {} },
  quests: { mainIdx: 29, mainProg: 100, daily: { day: new Date().toISOString().slice(0,10), list: [] } },
  achievements: {},
  checkin: { month: new Date().toISOString().slice(0,7), days: [] },
  buffs: {},
  awakenings: 0,
  tutorial: 99,
  stats: { kills: 0, goldEarned: 0, bossKills: 0, playSec: 0, maxStage: 10, recruits: 0, enhances: 0, maxRegionReached: 9, maxStageByRegion: {0:10,1:10,2:10,3:10,4:10,5:10,6:10,7:10,8:10,9:10}, maxTierReached: 10 },
  log: [],
  wanderers: { list: [], mood: 0, nextSpawn: 0 }
};
const classes = ['sword','archer','mage','assassin','knight'];
for (let i=0;i<5;i++) {
  save.hunters.push({ id: i, name: '測試'+i, cls: classes[i], rarity: 4, level: 150, exp: 0, skills: {a:3,b:3,c:3}, promoted: 1, hp: 5000,
    equip: { weapon: null, helmet: null, armor: null, boots: null, necklace: null, ring: null, charm: null }, wander: false });
  save.formation[i] = i;
}
localStorage.setItem('megaidle_save_v1', JSON.stringify(save));
