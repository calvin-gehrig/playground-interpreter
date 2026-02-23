# Playground Interpreter

Un atelier pratique pour apprendre à concevoir un langage de programmation. Votre rôle est d'écrire la **grammaire** — l'interpréteur est déjà fourni.

## Prérequis

**Node.js** doit être installé sur votre machine :

```
node --version
```

Si ce n'est pas le cas, téléchargez-le sur [nodejs.org](https://nodejs.org/en/download).

## Installation

Depuis le dossier du projet :

```
npm install
```

## Utilisation

### 1. Écrire la grammaire

Modifiez le fichier `grammar.ne` selon les instructions des exercices.

### 2. Compiler la grammaire

À chaque modification de `grammar.ne`, regénérez le fichier `grammar.js` :

```
npx nearleyc grammar.ne -o grammar.js
```

### 3. Exécuter un programme

```
node main.js <chemin/vers/votre/fichier>
```

Pour afficher l'arbre syntaxique (AST) produit par le parser avant l'exécution :

```
node main.js -p <chemin/vers/votre/fichier>
```

## Structure du projet

| Fichier / Dossier | Rôle |
|---|---|
| `exercices.md` | Les exercices guidés — **point de départ** |
| `doc.md` | Documentation complète de l'API de l'interpréteur |
| `grammar.ne` | Le fichier de grammaire à compléter |
| `grammar.js` | Fichier généré automatiquement par Nearley à partir de `grammar.ne` |
| `main.js` | Point d'entrée — lit un fichier et l'exécute |
| `Interpreter/` | Sources internes de l'interpréteur (ne pas modifier) |
| `grammar-ex1.ne` … `grammar-ex5.ne` | Solutions de référence pour chaque exercice |

## Les exercices

Les exercices se trouvent dans `exercices.md`. Ils sont conçus pour être suivis dans l'ordre :

1. **Hello, world et théorie** — lexer Moo, règles Nearley, postprocesseurs, AST
2. **Opérations mathématiques** — nombres, opérateurs binaires, priorité des opérations, parenthèses
3. **Les variables** — identifiants, déclaration, scope, réassignement
4. **If-else et boucle while** — structures de contrôle conditionnelles et boucles
5. **Les fonctions** — déclaration, appel, retour, récursivité

À la fin de la série, il est possible de calculer la suite de Fibonacci :

```
fn fib (n) {
    if n < 2 {
        return n
    }
    return fib(n - 1) + fib(n - 2)
}
print fib(10)
```

## Fonctionnalités supplémentaires

L'interpréteur implémente également des fonctionnalités non couvertes par les exercices : les listes, les appels de listes, la boucle `foreach` et les opérations customs. Tout est documenté dans `doc.md`.

## Dépendances

- [nearley](https://nearley.js.org/) — parser basé sur l'algorithme d'Earley
- [moo](https://github.com/no-context/moo) — lexer par expressions régulières
- [mz](https://github.com/normalize/mz) — promisification de l'API Node.js `fs`
