# Round 131 Evidence — 戰鬥畫面美術優化

## 當前狀態
- 版本 v741；軌道戰鬥（循環 33）
- 近輪：critskill/leech/chill（v738）、arrow/dagger/shield（v734）
- DoT tick 僅有紫波紋；升級僅有金環火花；重擊技能無獨立「力道」形狀

## 痛點（≥3）
1. **DoT tick 形狀弱**：`dotripple` 是擴張橢圓，缺毒滴尖端語彙
2. **升級缺徽章感**：`levelburst` 環＋火花，缺可辨等級徽記
3. **重擊無力度標**：`powerstrike`（power≥2.5）與普攻技能同 slashmark，缺菱形衝擊

## 候選（≥3）
A. toxmark — DoT tick 紫毒滴  
B. lvmark — levelup 金徽  
C. powermark — sk.power≥2.5 橙菱  
D.（備）burnmark — 火球 DoT cast  

## 建議
A+B+C → v742
