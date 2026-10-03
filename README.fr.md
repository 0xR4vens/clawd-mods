# clawd-mods

[English](README.md) · **Français**

Un petit Clawd en pixel art qui vit sous le spinner de Claude Code et mime
ce que fait Claude, devant un fond de points scintillants qui sert aussi de
barre de progression à la liste de tâches de Claude.

![Clawd sous le spinner](docs/demo.gif)

**Ça ne coûte rien.** Tout est dessiné à partir de ce que la session sait
déjà (le mode du spinner, les outils appelés par Claude, la liste de tâches,
l'usage). Le modèle n'est jamais appelé, aucun prompt n'est ajouté, aucun
token n'est consommé.

> Projet de fan indépendant, non affilié à Anthropic ni approuvé par
> Anthropic. Clawd est la mascotte d'Anthropic.

## Ce que fait Clawd

- **Il suit le travail.** Une pioche quand Claude cherche, un marteau quand
  il modifie un fichier, un petit écran avec du code vert quand il lance une
  commande, une loupe quand il lit. Une commande de plus de 20 secondes lui
  vaut un café.
- **Il réagit à votre workflow.** `git commit` plante un drapeau, `git push`
  part en fusée, les tests le font jongler puis brandir un trophée (ou
  s'asseoir sous un nuage s'ils échouent), et `npm install` et compagnie lui
  font pleuvoir des cartons dessus.
- **Il montre la progression.** Quand Claude avance dans une liste de tâches,
  les points sont en couleur et scintillent jusqu'à la tâche en cours, gris
  au-delà, avec le nom de la tâche et le pourcentage dans le coin. Chaque
  tâche terminée a droit à des confettis, et la liste entière à un feu
  d'artifice.
- **Il se déguise** quand il n'a rien de plus précis à faire : vol en cape,
  voiture de course, jetpack, skate, pistolet laser, magicien (qui fait
  apparaître lapins, grenouilles, oiseaux, canards, escargots et papillons),
  DJ, pirate, astronaute, chevalier contre un dragon-bug, chasse au bug.
- **Il vit sa vie.** Une ampoule après une longue réflexion, une pancarte
  « ? » quand Claude vous attend, une couronne après dix actions sans erreur,
  de la sueur près d'une limite d'usage, un sac à dos qui déborde quand le
  contexte est presque plein, des mini-Clawd pour chaque sous-agent, un ciel
  étoilé après 21 h, des chauves-souris à Halloween, de la neige à Noël, et
  de temps en temps un chat ou une étoile filante.
- Tapez **`danse clawd`** dans un message pour voir.

## Installation

Il faut Claude Code avec les **plugin hook modules**, une fonctionnalité en
accès anticipé (le plugin a été fait sur la version 2.1.288).

1. Clonez le repo :

   ```sh
   git clone https://github.com/0xR4vens/clawd-mods ~/src/clawd-mods
   ```

2. Essayez-le pour une session :

   ```sh
   claude --plugin-dir ~/src/clawd-mods
   ```

3. Pour le charger dans toutes les sessions, ajoutez le dossier au bloc `env`
   de `~/.claude/settings.json` (chemin complet), puis redémarrez Claude Code :

   ```json
   {
     "env": { "CLAUDE_CODE_PLUGIN_DIRS": "/home/vous/src/clawd-mods" }
   }
   ```

Rien ne s'affiche ? Lancez `claude --debug` et cherchez une ligne
`clawd-mods`. Clawd n'apparaît que pendant que Claude travaille, et seulement
dans le terminal.

## Commandes

| Commande | |
|---|---|
| `/clawd` | Afficher ou masquer Clawd |
| `/clawd fond` | Activer ou couper le fond de points |
| `/clawd <rôle>` | Garder un rôle : `marche`, `cape`, `pilote`, `jetpack`, `skate`, `laser`, `magicien`, `dj`, `pirate`, `astronaute`, `chevalier`, `chasse` |
| `/clawd aléatoire` | Le laisser changer de rôle tout seul |

## Développement

- `hooks/art.ts` dessine tout (fonctions pures, aucun appel au moteur).
- `hooks/register.tsx` contient tous les hooks : le moteur ne suit `$` qu'à
  l'intérieur d'un seul fichier.
- `claude plugin validate .` et `claude plugin test .` le vérifient.
- `node --experimental-strip-types scripts/demo-gif.ts docs/demo.gif`
  régénère le GIF de démo (sans dépendance).
- `scripts/promo.ts` génère les clips promo en 1080p (il faut ffmpeg avec
  libass, et les polices Poppins et DM Sans).

## Licence

MIT. Voir [LICENSE](LICENSE).
