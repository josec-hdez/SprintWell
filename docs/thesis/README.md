# docs/thesis

Fuentes de la memoria del Trabajo de Fin de Máster (TFM) de SprintWell, escrita en español (brief §3).

## Convención de formato

Los capítulos se redactan en **Markdown** (`.md`), no en LaTeX puro. Esta decisión es deliberada y consistente con el resto del repositorio:

- El _Single Source of Truth_ (SSOT) del proyecto, `docs/sprintwell-brief.md`, también es Markdown.
- Las matemáticas se escriben en LaTeX inline (`$ ... $`) y display (`$$ ... $$`); ambos delimitadores son interpretados nativamente por Pandoc y por la mayoría de visores de Markdown (GitHub Web, VSCode con extensión).
- No se requiere instalar TeX Live ni una distribución LaTeX completa para revisar los borradores: cualquier visor de Markdown con soporte de KaTeX/MathJax es suficiente para lectura.
- La compilación a PDF se hace **bajo demanda** con Pandoc, no en cada commit ni en CI.

## Estructura del directorio

```
docs/thesis/
├── README.md           # este archivo
└── chapters/
    └── 03-formal-model.md   # capítulo 3 (issue #16): formalización matemática
```

Convención de nombres de capítulo: `chapters/<NN>-<slug>.md`, con `NN` en formato de dos dígitos correspondiente al número de capítulo del TFM (`03-formal-model.md` es el Capítulo 3, aunque sea el primero en existir).

## Renderizado a PDF (local, bajo demanda)

Cuando se necesite un PDF (revisión de un tutor, entrega parcial, etc.), se usa Pandoc:

```bash
cd docs/thesis
mkdir -p build
pandoc chapters/03-formal-model.md \
    -o build/03-formal-model.pdf \
    --pdf-engine=lualatex
```

Alternativas: `--pdf-engine=xelatex` o `--pdf-engine=pdflatex` si lualatex no está disponible. Para conservar tipografía profesional y soporte Unicode completo (acentos, símbolos matemáticos, ligaduras), **lualatex** o **xelatex** son preferibles a `pdflatex`.

Prerrequisitos para renderizar:

- Pandoc (`brew install pandoc` en macOS).
- Una distribución LaTeX (`brew install --cask mactex-no-gui` para una instalación completa o `brew install basictex` para una mínima, ampliable con `tlmgr install ...`).

## Trabajo futuro (diferido)

Los siguientes elementos se han pospuesto a issues posteriores y NO forman parte del scope actual:

- **`bibliography.bib` compartida.** Hoy las referencias de cada capítulo se incluyen como lista numerada en Markdown al final del propio capítulo. Cuando exista más de un capítulo y empiece a haber referencias cruzadas, se centralizará en un `bibliography.bib` consumido por Pandoc con `--citeproc`.
- **`main.md` / `main.tex` de ensamblaje.** Cuando todos los capítulos del TFM estén redactados, se introducirá un fichero raíz que los concatene en orden con frontmatter (portada, índice) y backmatter (bibliografía, anexos).
- **CI de compilación.** Un job de GitHub Actions que ejecute Pandoc sobre los cambios en `docs/thesis/**` y publique un PDF como artifact. Diferido hasta que la memoria esté avanzada, para evitar el coste de mantener una imagen Docker con TeX Live (~3 GB) en el pipeline.

## Por qué Markdown y no LaTeX puro

Decisión pragmática:

1. **Consistencia con el SSOT.** El brief es Markdown; los capítulos lo son también. Una sola sintaxis para todo el conocimiento del proyecto.
2. **Bajo coste de revisión.** Cualquier reviewer puede leer el contenido en GitHub directamente, sin compilar nada.
3. **LaTeX cuando importa.** Pandoc pasa las ecuaciones a LaTeX al renderizar, así que la tipografía matemática final no se sacrifica.
4. **Tooling diferido.** No es necesario decidir hoy entre lualatex / xelatex / pdflatex, ni configurar biber / biblatex, ni mantener un `preamble.tex`. Esa complejidad se introduce cuando agregue valor (ensamblaje final), no antes.
