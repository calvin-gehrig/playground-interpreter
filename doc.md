# Documentation
Ce fichier est consacré à la documentation complète de l'API de l'interpréteur. Pour apprendre à l'utiliser, il est conseillé de recourir à la série d'exercices présente dans le fichier exercices.md.

## Table des matières
1. Moo et Nearley.js
2. Comment lire cette documentation
3. Le programme principal et les blocs
4. Les instructions
    1.  La déclaration de variable
    2.  La déclaration de fonction
    3.  Le réassignement de valeur
    4.  Le bloc de code
    5.  L'instruction de retour
    6.  L'appel de procédure
    7.  Print
    8.  Le if-else
    9.  Boucles while et do-while
    10. La boucle foreach
5. Les expressions
    1.  Les valeurs littérales
    2.  Les variables
    3.  La liste
    4.  L'appel de liste
    5.  L'appel de fonction
    6.  Les opérations binaires
    7.  Les opérations customs
6. Les erreurs
    1.  Les erreurs PlayGroundSystemError
    2.  Les erreurs AstError
    3.  Les erreurs PlError

## 1. Moo et Nearley.js
La documentation consacrée à ces deux outils se trouve:
- pour Moo: [no-context/moo](https://github.com/no-context/moo)
- pour Nearley.js: [nearley.js.org](https://nearley.js.org/)

Ici, il ne sera traité que de l'API de l'interpréteur, en partant du principe que les réponses aux questions concernant ces deux dépendances se trouvent déjà dans leurs documentations.

## 2. Comment lire cette documentation
Chaque chapitre de cette documentation est découpé ainsi:
- un paragraphe explicatif
- l'objet valide utilisé par l'API
- un exemple d'implémentation

Dans l'exemple d'implémentation, il faut noter la présence de "\_\_". Ils indiquent de possibles espaces blancs (espaces, retours à la ligne, tabulation). De même, les "\_\_\_" indiquent un espace blanc obligatoire.

## 3. Le programme principal et les blocs
Le programme principale, c'est-à-dire le point d'entrée de la grammaire doit être un tableau d'instructions, afin que l'interpréteur puisse itérer dessus instruction après instruction. Il en est de même pour les blocs de code, comme le contenu d'une fonction ou d'un if-else.

#### Objet:
`[ <instructions valides> ] ou n'importe quel objet itérable contenant des instructions valides`

#### Exemple d'implémentation:
```
main_program -> block {% id %}
block -> __ statement __ {% (data) => [data[1]] %}
| block statement __ {% (data) => [...data[0], data[1]] %}
```

## 4. Les instructions
Les instructions sont les unités de bases d'exécution de l'interpréteur. Voici la liste des types d'instruction supportés par celui-ci:

### 4.1 La déclaration de variable
La déclaration de variable permet de créer une variable et de lui donner une valeur. Cette variable est disponible depuis sa déclaration jusqu'à la fin du bloc de code où elle a été définie. Si la variable est globale, c'est-à-dire qu'elle est déclarée dans le bloc de code principal, elle devient disponible dans l'ensemble du programme. 

#### Objet:
```
{
    st_type: "variable declaration",
    name: <l'identifiant de la variable, de préférance une chaîne de caractère ou un symbole>,
    value: <une expression correspondant à la valeur initiale de la variable>
}
```

#### Exemple d'implémentation:
```
variable_declaration -> "let" ___ %Id __ "=" __ expression
{% (data) => ({ 
    st_type: "variable declaration",
    name: data[2].value,
    value: data[6] 
}) %}
```

> #### Note:
> ``
> let a = b
> let b = a
> ``
> Ici les deux variables sont appliquées l'une à l'autre. C'est une référence circulaire, mais l'interpréteur ne gère pas ce genre d'erreur. Il va donc renvoyer une erreur stack overflow dûe au l'algorithme qui récupère tous les noms globaux.

### 4.2 La déclaration de fonction
La déclaration de fonction crée une fonction valide de sa déclaration jusqu'à la fin du bloc de code où elle a été définie. De même que les variables, elle devient globale si elle est déclarée dans le bloc de code principal. Les fonctions, contrairement à d'autres languages, ne sont ici pas utilisables comme des variables et vice-versa.

#### Objet:
```
{
    st_type: "function declaration",
    name: <l'identifiant de la fonction, de préférance une chaîne de caractère ou un symbole>,
    parameter_list: <la liste de ses paramètres, un objet itérable convertissable en tableau contenant des expressions valides>,
    block: <le bloc de code à exécuter à chaque appel, un objet itérable contenant des instructions valides>
}
```

#### Exemple d'implémentation:
```
function_declaration -> "function" ___ %Id __ "(" parameter_list ")"
    __ "{" block "}" {% (data) => ({
        st_type: "function declaration",
        name: data[2].value,
        parameter_list: data[5],
        block: data[9]
    }) %}

parameter_list -> __ %Id __ {% (data) => [data[1].value] %}
| parameter_list "," __ %Id __ {% (data) => [...data[0], data[3].value] %}
| __ {% (data) => [] %}
```

### 4.3 Le réassignement de valeur
Le réassignment de valeur permet de changer la valeur d'une variable déjà déclarée. Elle n'est soumise à aucune restriction de type, mais il est impossible de changer une valeur contenue dans un tableau en passant par une variable contenant ce tableau et l'index de la valeur. Il est aussi impossible de changer le contenu d'une fonction. Il est aussi important de noter que seule une variable déjà déclarée peut-être modifiée, c'est-à-dire qu'il faut se trouver dans la limite de validité définie par la déclaration de la variable.

#### Objet:
```
{
    st_type: "reassignment",
    name: <le nom de la variable modifiée, de préférance une chaîne de caractère ou un symbole>,
    value: <une expression correspondant à la nouvelle valeur de la variable>
}
```

#### Exemple d'implémentation:
```
reassignment -> "mut" ___ %Id __ "=" __ expression {% (data) => ({
    st_type: "reassignment",
    name: data[2].value,
    value: data[6]
}) %}
```

### 4.4 Le bloc de code
Le bloc de code est aussi une instruction. Sa seule utilité est de créer une limite de validité plus courte pour les variables et fonctions contenues dedans. Ce wrapper existe pour permettre de déclarer des blocs comme instructions, au lieu de simple brique pour d'autres instructions. Pour plus d'informations conçernant les blocs, voir Chapitre 2.

#### Objet:
```
{
    st_type: "block",
    block: <le bloc de code>
}
```

#### Exemple d'implémentation:
```
block_statement -> "do" __ "{" block "}" {% (data) => ({ st_type: "block", block: data[3]}) %}
```

### 4.5 L'instruction de retour
L'instruction de retour permet de ressortir et de renvoyer une valeur à n'importe quel moment dans une fonction, y compris depuis une structure plus petite comme un if-else ou une boucle. Elle peut apparaître plusieurs fois dans le bloc d'une fonction. Elle doit retourner une valeur, qui peut être null ou undefined dans le cas où la fonction veut seulement s'arrêter avant le fin de son bloc, sans retourner de valeur.

#### Objet:
```
{
    st_type: "return",
    value: <une expression correspondant à la valeur retournée>
}
```

#### Exemple d'implémentation:
```
return_statement -> "return" ___ expression {% (data) => ({ st_type: "return", value: data[2] }) %}
| "return" {% (data) => ({ st_type: "return", value: null }) %}
```

### 4.6 L'appel de procédure
L'appel de procédure permet d'appeler une fonction comme une instruction, sans se préoccuper de sa valeur de retour. En réalité, elle n'est qu'un wrapper autour d'une expression.

#### Objet:
```
{
    st_type: "call",
    call: <une expression à exécuter>
}
```

#### Exemple d'implémentation:
```
procedure_call -> "call" ___ expression {% (data) => ({ st_type: "call", call: data[2] }) %}
```

### 4.7 Print
Print est une instruction qui permet de facilement écrire dans la console. Elle se base sur la fonction "console.log()" de Javascript.

#### Objet:
```
{
    st_type: "print",
    value: <une expression dont la valeur est à imprimer>
}
```

#### Exemple d'implémentation:
```
print -> "print" ___ expression {% (data) => ({ st_type: "print", value: data[2] }) %}
```

### 4.8 Le if-else
Le if-else permet d'exécuter selon une condition, soit un bloc if, soit un bloc else. Le bloc else peut ne pas être défini, dans ce cas le bloc if est seulement ignoré si la condition est fausse. Pour faire un if-elif, il suffit de remplir le bloc else avec un autre if-else évaluant la condition du elif.

#### Objet:
```
{
    st_type: "if-else",
    condition: <une expression dont la valeur détermine le bloc à exécuter>,
    if_block: <bloc à exécuter si la condition est vraie>,
    else_block: <bloc à exécuter si la condition est fausse>
}
```

#### Exemple d'implémentation:
```
if_statement -> "if" ___ expression __ "{" block "}" else_statement {% (data) => ({
    st_type: "if-else",
    condition: data[2],
    if_block: data[5],
    else_block: data[7]
}) %}

else_statement -> __ "else" __ "{" block "}" {% (data) => data[4] %}
| __ "elif" ___ expression __ "{" block "}" __ else_statement {%
    (data) => [{
        st_type: "if-else",
        condition: data[3],
        if_block: data[6],
        else_block: data[9]
    }]
%}
| __ {% () => null %}
```

### 4.9 Boucles while et do-while
Les boucles while et do-while répètent un même bloc tant que leur condition est vraie. La while évalue celle-ci au début de la boucle, la do-while à la fin. Cependant elles ne sont pas protégées contre les boucles infinis, auquel cas Javascript retournera une erreur stack overflow.

#### Objet:
```
{
    st_type: "while" ou "do-while",
    condition: <une expression dont la valeur est évaluée pour décider de continuer la boucle>,
    loop_block: <la bloc exécuté à chaque boucle>
}
```

#### Exemple d'implémentation:
```
while_loop -> "while" ___ expression __ "{" block "}" {% (data) =>
    ({
        st_type: "while",
        condition: data[2],
        loop_block: data[5]
    }) %}
do_while_loop -> "do" __ "{" block "}" __ "while" ___ expression {% (data) =>
    ({
        st_type: "do-while",
        condition: data[8],
        loop_block: data[3]
    }) %}
```

### 4.10 La boucle foreach
La boucle foreach permet d'exécuter un bloc avec un paramètre prenant successivement chaque valeur contenue dans une collection.

#### Objet:
```
{
    st_type: "foreach",
    parameter: <l'identifiant du paramètre, de préférance une chaîne de caractère ou un symbole>,
    collection: <un objet itérable sur lequel effectuer le foreach>,
    loop_block: <le bloc exécuté à chaque boucle>
}
```

#### Exemple d'implémentation:
```
foreach_loop -> "foreach" ___ %Id ___ "in" ___ expression __ "{" block "}" {% (data) =>
    ({
        st_type: "foreach",
        parameter: data[2].value,
        collection: data[6],
        loop_block: data[9]
    })
%}
```

## 5. Les expressions
Les expressions sont des unités de code renvoyant une valeur. Elles utilisent des fonctions différentes de celles des instructions, et correspondent généralement à leur équivalent en Javascript.


### 5.1 Les valeurs littérales
Les valeurs littérales sont des valeurs écrites à même le code, comme 2, "hello" ou true. Ce sont les plus petites unités des expressions. Trois sont supportées par l'interpréteur: les nombres, les chaînes de caractères et les booléennes.

#### Objet:
```
{
    ex_type: "number", "string" ou "boolean",
    value: <la valeur elle-même>
}
```

#### Exemple d'implémentation
```
value -> %number {% (data) => ({ ex_type: "number", value: Number(data[0].value) }) %}
| %string {% (data) => ({ ex_type: "string", value: data[0].value }) %}
| "true" {% () => ({ ex_type: "boolean", value: true }) %}
| "false" {% () => ({ ex_type: "boolean", value: false }) %}
```

### 5.2 Les variables
Les variables sont des noms qui peuvent se substituer par la valeur associée à ce nom dans l'environnement d'exécution. Si une variable avec le même nom est déclarée plusieurs fois dans des blocs de code compris les uns dans les autres, celle-ci aura la valeur de la déclaration la plus proche. Par exemple, si une fonction déclare a = 5, puis effectue une boucle while dans laquelle on déclare a = 7, si a est utilisée dans cette même boucle ou dans tout bloc exécuté depuis cette boucle, elle aura la valeur 7.

#### Objet:
```
{
    ex_type: "variable",
    name: <le nom/identifiant de la variable, de préférance une chaîne de caractère ou un symbole>
}
```

#### Exemple d'implémentation:
```
variable -> %Id {% (data) => ({ ex_type: "variable", name: data[0].value }) %}
```

### 5.3 La liste
Une liste est une collection de valeur, équivalente à un tableau en Javascript. Dans l'état actuel de l'interpréteur, elle est immutable, et il est nécessaire de recourir aux opérations customs pour pouvoir en modifier le contenu. Sa valeur est toujours convertie en un tableau d'expressions.

#### Objet:
```
{
    ex_type: "list".
    value: [ <expressions valides> ] ou n'importe quel objet itérable contenant des expressions valides
}
```

#### Exemple d'implémentation:
```
list -> "[" data "]" {% (data) => ({ ex_type: "list", value: data[1] }) %}
data -> __ expression __ {% (data) => [data[1]] %}
| data "," __ expression __ {% (data) => [...data[0], data[3]] %}
| __ {% () => [] %}
```

### 5.4 L'appel de liste
Il est possible d'accéder à une valeur contenue dans une liste grâce à un appel de liste. Il n'est en revanche pas possible d'en modifier le contenu par ce biais.

#### Objet:
```
{
    ex_type: "list call",
    list: <la liste accédée, un objet itérable convertssable en tableau>,
    index: <l'index utilisé, une valeur convertissable en entier valide, non négatif>
}
```

#### Exemple d'implémentation:
```
list_call -> expression __ "[" __ expression __ "]" {% (data) => 
    ({
        ex_type: "list call",
        list: data[0],
        index: data[4]
    })
%}
```

### 5.5 L'appel de fonction
L'appel de fonction permet d'exécuter une fonction en lui passant une liste d'arguments comme paramètres. Le nombre d'arguments doit correspondre exactement au nombre de paramètres, et la fonction doit avoir été déclarée grâce à une déclaration de fonction.

#### Objet:
```
{
    ex_type: "function call",
    name: <le nom de la fonction, de préférance une chaîne de caractère ou un symbole>,
    argument_list: <un objet itérable et convertissable en tableau, contenant des expressions valides>
}
```

#### Exemple d'implémentation:
```
function_call -> %Id __ "(" data ")" {% (data) => 
    ({
        ex_type: "function call",
        name: data[0].value,
        argument_list: data[3] //La description de data se trouve dans le Chapitre 5.3
    })
%}
```

### 5.6 Les opérations binaires
Les opérations binaires sont toutes les opérations composées de deux opérandes et d'un symbole décrivant l'opération. Elles utilisent la même structure, se différenciant uniquement par leur type.

#### Objet:
```
{
    ex_type: <l'opération en question>,
    first_operand: <une expression correspondante à l'opérande à gauche>,
    second_operand: <une expression correspondante à l'opérande à droite>
}
```

#### Exemple d'implémentation
```
addition -> addition __ "+" __ value {% (data) => 
    ({
        ex_type: "addition",
        first_operand: data[0],
        second_operand: data[4]
    })
%}
```

#### Liste des opérations supportées:
Une liste des opérations avec leur type, et leur traduction en Javascript.
- "and" => a && b
- "or" => a || b
- "equality" => a == b,
- "inequality" => a!= b,
- "strict equality" => a === b,
- "strict inequality" => a !== b,
- "greater-than comparison" => a > b
- "less-than comparison" => a < b
- "greater-or-equal comparison" => a >= b
- "less-or-equal comparison" => a <= b
- "addition" => a + b,
- "subtraction" => a - b,
- "multiplication" => a * b,
- "division" => a / b,
- "euclidian division" => Math.floor(a / b)
- "modulo" => a % b (comportement particulier lorsque l'un des opérandes est négatif!)

> #### Note:
> Dans l'exemple d'implémentation, le premier opérande est une addition alors que le second est une valeur. Ceci est nécessaire afin d'éviter de l'ambiguïté. En effet, si il pouvait y avoir une addition des deux côtés, alors 1 + 2 + 3 pourrait être interpréter comme (1 + 2) + 3 et comme 1 + (2 + 3). Le fait de séparer l'ensemble des opérations en plus petits ensembles, puis de les évaluer ainsi permet non seulement d'éviter l'ambiguïté mais aussi de créer une priorité des opérations. Ainsi dans une grammaire un schéma courant est:
> ` basse_priorité -> basse_priorité symbole haute_priorité | haute priorité `
> Ici l'opération avec une haute priorité est toujours évaluée avant celle de basse priorité.

### 5.7 Les opérations customs
Les opérations customs permettent de créer de nouvelles opérations, en définissant leur interprétation dans la grammaire. Elles utilisent pour cela une fonction à exécuter pendant l'interprétation, une liste d'id et une liste d'expressions. À l'interprétation, chaque expression est évaluée avant d'être passée dans la fonction, puis sont passés chaque id de la liste d'id après avoir étés substitués avec leurs valeurs.

#### Objet:
```
{
    ex_type: "custom",
    name_list: <un objet itérable contenant des noms à substituer, de préférance des chaîne de caractère ou des symboles>,
    expression_list: <un objet itérable contenant des expressions à évaluer>
    func: <la fonction d'interprétation>
}
```

#### Exemple d'implémentation
```
power -> list_call __ "**" __ list_call {% (data) =>
    ({
        ex_type: "custom",
        name_list: null,
        expression_list:[data[0], data[4]],
        func: (first_operand, second_operand) => {
            return first_operand ** second_operand;
        }
    })
%}
```

## 6. Les erreurs
Le système d'erreur de l'interpréteur permet de différencier les erreurs issues de la grammaire, les AstError et les erreurs issues du code interprété, les PlError. Il existe un troisième type d'erreur, les PlayGroundSystemError, qui sont des erreurs internes au fonctionnement de l'interpréteur.

### 6.1 Les erreurs PlayGroundSystem
Les erreurs PlayGroundSystem comme dit ci-dessus correspondent à des erreurs renvoyées par le système de l'interpréteur. Si l'une d'elle apparaît, il n'y a rien d'autre à faire qu'essayer une autre grammaire, un autre code ou comprendre l'interpréteur et trouver l'erreur.

##### 0000: Unhandled error
L'erreur 0000 correspond à une erreur renvoyée par Javascript directement, et non pas par l'interpréteur. Cela signifie que quelque chose d'imprévu au niveau de la conception de l'interpréteur s'est produit.

##### 0001: Failed to end scope
L'erreur 0001 se produit si le programme a tenté de fermer le scope actuel, c'est-à-dire de finir le bloc de code actuel, alors qu'il s'agissait déjà du dernier scope existant. Cela ne devrait se produire que si environment.endScope() est appelé de manière imprévue.

##### 0002: Unknown operation type
L'erreur 0002 apparaît si un objet a un type d'opération binaire lorsqu'il passe dans la fonction execExpression, mais perds celui-ci avant d'être évalué dans la fonction execBinary, ou simplement si le switch de execExpression ne correspond pas au switch de execBinary.

### 6.2 Les erreurs AstError
Les erreurs AstError correspondent à une faute dans la grammaire passée à l'interpréteur. Il y en a trois types:

#### Les erreurs AstObjectError
Les erreurs AstObjectError sont produites si un objet obtenus grâce à l'ast ne correspond pas à ce qui était attendu. Par exemple, si l'interpréteur attendait une instruction et qu'il reçoit une expression.

##### ... : ... object was expected to be iterable
Ces erreurs sont les plus communes des AstObjectError. En effet, de nombreux objets doivent être itérable de manière à ce que l'interpréteur puisse itérer dessus ou les convertir en tableaux. L'erreur survient si le test `object !== null && typeof object[Symbol.iterator] === "function"` échoue.

##### ... : ... object was expected to be an iterable object with length or size, or less than 1000 items
Cette erreur apparaît lorsqu'il est nécessaire de convertir un objet en liste. Pour cela, il faut qu'il soit itérable, mais aussi qu'il aie une longueur utilisable, c'est-à-dire une valeur convertible en un nombre entier supérieur à zéro. Si l'objet possède un attribut length ou size, c'est celui-ci qui sera testé, sinon on vérifie en itérant que la taille de l'objet n'excède pas 1000 éléments. Cette solution permet d'éviter que certains objets itérable infinis sans champ length ou size provoque une boucle infinie lorsque l'interpréteur essaye de les convertir en tableau.

##### 0110: Statement object was expected to be not null
Cette erreur évite que l'interpréteur tente d'accéder à des propriétés de l'objet statement, ce qui produirait une erreur Javascript s'il était _null_ ou _undefined_. Elle est envoyée si (!statement) est vraie.

##### 0120: Func of custom was expected to be a function
Cette erreur apparaît si le champ "func" d'un objet custom n'est exécutable. Cela signfie que `typeof custom.func === "function"` est fausse.

#### Les erreurs AstTypeError
Les erreurs AstTypeError arrivent quand une instruction ou une expression possédait un type inattendu.

##### 0200: Unknown statement type
Cette erreur se produit si une instruction possède un type non compris dans l'ensemble des types d'instruction définis plus haut dans la documentation.

##### 0201: Unknown expression type
Cette erreur est renvoyée si le type d'une expression ne correspond à aucun type présent dans le chapitre 5.

#### Les erreurs AstFieldError
Ces erreurs sont terriblement nombreuses: elles peuvent être envoyées à chaque fois que l'interpréteur s'apprête à accéder au champ d'un objet, afin d'éviter le cas où le champ n'existe pas et c'est une valeur _undefined_ qui va se balader à travers le code. En général, elle indique qu'un test (!object.field) a retourné true, mais lorsque la valeur du champ peut être une valeur falsey (comme 0, false, ""), le test est (object.field === undefined).

### Les erreurs PlError
Les erreurs PlError (pour Programming language error, car c'est le language lui-même qui les renvoie vis-à-vis du code qu'il interprète) concernent le code. C'est donc soit que le language marche correctement et empêche l'utilisateur de faire quelque chose d'interdit, soit que la grammaire agit de manière imprévue, mais valide du point de vue de l'interpréteur.

#### Les erreurs PlReferenceError
Les erreurs PlReferenceError sont renvoyées par l'environnement d'exécution lorsque celui-ci ne parvient pas à retrouver dans le scope actuel un nom appelé depuis le code. Elles indiquent généralement l'utilisation d'une variable ou d'une fonction non déclarée, ou mal écrite. Pour être plus précis, elle est envoyée si la remontée récursive des scopes de l'environnement a atteint la fin de l'environnement avant de trouver un nom correspondant.

#### Les erreurs PlTypeError
Les erreurs PlTypeError viennent du système de type faible de l'interpréteur. Elles sont donc rare, mais néanmoins possibles.

##### 1200: Can't use ... as a variable
Cette erreur indique que lorsque la valeur de la variable a été récupérée, celle-ci n'était en fait pas une variable mais un autre type de symbole. Comme les deux seuls types de symboles sont normalement les variables et fonctions, il s'agit probablement d'une fonction. En effet, l'interpréteur ne permet pas que les fonctions soient utilisées comme des variables.

##### 1201: Can't use ... as a function
Cette erreur correspond exactement à celle au-dessus, sauf que cette fois c'est dans un appel de fonction qu'une variable a été utiliée à la place d'une fonction.

##### 1210: Can't use ... as an index
Cette erreur apparaît si l'index passé à un appel de liste n'est pas une valeur d'index valide en Javascript, c'est-à-dire qu'elle n'est pas un entier valide et non négatif après conversion avec Number().

##### 1211: Can't use ... as a collection
Cette erreur signifie que une valeur impossible à indexer a été utilisée dans un appel de liste.

#### L'erreur PlCollectionError
Cette erreur est renvoyée si la collection donnée à une boucle foreach n'est pas itérable.

#### Les erreurs PlArithmeticError
Ces erreurs proviennent trois opérations: le modulo, la division et la division euclidienne. Dans ces trois cas, si le second opérande est égal à 0, alors ces erreurs sont envoyées.

#### L'erreur PlArityError
Cette erreur apparaît lorsque le nombre d'arguments passés à un appel de fonction ne correspond pas au nombre de paramètres attendus par la fonction. Contrairement à Javascript, il n'est pas possible de donner plus ou moins d'arguments que la fonction en attend.

#### L'erreur PlReturnError
Cette erreur survient si une instruction de retour a été utilisée hors d'une fonction. L'interpréteur utilise cette exception pour remonter l'exécution de la fonction en cours afin d'en sortir. Mais si il n'y a pas d'appel de fonction dans la pile d'appel pour attraper cette exception, alors elle finit par arriver à l'utilisateur.

#### L'erreur PlCustomError
Cette erreur sert de wrapper à une erreur Javascript provenant d'une fonction dans une expression custom. L'utilisation de custom est au risque de l'utilisateur.

