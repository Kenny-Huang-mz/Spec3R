# Spec3R demo

Static research demo containing seven 7-Scenes sequences and 21 baseline-versus-Ours videos. Each scene includes CUT3R, TTT3R and TTSA3R comparisons.

This repository intentionally contains no paper PDF. The Paper button is hidden.

## GitHub Pages

The repository is currently private. GitHub rejected Pages activation because the current account plan does not support Pages for this private repository. To enable deployment, use an eligible GitHub plan or make the repository public, then select **Settings → Pages → Source → GitHub Actions**. Run the **Deploy demo to GitHub Pages** workflow after enabling Pages.

Expected project URL after deployment: https://kenny-huang-mz.github.io/demo_test/

All assets use relative paths, so the static site also supports a later repository rename to Spec3R. Update the URL here after renaming. Keep repository visibility private until the owner explicitly authorizes changing it.

## Local preview

Serve the parent directory of this repository:

```sh
python3 -m http.server 8766 --bind 127.0.0.1 --directory ..
```

Then open http://127.0.0.1:8766/demo_test/ . The site needs no Node.js backend, model dependencies or prediction caches.
