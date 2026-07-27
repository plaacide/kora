# Maquettes — la source de vérité du design

Ces fichiers ne vivaient que dans le dossier de téléchargements du fondateur.
Ils sont versionnés ici parce que **la maquette est la spécification**, pas une
illustration : la session précédente a coûté plusieurs jours en inventant des
libellés et des comportements que ces fichiers tranchaient déjà.

| Fichier | Contenu |
|---|---|
| `programme-onboarding-17-ecrans.html` | persona **Programme** — 17 écrans, de l'inscription à la roadmap. Le plus récent, et celui qui fait foi pour tout le travail en cours. |
| `kora-dealroom-28-ecrans.html` | maquette d'origine du dealroom — 28 écrans étiquetés. |
| `sanza-app-v5.html` | application Sanza v5. Pas d'étiquettes `data-screen-label` : à lire à l'œil. |

## Comment les lire

Ce sont des bundles avec scripts en ligne. **Les servir depuis l'application
échoue** — notre CSP bloque le script inline sans nonce, et la page reste
bloquée sur « Unpacking… ». Les servir à plat fonctionne :

```bash
mkdir -p /tmp/maq && cp "programme-onboarding-17-ecrans.html" /tmp/maq/index.html
cd /tmp/maq && python3 -m http.server 8899
```

Puis, dans la console du navigateur, extraire tous les écrans d'un coup :

```js
[...document.querySelectorAll('[data-screen-label]')].map(e => ({
  ecran: e.getAttribute('data-screen-label'),
  texte: e.innerText
}))
```

## ⚠️ Le piège de l'extraction

Une extraction par expression régulière sur le fichier BRUT ne rend que les
blocs `vide({…})` — soit **8 écrans sur 17** pour le fichier Programme. Les
écrans 01→06, 09, 10, 16 et 17 en sont absents.

C'est exactement l'erreur commise pendant la session précédente : huit écrans
lus, dix-sept annoncés. Rendre la page et lire le DOM est la seule méthode
fiable.
