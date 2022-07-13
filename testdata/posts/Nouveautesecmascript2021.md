---
title: Nouveautés Ecmascript 2021
author: Vincent Hirtz
publish_date: 2021-02-04
abstract: Liste des nouveautés autour de Javascript
---

<img src="images/hello2.png"/>

replaceAll

Pour remplacer toutes les occurrences de chaîne, nous devons utiliser une combinaison de replace et d'une expression régulière globale. Le replaceAll simplifie cela en utilisant directement une chaine correspondante.

Promise.any()

Utilisez Promise.any lorsque vous souhaitez gérer la première promesse qui se réalise.

Weakref

Une instance de WeakRef crée une référence à un objet donné qui le renvoie s'il est toujours en mémoire ou indéfini au cas où l'objet cible aurait été récupéré.

FinalizationRegistry

Une instance de FinalizationRegistry déclenche une fonction de rappel après qu'un objet cible enregistré a été récupéré.

let money = 52_098_342

Nous pouvons désormais séparer le groupe de chiffres à l'aide de traits de soulignement (_, U + 005F). Cette fonctionnalité est bien connue d'autres langages de programmation tels que Java, Python, Perl, Ruby, Rust, Julia, Ada, C #.

new operators

a &&= b; // set a to b only when a is truthy

a ||= b; // set a to b only when a is falsy

a ??= b; // set a to b only when a is nullish

Source: https://github.com/tc39/proposals