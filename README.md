# Spec3R demo

Static research demo containing seven 7-Scenes sequences and 21 baseline-versus-Ours videos. Each scene includes CUT3R, TTT3R and TTSA3R comparisons.

This repository intentionally contains no paper PDF. The Paper button is hidden.

## GitHub Pages

Public website: https://kenny-huang-mz.github.io/Spec3R/

Repository: https://github.com/Kenny-Huang-mz/Spec3R

The site is deployed through the **Deploy demo to GitHub Pages** workflow on every push to main. All assets use relative paths. The repository was initially tested as demo_test and renamed to Spec3R after its first successful deployment.

## Local preview

Serve the parent directory of this repository:

```sh
python3 -m http.server 8766 --bind 127.0.0.1 --directory ..
```

Then open http://127.0.0.1:8766/demo_test/ . The site needs no Node.js backend, model dependencies or prediction caches.

## Interactive Examples

All seven scenes and three backbones have synchronized baseline/Ours point-cloud pairs (42 clouds). Both panels use a single shared perspective camera and OrbitControls instance: left drag orbits, wheel zooms, right drag pans; Reset view restores both. On narrow screens the panels stack vertically. The viewer loads only on approach to its section, aborts obsolete loads during selection changes, and disposes old GPU buffers.

Point clouds come directly from the same frame-0-aligned caches as the videos, preserving scale 1.0, original coordinates and RGB. For browser performance, each input frame contributes at most 300 deterministically selected points (150,000 points per panel for current results). No separate per-panel normalization, GT alignment, smoothing, hole filling or color enhancement. Three.js 0.180.0 is vendored locally with its MIT license; no external script CDN is required.

Cloud data: clouds/index.json plus 42 binary files. Binary layout: SPC1 magic, uint32 little-endian point count, float32 XYZ positions, uint8 RGB colors. All three methods remain available as videos above.

场景入口统一为标题信息下方、视频之前的 Explore the Scenes 卡片。该入口同时控制视频和交互点云；两处方法按钮共享选择状态。交互区域不再单独提供场景下拉框，点击顶部卡片后不会强制滚动离开卡片。

Author affiliations: Haoxiang Zhu — Central South University and AGI Lab, Westlake University; Mingzhen Huang — AGI Lab, Westlake University; Yifu Guo and Zhenning Lu — Sun Yat-sen University; Chi Zhang — AGI Lab, Westlake University. Haoxiang Zhu and Mingzhen Huang share equal contribution; Chi Zhang is the corresponding author.
