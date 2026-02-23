# Introduction

Cette série d'exercices vous invite à construire progressivement votre propre langage de programmation. Votre rôle consiste uniquement à écrire la **grammaire** : l'interpréteur est déjà fourni. La grammaire définit à la fois la syntaxe que votre langage reconnaît et la structure des données que l'interpréteur recevra pour les exécuter.

Contenu du dossier :
- `exercices.md` : ce fichier.
- `doc.md` : la documentation complète de l'API de l'interpréteur.
- `grammar.ne` : le fichier de grammaire à compléter.
- `grammar.js` : le fichier généré automatiquement par Nearley.js à partir de `grammar.ne`.
- `main.js` : le point d'entrée de l'interpréteur, à exécuter avec Node.js.
- `Interpreter/` : les fichiers internes de l'interpréteur (à ne pas modifier).

# Les exercices

## Table des matières

1. [Exercice 1 — Hello, world et théorie](#exercice-1--hello-world-et-théorie)
2. [Exercice 2 — Opérations mathématiques](#exercice-2--opérations-mathématiques)
3. [Exercice 3 — Les variables](#exercice-3---les-variables)
4. [Exercice 4 — If-else et boucle while](#exercice-4---if-else-et-boucle-while)
5. [Exercice 5 — Les fonctions](#exercice-5---les-fonctions)
6. [Fin — Autres fonctionnalités à implémenter et remerciements](#fin---autres-fonctionnalités-à-implémenter-et-remerciements)

## Pour commencer

Ce projet nécessite **Node.js**. Vérifiez qu'il est installé :

```
node --version
```

Sinon installez le depuis leur site: [installer nodejs](https://nodejs.org/en/download)

Il vous faut certaines dépendances. Pour les installer toutes, faites depuis la directory du projet :
```
npm install
```

Pour **compiler** votre grammaire et générer le fichier `grammar.js` attendu par l'interpréteur :

```
npx nearleyc grammar.ne -o grammar.js
```

Pour **exécuter** un fichier écrit dans votre langage :

```
node main.js <chemin/vers/votre/fichier>
```

Cette compilation est à relancer à chaque modification de `grammar.ne`.

---

## Exercice 1 — Hello, world et théorie

Cet exercice introduit l'ensemble des concepts nécessaires à la série. L'objectif concret est de faire fonctionner l'instruction suivante dans votre langage :

```
print "Hello, world"
```

### 1. Du code source à l'exécution

Lorsque vous exécutez un fichier avec l'interpréteur, trois étapes se succèdent :

1. **Analyse lexicale** : le code source est lu caractère par caractère. Le *lexer* (ici Moo) le découpe en une suite de *tokens* — des unités atomiques comme des mots-clés, des chaînes de caractères ou des séparateurs.

2. **Analyse syntaxique** : les tokens sont lus par le *parser* (ici Nearley). Celui-ci les confronte aux règles de la grammaire et produit un *arbre syntaxique abstrait* (AST) représentant la structure du programme.

3. **Interprétation** : l'interpréteur parcourt l'AST et exécute chaque instruction.

Votre travail se situe entièrement dans `grammar.ne`, qui configure à la fois le lexer (étape 1) et les règles du parser (étape 2). La forme de l'AST produit à l'étape 2 doit correspondre exactement à ce qu'attend l'interpréteur à l'étape 3. La documentation de `doc.md` décrit cette forme attendue.

### 2. Structure d'un fichier Nearley

Un fichier `.ne` comprend deux parties :

```
@{%
    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        global.moo = require("moo");
    }

    var lexer = moo.compile({ /* liste de tokens */ });

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = lexer;
    }
%}

@lexer lexer

// Règles de production Nearley
```

- Le bloc entre `@{%` et `%}` est du JavaScript pur. Il sert à configurer le lexer Moo.
- La directive `@lexer lexer` indique à Nearley d'utiliser la variable `lexer` définie dans le bloc précédent.
- Le reste du fichier contient les règles de grammaire.

Les blocs `if` encadrant le `require` et le `module.exports` assurent la compatibilité avec Node.js ; ils sont à conserver tels quels dans tous les exercices.

### 3. Le lexer Moo

Moo transforme le code source en une suite de tokens. Chaque token possède un **type** et une **valeur**. Voici les tokens nécessaires pour cet exercice :

```javascript
var lexer = moo.compile({
    string:  { match: /"[^"]*"/, value: s => s.slice(1, -1) },
    keyword: [/print\b/],
    WS:      /[ \t]+/,
    NL:      { match: /\n/, lineBreaks: true }
});
```

Chaque entrée définit un type de token :

- **`keyword`** : un tableau d'expressions régulières définissant les mots-clés du langage. Le `\b` est une *limite de mot* : il garantit que `print` est reconnu, mais pas `printable`.
- **`string`** : un token correspondant à une suite de caractères entourée de guillemets doubles. Le champ `match` définit le pattern reconnu, et le champ `value` est une fonction qui transforme la valeur brute — ici, `s.slice(1, -1)` supprime le premier et le dernier caractère, c'est-à-dire les guillemets.
- **`WS`** : un ou plusieurs espaces ou tabulations.
- **`NL`** : un retour à la ligne. L'option `lineBreaks: true` est requise par Moo pour les tokens qui contiennent des sauts de ligne.

L'ordre des entrées est important : Moo essaie de faire correspondre les patterns dans l'ordre de déclaration. Placez les tokens les plus spécifiques en premier pour éviter les ambiguïtés.

### 4. Expressions régulières

Les patterns passés à Moo sont des *expressions régulières* (regexp). Une expression régulière décrit un ensemble de chaînes de caractères et s'écrit entre barres obliques : `/pattern/`.

| Notation | Signification |
|---|---|
| `a*` | zéro, un ou plusieurs `a` |
| `a+` | un ou plusieurs `a` |
| `a?` | zéro ou un `a` |
| `[abc]` | exactement un caractère parmi `a`, `b` ou `c` |
| `[0-9]` | un chiffre de 0 à 9 |
| `[a-z]` | une lettre minuscule |
| `[A-Za-z]` | une lettre minuscule ou majuscule |
| `[^"]` | n'importe quel caractère **sauf** le guillemet double |
| `(ab)+` | un ou plusieurs groupes `ab` |
| `\b` | limite de mot |
| `\.` | un point littéral (`/./` sans le `\` correspond à n'importe quel caractère) |

Les caractères spéciaux (`*`, `+`, `?`, `.`, `[`, `]`, `(`, `)`, `\`) doivent être précédés d'un `\` pour être utilisés littéralement.

### 5. Les règles de production Nearley

Les règles de production définissent la structure grammaticale du langage. Nearley utilise une variante de la *forme de Backus-Naur* (BNF). La syntaxe générale est :

```
<nom de la règle> -> <séquence d'éléments>
                   | <alternative>
```

Le `->` se lit « est composé de » et le `|` se lit « ou ».

**Trois types d'éléments** peuvent apparaître dans une séquence :

| Notation | Signification |
|---|---|
| `nom` | résultat de la règle nommée `nom` |
| `"valeur"` | un token dont la valeur est exactement `valeur` |
| `%type` | un token dont le type est `type`, tel que déclaré dans le lexer |

Exemple :

```
statement -> print

print -> "print" ___ expression

expression -> value

value -> %string
```

La règle `statement` indique qu'une instruction est un `print`. La règle `print` indique qu'un `print` est la séquence : un token de valeur `"print"`, suivi d'un espace blanc obligatoire (`___`), suivi d'une `value`. La règle `value` indique qu'une valeur est un token de type `string` tel que défini dans le lexer. Les règles `___` et `__` seront définies à la section 8.

**La première règle du fichier est le point d'entrée** : c'est elle qui décrit l'ensemble du programme. Pour décrire une suite d'instructions en nombre indéterminé, on utilise la **récursion** :

```
program -> __ statement __
         | program statement __
```

Un `program` est soit une instruction unique (entourée d'espaces blancs optionnels), soit un `program` suivi d'une instruction. Grâce à la récursion sur `program`, cette définition accepte une, deux, ou n'importe quel nombre d'instructions.

### 6. Les postprocesseurs

Sans postprocesseur, Nearley retourne pour chaque règle un tableau contenant les valeurs brutes de tous les éléments correspondants, dans l'ordre. Ce tableau n'est pas directement utilisable par l'interpréteur.

Un **postprocesseur** est une fonction JavaScript attachée à une règle. Elle reçoit ce tableau en argument (conventionnellement nommé `data`) et retourne la valeur transformée qui sera transmise aux règles parentes. Il s'écrit entre `{%` et `%}` immédiatement après la séquence :

```
règle -> élément_A élément_B élément_C {% (data) => /* valeur retournée */ %}
```

Les éléments de `data` correspondent à la séquence de la règle, **de gauche à droite, en commençant à l'indice 0** :

```
print -> "print"  ___     value   {% (data) => ... %}
          data[0] data[1] data[2]
```

Ainsi, `data[0]` est le token `"print"`, `data[1]` est le résultat de `___`, et `data[2]` est le résultat de la règle `value`.

Voici les postprocesseurs appliqués à la règle `program` :

```
program -> __ statement __      {% (data) => [data[1]] %}
         | program statement __ {% (data) => [...data[0], data[1]] %}
```

- **Premier cas** — `__ statement __` : `data[0]` est `__` (ignoré), `data[1]` est le résultat de `statement`, `data[2]` est `__` (ignoré). Le postprocesseur retourne un tableau contenant ce seul `statement`.
- **Second cas** — `program statement __` : `data[0]` est le tableau retourné par le `program` précédent, `data[1]` est la nouvelle instruction, `data[2]` est `__` (ignoré). Le postprocesseur étend le tableau existant avec la nouvelle instruction grâce à l'opérateur de décomposition `...`.

**Le raccourci `{% id %}`** : lorsqu'une règle sert uniquement à grouper des alternatives sans rien transformer, `{% id %}` est équivalent à `{% (data) => data[0] %}` — il retourne simplement le premier élément :

```
statement -> print {% id %}
```

### 7. L'AST et l'API de l'interpréteur

L'AST (*Abstract Syntax Tree*) est la structure produite par le parser et consommée par l'interpréteur. Dans ce projet, il prend la forme d'un **tableau d'objets JavaScript**, chaque objet représentant une instruction.

L'interpréteur distingue deux catégories :

- **Les instructions** : elles produisent un effet (écrire dans la console, déclarer une variable, etc.) et ne retournent pas de valeur.
- **Les expressions** : elles sont évaluées et retournent une valeur. Elles apparaissent à l'intérieur des instructions.

Chaque objet doit posséder un champ `type` indiquant à l'interpréteur comment le traiter. La liste complète des types et de leurs champs est dans `doc.md`.

Pour cet exercice, deux types suffisent :

**L'instruction `print`** :
```javascript
{ st_type: "print", value: <une expression> }
```
L'interpréteur évalue l'expression contenue dans `value` et écrit le résultat dans la console.

**L'expression `string`** :
```javascript
{ ex_type: "string", value: <la chaîne de caractères> }
```
L'interpréteur retourne la chaîne de caractères contenue dans `value`.

Voici les postprocesseurs correspondants :

```
print -> "print" ___ expression {% (data) => ({ st_type: "print", value: data[2] }) %}

expression -> value {% id %}

value -> %string {% (data) => ({ ex_type: "string", value: data[0].value }) %}
```

`data[0].value` dans la règle `value` désigne la valeur du token `%string`, c'est-à-dire la chaîne après suppression des guillemets (effectuée par la fonction `value` du lexer Moo).

Les parenthèses autour des objets littéraux sont nécessaires : sans elles, JavaScript interpréterait les accolades comme le corps de la fonction anonyme, et non comme un objet retourné.

### 8. Les espaces blancs

Les tokens `WS` et `NL` sont indispensables pour que le lexer ne rejette pas les espaces et retours à la ligne. En revanche, ils n'ont aucune signification sémantique : il faut les consommer dans la grammaire, mais les ignorer dans les postprocesseurs.

```
__ -> null    {% () => null %}
    | ___     {% () => null %}

___ -> ignore      {% () => null %}
     | ___ ignore  {% () => null %}

ignore -> %WS  {% () => null %}
        | %NL  {% () => null %}
```

- `__` représente un espace blanc **optionnel** (peut être absent).
- `___` représente un espace blanc **obligatoire** (au moins un token `WS` ou `NL`).
- `ignore` est une unité d'espace blanc (un seul token).

Le mot-clé `null` en Nearley signifie « ne rien consommer » — il permet de définir une alternative vide. Tous les postprocesseurs de ces règles retournent `null` car ces tokens n'ont aucune valeur à transmettre.

### 9. La grammaire complète

En assemblant les sections précédentes, voici la grammaire complète :

```
@{%
    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        global.moo = require("moo");
    }

    var lexer = moo.compile({
        string:  { match: /"[^"]*"/, value: s => s.slice(1, -1) },
        keyword: [/print\b/],
        WS:      /[ \t]+/,
        NL:      { match: /\n/, lineBreaks: true }
    });

    if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
        module.exports = lexer;
    }
%}

@lexer lexer

program -> __ statement __      {% (data) => [data[1]] %}
         | program statement __ {% (data) => [...data[0], data[1]] %}

statement -> print {% id %}

print -> "print" ___ expression {% (data) => ({ st_type: "print", value: data[2] }) %}

expression -> value {% id %}

value -> %string {% (data) => ({ ex_type: "string", value: data[0].value }) %}

__ -> null    {% () => null %}
    | ___     {% () => null %}

___ -> ignore      {% () => null %}
     | ___ ignore  {% () => null %}

ignore -> %WS  {% () => null %}
        | %NL  {% () => null %}
```

Prenez le temps de retrouver chaque notion introduite dans les sections précédentes : les types de tokens dans le lexer, les trois types d'éléments dans les règles, la correspondance entre les indices de `data` et la séquence de chaque règle, et les objets attendus par l'interpréteur.

### 10. Compilation et exécution

Copiez la grammaire dans `grammar.ne`, puis compilez-la :

```
npx nearleyc grammar.ne -o grammar.js
```

Créez un fichier de test, par exemple `test.txt` :

```
print "Hello, world"
```

Exécutez-le :

```
node main.js test.txt
```

La sortie attendue est :

```
Hello, world
```

Vous pouvez tester avec plusieurs instructions :

```
print "Bonjour"
print "le monde"
```

Si le parser rejette un fichier, vérifiez d'abord que la grammaire a été recompilée après la dernière modification de `grammar.ne`, puis relisez le message d'erreur : il indique généralement à quel token l'analyse a échoué.

### 11. Vérification

Pour confirmer que vous avez compris l'ensemble de la grammaire, effectuez les modifications suivantes :

1. Remplacez le mot-clé `print` par `say` dans le lexer et dans la règle `print`. Votre langage doit désormais accepter `say "Hello, world"` et rejeter `print "Hello, world"`.

2. Ajoutez un second mot-clé `echo` en plus de `say` — les deux doivent être acceptés et produire le même résultat. Observez où dans la grammaire vous devez intervenir et combien de lignes cela nécessite.

## Exercice 2 — Opérations mathématiques

À présent que nous avons établi les fondations de notre langage, nous pouvons nous lancer dans plus de complexité. Dans ce chapitre, nous verrons comment implémenter les opérations mathématiques basiques. Nous verrons aussi comment mettre en place la priorité des opérations dans un langage de programmation. D'ici la fin du chapitre, le langage pourra interpréter ce genre d'instructions:

```
print (3 + 5) * 6
```

### 1. Les valeurs numériques

Mais avant d'implémenter toute opération mathématique, il nous faut d'abord avoir des nombres sur lesquels effectuer celles-ci. Commençons par intégrer un nouveau type de token dans notre lexer:

```
number: /[0-9]+/,
```

Ce token est définit comme toute suite de un à plusieurs chiffres. Cela devrait suffire aux ambitions modestes du langage. Maintenant, l'implémentation dans la grammaire. Nous allons rajouter un nouveau type de valeur, en plus des chaînes de caractères:

```
value -> %string {% (data) => ({ ex_type: "string", value: data[0].value }) %}
| %number {% (data) => ({ ex_type: "number", value: Number(data[0].value) }) %}
```

Une fois cette ligne ajoutée, notre langage devrait désormais pouvoir interpréter cette instruction:

```
print 26
```

Et écrire 26 dans la console. Si c'est le cas, vous pouvez passer à l'étape suivante.

### 2. L'addition

Nous allons implémenter la plus basique de toutes les opérations mathématique, l'addition. Pour cela, il nous faut d'abord un token capable de reconnaître le symbole "+". Voici comment l'intégrer au lexer:

```
operation_symbol: ["+"],
```

Nous utilisons, comme dans le cas du champ mot-clés, un tableau qui pourra contenir tous les symboles pour les opérations. Pour ajouter l'addition à la grammaire, nous allons devoir modifier quelques petites choses, en plus d'ajouter notre nouvelle opération:

```
expression -> addition {% id %}

addition -> addition __ "+" __ value {% (data) => ({ ex_type: "addition", first_operand: data[0], second_operand: data[4] }) %}
| value {% id %}
```

Désormais, une expression est d'abord une addition, puis une valeur. Nous nous arrêterons plus longuement là-dessus dans l'étape suivante. Remarquez comment est construit la règle: à gauche, une addition et à droite une valeur. Si nous devons faire les choses ainsi, c'est car la fonction ne peut être récursive que d'un côté: si la règle était `addition __ "+" __ addition`, la grammaire serait ambigüe parce qu'en parsant `1 + 3 + 4`, les deux parsings suivants seraient autant valide l'un que l'autre: `(1 + 3) + 4` et `1 + (3 + 4)`. Pour une machine, il faut un ordre d'exécution clair. C'est pourquoi le fait d'utiliser addition d'un côté et value de l'autre rend l'addition dans notre langage associatif à gauche: `1 + 3 + 4` est interprété en commençant par la gauche, la machine lit `(1 + 3) + 4`.

À présent essayez d'exécuter la ligne de code suivante:

```
print 31 + 4
```

Il devrait écrire 35 dans la console. Si c'est le cas, nous pouvons poursuivre.

### 3. La priorité des opérations

Mais à présent si nous voulons implémenter les autres opérations, il est temps de nous demander comment implémenter la priorité des opérations.En effet, non seulement s'attend-t'on dans un langage à ce que `4 + 9 * 6` se résolve à `4 + (9 * 6)`, mais aussi à ce que `1 + 4 === sum(2, 3)` se résolve à `(1 + 4) === (sum(2, 3))`. Pour intégrer la priorité dans notre langage, nous allons utiliser la récursivité à son plein potentiel. Commençons par implémenter la multiplication pour voir un cas pratique. Essayez d'abord d'ajouter vous-mêmes le nouveau symbole au lexer, puis modifiez et ajoutez cela dans la grammaire:

```
addition -> addition __ "+" __ multiplication ...
| multiplication {% id %}

multiplication -> multiplication __ "*" __ value {% (data) => ({ ex_type: "multiplication", first_operand: data[0], second_operand: data[4] }) %}
| value {% id %}
```

Désormais, nous n'avons plus à droite de l'addition une value mais une multiplication. Ainsi, `4 + 9 * 6` se résoud bel et bien à `4 + (9 * 6)`. Mais cette règle ne s'applique pas que dans ce cas précis. Nous pouvons dire que pour les opérations binaires, il faut toujours mettre la même opération à gauche (si l'on veut qu'elle soit récursive) et une opération à la priorité plus haute à droite. Ainsi, nous pouvons dire que une addition peut contenir une multiplication qui s'évalue avant l'addition, mais qu'une multiplication ne peut contenir d'addition.

Vérifions que tout fonctionne avec le code suivant:

```
print 5 + 8 * 2
```

La console devrait afficher 21. Nous pouvons maintenant passer à la dernière étape.

### 4. Comment annuler la priorité des opérations

Nous avons implémenté cette priorité, mais pouvons nous l'annuler? Si nous voulions écrire par exemple `(3 + 4) * 5`, nous ne pourrions pas. Nous allons donc implémenter ces parenthèses bien pratiques, qui permettront d'annuler la priorité des opérations. Commençons par les ajouter au lexer:

```
parenthesis: ["(", ")"],
```

Puis ajoutons-les à la grammaire de cette manière:
```
value -> %string ...
| %number ...
| "(" __ expression __ ")" {% (data) => data[2] %}
```

Et voilà. En ajoutant l'expression entre parenthèses à la liste des valeurs, laquelle peut contenir une expression, nous pouvons annuler cette priorité: maintenant, une addition peut contenir une multiplication et une multiplication peut contenir une addition entre parenthèses. Nous pouvons essayer le code suivant:

```
print 3 * (4 + 6)
```

Et la console devrait afficher 30.

### 5. Vérification

À nouveau pour vérifier si vous avez bien compris, essayez d'implémenter d'autres fonctionnalités par vous-mêmes:

1. Ajoutez les deux autres opérations mathématiques de base, la substraction et la division. Elles ont la même priorité respectivement que l'addition et la multiplication, vous devriez donc pouvoir les ajouter sans créer de nouvelle règle, mais en ajoutant seulement des possibilités à des règles déjà existantes.

2. De la même manière que nous avons ajouté les chaînes de caractères et les nombres, essayez d'ajouter les booléennes à présent. Contrairement aux deux premières, les booléennes utilisent des mots-clés généralement, comme **true** ou **false**.

3. Essayez d'ajouter d'autres opérations binaires, par exemple l'égalité `===`, la comparaison `<` ou bien les opérations logiques `and` et `or`. Réféchissez à quelle priorité vous trouveriez logique qu'ils aient selon les langages que vous utilisez d'habitude.

## Exercice 3 - Les variables
À présent que nous avons des valeurs et des opérations, il est plus que temps d'implémenter les variables. Notre objectif est que notre langage soit capable d'exécuter ce programme:

```
let x = 2 + 4
print x
mut x = 5
print x
```

### 1. Les identifiants

Avant toute chose, nous devons ajouter les identifiants comme type de token. Nous voulons que les identifiants puissent être composés de lettres majuscules et minuscules, et d'underscores. Seulement il faut être prudent. Si nous les ajoutons au sommet de la liste de token de moo, ils capteront tous les tokens composés de lettres, y compris les mots-clés comme "print". C'est pourquoi il faut faire attention de les placer après tous les mot-clés. Voici la règle, que vous aviez peut-être déjà deviné:

```
Id: /[a-zA-Z_]+/
```

Comme ils portent leur valeur par eux-mêmes, il n'y a aucun besoin de leur créer une règle dans la grammaire. À la place, essayons déjà de les utiliser dans une autre règle:

```
value -> ...
| %Id {% (data) => ({ ex_type: "variable", name: data[0].value }) %}
```

À présent, si nous écrivons:

```
print x
```

Nous devrions recevoir une PlReferenceError nous indiquant que x n'est pas défini.

### 2. La déclaration de variable

Pour déclarer une variable, il nous faut d'abord un nouveau mot-clé. Vous êtes bien sûr libre de le choisir, mais nous utiliserons dans ces exercices "let". Nous utiliserons aussi le symbole "=" par convention. Essayez de les ajouter par vous-mêmes dans les tokens de moo. Quant à la nouvelle règle, la voici:

```
statement -> print {% id %}
| variable_declaration {% id %}

variable_declaration -> "let" ___ %Id __ "=" __ expression {% (data) => ({ st_type: "variable declaration", name: data[2].value, value: data[6] }) %}
```

Maintenant, si nous écrivons:

```
let x = 2 + 4
print x
```

Le programme devrait renvoyer 6. Nous avons désormais des variables dans notre langage, il est temps de nous pencher sur un des sujets les plus complexes de la conception de langage de programmation: le scope.

### 3. Le scope

Le scope d'une variable définit en général la limite de validité de celle-ci. Ainsi, il s'étend généralement de la déclaration de la variable jusqu'à la fin du bloc de code auquel appartient la déclaration. Ceci est vrai dans notre langage, sauf dans le programme principal. Dans celui-ci, tout nom (variable ou fontion) déclaré est global, ce qui signifie qu'il est valide du début jusqu'à la fin du programme, qu'importe où survient sa déclaration. Par exemple avec ce code:

```
print y
let y = x
let x = "Hello World"
```

Le programme écrit "Hello World", même si la valeur est donnée à la variable plus bas que l'instruction qui doit l'écrire. Ceci est en place pour permettre les programmes complexes, où les fonctions s'appellent les unes les autres, sans ordre de précédance précis. Pour voir les effets du scope, nous pouvons implémenter le bloc de code, qui est une instruction permettant de contrôler le scope des variables déclarées à l'intérieur. Son implémentation est la suivante:

```
statement -> ...
| block {% id %}

block -> "{" program "}" {% (data) => ({ st_type: "block", block: data[1] }) %}
```

À présent, si nous essayons le code suivant:

```
{
    let x = 5
    print x
}
print x
```

Le programme devrait retourner une PlReferenceError, car x n'est plus dans le scope. De plus le programme suivant devrait aussi retourner une erreur:

```
{
    print x
    let x = 5
}
```

Car nous ne sommes plus dans le scope global, le scope d'une variable n'est plus étendu à la totalité du programme mais commence à sa déclaration et s'arrête à la fin du bloc.

### 4. Le réassignement

À présent, pour qu'une variable soit réellement variable, il nous faut l'instruction de réassignement. Cellec-ci nous laisse changer la valeur d'une variable déjà déclarée. Elle peut être utile par exemple si nous voulons changer la valeur d'une variable dont le scope est plus étendu que le bloc dans lequel nous changeons sa valeur. Si nous le redéclarions simplement, la portée du changement de valeur serait réduit à ce bloc. Dans ce cours, pour éviter le risque d'ambiguïté, nous utiliserons un mot-clé au début de l'instruction, "mut". Commencez par ajouter ce mot-clé ou celui que vous aurez choisi dans le lexer, puis ajoutez cette règle à la grammaire:

```
statement -> ...
| reassignment {% id %}

reassignment -> "mut" ___ %Id __ "=" __ expression {% (data) => ({ st_type: "reassignment", name: data[2].value, value: data[6] }) %}
```

Et voilà! Désormais, nous pouvons utiliser ce code:

```
let x = 2 + 4
print x
mut x = 5
print x
```

### 5. Vérification

Pour tester votre maîtrise de la grammaire et du lexer, essayez d'implémenter par vous-mêmes:

1. Le mot-clé "mut" permet d'indiquer au parser que nous effectuons un réassignement. Mais la plupart des langages n'ont pas besoin d'un tel mot clé. Essayez de trouver ce que notre langage n'a pas que d'autre langages comme python ou C ont qui leur permet d'éviter le mot-clé "mut".

2. Il est souvent utile dans les langages de pouvoir utiliser des raccourcis comme "+=" ou "++" pour pouvoir changer la valeur d'une variable rapidement. Essayez d'implémenter ces deux formes spéciales de réassignement, sans utiliser d'autre objet fourni par l'API que ceux que nous avons déjà vus.

3. Actuellement, l'instruction du bloc ne nous est pas très utile. Dans beaucoup de langages, il existe une instruction "let ... = ... in {...}", qui nous permet de créer un bloc où la variable déclarée par la structure est valide. Cela peut-être utile pour augmenter la lisibilité du code, et contrôler le scope d'une variable. Comment implémenter une telle chose avec nos outils actuels ? Essayez comme dans l'exercice précédant de résoudre le probléme en combinant des objets de l'API déjà vus.

## Exercice 4 - If-else et boucle while

À présent que nous avons des variables, il manque encore à notre langage quelques fonctionnalités. L'une d'entre elles est le if-else et la boucle while. Attention: ce chapitre s'appuye sur plusieurs fonctionnalités implémentées au travers des exercices de vérification. Si vous ne les avez pas faits, essayez de le faire maintenant. D'ici la fin de ce chapitre, le langage pourra effectuer des programmes tels que:

```
let c = 0
while c < 5 {
    print c
    mut c ++
}
if true {
    print "true is definitively true"
}
```

### 1. Le if-else

Le if-else est une instruction qui permet d'effectuer un bloc selon une condition précise. Pour l'implémenter, commençons par ajouter les mots-clés "if" et "else" à notre lexer. Puis ajoutons cette règle à la grammaire:

```
statement -> ...
| if_statement {% id %}

if_statement -> "if" ___ expression __ "{" program "}" else_statement {% (data) => ({ st_type: "if-else", condition: data[2], if_block: data[5], else_block: data[7] }) %}

else_statement -> __ "else" __ "{" program "}" {% (data) => data[4] %}
```

À présent, si nous faisons:

```
let x = 0
if x == 0 {
    print "x is 0"
} else {
    print "x isn't 0"
}
```

Et le programme devrait écrire "x is 0", ce qui est vrai. Cependant, vous pourriez vous demander pourquoi la régle de grammaire est en deux partie. La réponse est simple: nous ne voulons pas toujours de else lorsque nous utilisons if. Voici ce que nous pouvons ajouter à la règle pour obtenir ce comportement:

```
else_statement -> ...
| null {% () => null %}
```

Ainsi le programme suivant fonctionne aussi:

```
let x = 0
if x == 0 {
    print "x is 0"
}
```

Vous remarquerez que le if-else, tout comme la boucle while qui vient juste après, crée un bloc de code. Ainsi, s'applique à l'intérieur les règles de scope vues dans le chapitre précédant.

### 2. La boucle while

La boucle while est une boucle qui évalue à chaque boucle une condition pour savoir si elle doit continuer à exécuter son bloc de code, ou passer aux instructions suivantes. Ajoutons d'abord le mot-clé "while" au lexer, puis nous pouvons ajouter cette règle à la grammaire:

```
statement -> ...
| while_loop {% id %}

while_loop -> "while" ___ expression __ "{" program "}" {% (data) => ({ st_type: "while", condition: data[2], loop_block: data[5] }) %}
```

Ce programme devrait fonctionner jusqu'à ce que vous l'arrêtiez volontairement avec un Ctrl+C:

```
while true {
    print 1
}
print 0
```

### 3. Vérification

Pour finir ce court chapitre, essayez ces quelques exercices. Les instruction de flot de contrôle (c'est ainsi qu'on les appelle) sont plutôt faciles à intégrer à un langage mais peuvent très puissantes.

1. L'interpréteur intègre aussi un objet do-while, dont la seule différence avec le while est le st\_type ("do-while" au lieu de "while"). Celui-ci permet de créer une boucle qui évalue sa condition après avoir exécuté son bloc et non pas avant comme le while. Tentez donc de l'intégrer au langage.

2. Beaucoups de langages proposent un "elif", qui combine permet d'enchaîner sur un second if, si le premier échoue. Essayez de l'implémenter grâce à notre implémentation en deux partie du if-else.

3. Les langages modernes permettent souvent une sytaxe alternative du if ou même du if-else, suivi d'une seule instruction, sans utiliser d'accolades. Cependant, dans notre grammaire actuelle, cela créerait de l'ambiguïté. Essayez de comprendre pourquoi, et voyez quels changement vous devez apporter à la grammaire actuelle pour intégrer cette fonctionnalité.

## Exercice 5 - Les fonctions

Nous arrivons enfin à la fonctionnalité principale des langages de programmation: les fonctions. Celles-ci représentent un réel défi d'implémentation car elles doivent exécuter à chaque appel leur bloc de code en initialisant des paramètres avec les valeurs des arguments fournis, et conserver une trace de celles-ci en cas de récursivité. Dans ce chapitre, nous implémenterons les déclarations de fonctions, les appels de procédures et de fonctions et l'instruction de retour. Nous pourrons à la fin de celui-ci calculer la suite de fibonacci de la manière suivante:

```
fn fib (n) {
    if n < 2 {
        return n
    }
    return fib(n - 1) + fib(n - 2)
}
print fib(10)
```

### 1. La déclaration de fonction

Pour déclarer une fonction, il nous faut son nom, son code et ses paramètres. Commençons par rajouter le mot-clé "fn", ainsi que les parenthèses "(" et ")", et la virule "," à notre lexer. La règle pour la déclaration est la suivante:

```
statement -> ...
| function_declaration {% id %}

function_declaration -> "fn" ___ %Id __ "(" parameter_list ")" __ "{" program "}" {% (data) =>
    ({
        st_type: "function declaration",
        name: data[2].value,
        parameter_list: data[5],
        block: data[9]
    })
%}

parameter_list -> __ %Id __ {% (data) => [data[1].value] %}
| parameter_list "," __ %Id __ {% (data) => [...data[0], data[3].value] %}
| __ {% () => [] %}
```

Avec cette règle, nous pouvons déclarer une fonction mais pas encore l'utiliser:

```
fn sum (x, y) {
    print x + y
}
```

Contrairement à d'autres langages, les fonctions ne sont pas utilisables comme des variables. Il est impossible d'affecter par exemple la valeur de sum à une variable x. De plus, les closure ne fonctionnent pas non plus. Une fonction s'exécute dans le contexte dans lequel elle est appelée, et non pas celui où elle est déclarée. Elles suivent en revanche les mêmes règles que les variables en termes de scope.

### 2. L'instruction de retour

Avant d'appeler une fonction, il serait utile qu'elle puisse retourner une valeur. Nous pouvons faire cela grâce à l'instruction de retour. Ajoutez le mot-clé "return" au lexer, puis cette règle à la grammaire:

```
statement -> ...
| return_statement {% id %}

return_statement -> "return" ___ expression {% (data) => ({ st_type: "return", value: data[2] }) %}
```

Vous pouvez l'ajouter à une déclaration de fonction, mais toujours pas la tester. L'instruction return utilise en interne une exception pour pouvoir remonter les fonctions d'exécution jusqu'à la fonction responsable de l'appel. Si aucune fonction n'existe au-dessus du return, l'exception va simplement arriver jusqu'à l'utilisateur, pour signifier qu'un return a été utilisé au mauvais endroit.

### 3. L'appel de fonction

L'appel de fonction permet donc d'utiliser le bloc de code que contient une fonction en lui passant des arguments pour chacun de ses paramètres. Contrairement à JavaScript, il faut que le nombre d'arguments et de paramètres correspondent parfaitement. Cette expression possède généralement une très haute priorité, c'est pourquoi nous allons remplacer où qu'elle soit dans votre grammaire actuelle la dernière utilisation de value avec notre nouvelle règle:

```
function_call -> %Id __ "(" expression_list ")" {% (data) => ({ ex_type: "function call", name: data[0].value, argument_list: data[3] }) %}
| value {% id %}

expression_list -> __ expression __ {% (data) => [data[1]] %}
| expression_list "," __ expression __ {% (data) => [...data[0], data[3]] %}
| __ {% () => [] %}
```

Désormais, nous pouvons effectuer dans un programme:

```
fn sum (x, y) {
    return x + y
}

print sum(2, 3)
```

Et la console répondra 5! Nous pouvons aussi essayer le programme décrit au début. Il est souvent utilisé comme benchmark pour les langages, car malgrès sa simplicité il peut très vite accumuler une quantité phénoménale d'appels de fonctions récursifs. Commencez à partir de 0 et montez progressivement avec les valeurs données en entrée:

```
fn fib (n) {
    if n < 2 {
        return n
    }
    return fib(n - 1) + fib(n - 2)
}
print fib(10)
```

### 4. L'appel de procédure

L'appel de procédure permet d'appeler une fonction sans se préoccuper de sa valeur de retour. Ce type de fonction est souvent appeler procédure, car elle ne retourne plus de valeur comme une fonction mathématique, mais sert davantage de code réutilisable effectuant un effet comme changer une valeur globale ou écrire dans la console. Toujours pour éviter l'ambiguïté, nous avons besoin d'un mot-clé pour cette instruction. Nous proposons dans ce cours "call". Voici l'implémentation dans la grammaire:

```
statement -> ...
| procedure_call {% id %}

procedure_call -> "call" __ expression {% (data) => ({ st_type: "call", call: data[2] }) %}
```

En réalité, cette implémentation permet d'utiliser call sur n'importe quelle expression, mais les seules vraiment utiles sont les appels de fonction. Nous pouvons tester cette nouvelle instruction avec ce code:

```
fn greet (name) {
    print "Hello, " + name + " !"
}
call greet("Tiro")
```

### 5. Vérification

Maintenant que les fonctions ont été implémentées, il devient possible d'écrire de véritables programmes grâce au langage que nous sommes en train de construire. Voici encore quelques fonctionnalités que vous pouvez essayer d'implémenter:

1. Dans la plupart des langages, il est possible d'utiliser l'instruction de retour sans valeur, uniquement pour sortir plus tôt d'une fonction. Essayez d'ajouter cette possibilité dans la définition de return\_statement.

2. Chez les langages fonctionnels, le point "." permet d'enchaîner les fonctions en passant la valeur suivie par un point comme premier argument à la fonction qui suit ce point. Voyez si vous pouvez implémenter ce raccourci syntaxique uniquement grâce à la grammaire. L'exemple ci-dessous écrit 25 dans la console.

```
fn sum (x, y) { return x + y }
print sum(2, 3).sum(5).sum(6).sum(9)
```

## Fin - Autres fonctionnalités à implémenter et remerciements

Ce cours touche à sa fin. Vous avez durant celui-ci appris à utiliser le lexer moo et le parser nearley.js. Vous pouvez, si vous le souhaitez, continuer de travailler sur votre langage: l'interpréteur implémente les listes, les appels de listes et la boucle foreach qui n'ont pas été abordés durant ces exercices. Il implémente aussi un type d'expression "custom", qui vous permet de définir la fonction d'exécution de l'expression. Tout est dans le fichier doc.md. Vous pouvez aussi essayer de comprendre le fonctionnement de l'interpréteur et bâtir le vôtre. 

Je vous remercie sincèrement si vous avez le courage de continuer jusqu'ici, et vous souhaite bien du bonheur pour vos prochains projets de programmation.
