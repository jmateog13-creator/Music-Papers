# Resultats del Control de Qualitat (QA) — Music Papers

S'ha realitzat una revisió tècnica i visual completa de les 5 pàgines que componen els passatemps de **Music Papers** utilitzant un navegador WebKit (1024×768 px).

---

## 📸 Captures de Pantalla dels Passatemps

````carousel
### 📰 Portada (index.html)
![Portada - The Aulatech Daily](file:///Users/jmateog13/.gemini/antigravity-ide/brain/97dea1f3-d319-48ab-a47d-5a5321ea682c/index.png)

<!-- slide -->
### ▦ Notedoku: Tutorial Interactiu
![Notedoku - Tutorial](file:///Users/jmateog13/.gemini/antigravity-ide/brain/97dea1f3-d319-48ab-a47d-5a5321ea682c/notedoku_tutorial.png)

<!-- slide -->
### ▦ Notedoku: Graella i Validació
![Notedoku - Gameplay](file:///Users/jmateog13/.gemini/antigravity-ide/brain/97dea1f3-d319-48ab-a47d-5a5321ea682c/notedoku_gameplay.png)

<!-- slide -->
### ✦ Staff Match: Inici del Joc
![Staff Match - Inicial](file:///Users/jmateog13/.gemini/antigravity-ide/brain/97dea1f3-d319-48ab-a47d-5a5321ea682c/staff_match_initial.png)

<!-- slide -->
### ✦ Staff Match: Glow Àmbar (Nota Seleccionada)
![Staff Match - Glow](file:///Users/jmateog13/.gemini/antigravity-ide/brain/97dea1f3-d319-48ab-a47d-5a5321ea682c/staff_match_glow.png)

<!-- slide -->
### ✦ Staff Match: Error Validat i Comptador
![Staff Match - Validat](file:///Users/jmateog13/.gemini/antigravity-ide/brain/97dea1f3-d319-48ab-a47d-5a5321ea682c/staff_match_validated.png)

<!-- slide -->
### ✎ Mots Amagats: Graella Completa i HUD
![Mots Amagats - Nivell 1](file:///Users/jmateog13/.gemini/antigravity-ide/brain/97dea1f3-d319-48ab-a47d-5a5321ea682c/mots_amagats_level1.png)

<!-- slide -->
### ✎ Mots Amagats: Pantalla de Victòria (5 Nivells)
![Mots Amagats - Victòria](file:///Users/jmateog13/.gemini/antigravity-ide/brain/97dea1f3-d319-48ab-a47d-5a5321ea682c/mots_amagats_victory.png)

<!-- slide -->
### # Crossnote: Mots Correctes (Verd) i Errònies (Vermell)
![Crossnote - Gameplay](file:///Users/jmateog13/.gemini/antigravity-ide/brain/97dea1f3-d319-48ab-a47d-5a5321ea682c/crossnote_gameplay.png)
````

---

## 📝 Informe de Revisió

### 1. Portada ([index.html](file:///Users/jmateog13/Desktop/AulaTech/1.Gamificacion/Music%20Papers/index.html))
* **Llegibilitat**: Excel·lent disseny d'estil diari antic (*newspaper*). Els textos dels 4 articles són perfectament llegibles.
* **Enllaços**: Funcionen correctament apuntant als HTMLs respectius.
* **Consola**: 0 errors.
* > [!WARNING]
  > **Discrepància detectada:** L'article de Notedoku a la portada es descriu com un **"Sudoku de Notes 4×4"** amb les notes *DO, MI, SOL, SI* i que *"cap es repeteix en fila, columna ni quadrant"*. No obstant això, el joc real és un quadrat llatí de **7×7** amb les set notes naturals (*DO, RE, MI, FA, SOL, LA, SI*) i no disposa de quadrants.

### 2. Notedoku ([notedoku.html](file:///Users/jmateog13/Desktop/AulaTech/1.Gamificacion/Music%20Papers/notedoku.html))
* **Visual**: La graella **7×7** es veu i s'alinea perfectament sense problemes de desbordament.
* **Interacció**: Es pot escriure als inputs lliurement.
* **Validació**: El botó **"✓ Comprovar"** funciona correctament marcant de color verd la resposta correcta (`RE` a `0,1`) i vermell la resposta errònia (`SOL` a `0,3`).
* **Tutorial**: Els passos del tutorial interactiu s'executen sense problemes i es mostren bé a sobre de la interfície.
* **Consola**: 0 errors.

### 3. Staff Match ([staff-match.html](file:///Users/jmateog13/Desktop/AulaTech/1.Gamificacion/Music%20Papers/staff-match.html))
* **Visual**: Els pentagrames estan perfectament delineats. La clau de sol està situada a la seva posició correcta: l'"ull" del símbol està exactament envoltant la segona línia des de baix (G4/Sol).
* **Interacció & Glow**: En clicar la nota de l'esquerra, es marca amb un resplendor àmbar brillant (`is-selected`).
* **Validació**: En clicar la mateixa nota (index 0) a la còpia de la dreta (que té la nota alterada a `D5`), es valida immediatament com a error trobat, marcant-se en verd i sumant correctament al HUD.
* **Consola**: 0 errors.

### 4. Mots Amagats ([mots-amagats.html](file:///Users/jmateog13/Desktop/AulaTech/1.Gamificacion/Music%20Papers/mots-amagats.html))
* **Dimensions (Scroll)**: S'ha comprovat que l'alçada del contingut en pantalla s'ajusta exactament a l'alçada del viewport de 768px, **sense generar barra de desplaçament vertical (hasScroll: false)**.
* **Nivells (1 al 5)**: S'ha completat el cicle dels 5 nivells amb autosolve. Després de trobar les paraules de cada nivell, apareix correctament el botó **"Següent nivell →"** al HUD per poder progressar fins a la victòria final al nivell V.
* **Consola**: 0 errors.

### 5. Crossnote ([crossnote.html](file:///Users/jmateog13/Desktop/AulaTech/1.Gamificacion/Music%20Papers/crossnote.html))
* **Interacció**: Els camps d'entrada permeten escriure lletres de forma còmoda.
* **Validació**: El botó **"✓ Comprovar"** funciona perfectament:
  * Pinta en verd la paraula sencera si és correcta (`CLAU`).
  * Pinta en vermell les caselles de les paraules completades però incorrectes (`XOTA` en lloc de `NOTA`).
* **Consola**: 0 errors.
