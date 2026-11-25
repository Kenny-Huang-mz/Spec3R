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
