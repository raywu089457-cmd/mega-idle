# Round 133 Evidence — 遊戲數值平衡

## 當前狀態
- v743 QoL 完成；軌道數值（循環 34）
- 近輪 deepen：強化／融合／榮譽（v740）、研讀／訓練金／公會捐（v736）

## 痛點（≥3）
1. **研讀 7–10 級**：min(l-4,2) 仍偏硬
2. **訓練金 Lv≥140**：seg 封頂 3 仍抬高後期
3. **公會日捐 Lv≥6**：min(lv-1,6) 後期日捐偏貴

## 候選
A. study min(l-4,2)→1（l≤5 不變）  
B. trainCost min(seg,3)→2（lv≤139 不變）  
C. donate min(lv-1,6)→4（Lv≤5 不變）  

## 建議
A+B+C → v744
