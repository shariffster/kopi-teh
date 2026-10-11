'use client';
/* The photograph and WebGL crop share exact pixel registration. */
/* eslint-disable next/no-img-element, jsx-a11y/no-interactive-element-to-noninteractive-role */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  ArrowRight,
  RotateCcw,
  Plus,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useDrink } from './use-drink';
import {
  DRINK_PRESETS,
  EMPTY_RECIPE,
  INGREDIENTS,
  LIQUID_CAPACITY_ML,
  NAMING_SOURCES,
  RECIPE_NOTES,
  recipeFromPreset,
  recipeName,
  sweetnessLabel,
  totalLiquidMl,
  type DrinkRecipe,
} from '@/lib/drink-recipe';
import { materialColor } from '@/lib/beverage/mixing';
import latteAsset from '@/public/assets/beverages/latte/manifest.json';

function Composition({
  recipe,
  small = false,
}: {
  recipe: DrinkRecipe;
  small?: boolean;
}) {
  const total = totalLiquidMl(recipe);
  return (
    <div
      className={`composition ${small ? 'composition-small' : ''}`}
      aria-label={`${total} ml liquid composition`}
    >
      {INGREDIENTS.filter((i) => i.unit === 'ml' && recipe[i.id] > 0).map(
        (i) => (
          <span
            key={i.id}
            title={`${i.label}: ${recipe[i.id]} ml`}
            style={{ flex: recipe[i.id], background: i.color }}
          />
        ),
      )}
    </div>
  );
}
function MiniCup({ recipe }: { recipe: DrinkRecipe }) {
  const rgb = materialColor(recipe).map((v) => Math.round(v * 255));
  return (
    <span className="mini-cup" aria-hidden="true">
      <img src={latteAsset.scene} alt="" />
      <span style={{ background: `rgb(${rgb.join(',')})` }} />
    </span>
  );
}
const summaries: Record<string, string> = {
  'kopi-o': 'Coffee · water · sugar',
  kopi: 'Coffee · sweetened milk',
  'kopi-c': 'Coffee · evaporated milk',
  teh: 'Tea · sweetened milk',
};
export function LatteExperience() {
  const canvas = useRef<HTMLCanvasElement>(null),
    photo = useRef<HTMLImageElement>(null),
    carousel = useRef<HTMLDivElement>(null);
  const drink = useDrink(canvas, photo);
  const [about, setAbout] = useState(false);
  const [focused, setFocused] = useState(false);
  const [trayOpen, setTrayOpen] = useState(false);
  const notes = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (about) notes.current?.showModal();
    else notes.current?.close();
  }, [about]);
  const recipe = drink.recipe,
    total = totalLiquidMl(recipe),
    name = recipeName(recipe);
  const disabled = !drink.ready || drink.preparing || drink.served;
  const activeIngredient = INGREDIENTS.find((i) => i.id === drink.pouring);
  return (
    <main
      className={`experience ${drink.served ? 'is-served' : ''} ${focused ? 'cup-focus' : ''}`}
      aria-label="Kopi / Teh interactive drink maker"
    >
      <header className="masthead">
        <p className="wordmark">
          Kopi <i>/</i> Teh
        </p>
        <p className="ritual">A familiar ritual. Your own proportions.</p>
        <div className="header-actions">
          {!focused && (
            <button
              className="quiet-button culture-button"
              onClick={() => setAbout(true)}
            >
              <span className="culture-full">The language of a cup</span>
              <span className="culture-short">About</span>
            </button>
          )}
          <button
            className="quiet-button focus-toggle"
            aria-pressed={focused}
            onClick={() => {
              drink.stopPour();
              setFocused(!focused);
              setTrayOpen(false);
            }}
          >
            {focused ? 'Show mixing table' : 'Just the cup'}
            <ArrowRight size={16} />
          </button>
        </div>
      </header>
      <div className="worktable">
        <div className="photograph">
          <div
            className="scene-frame"
            style={{
              transform: `translate(-${latteAsset.liquid.center[0] * 100}%, -${latteAsset.liquid.center[1] * 100}%)`,
            }}
          >
            <img
              ref={photo}
              className="scene-photo"
              src={latteAsset.scene}
              alt=""
              aria-hidden="true"
              draggable={false}
              fetchPriority="high"
            />
            <div
              className="liquid-window"
              style={{
                left: `${(latteAsset.liquid.center[0] - latteAsset.liquid.radius[0]) * 100}%`,
                top: `${(latteAsset.liquid.center[1] - latteAsset.liquid.radius[1]) * 100}%`,
                width: `${latteAsset.liquid.radius[0] * 200}%`,
                height: `${latteAsset.liquid.radius[1] * 200}%`,
              }}
            >
              <canvas
                ref={canvas}
                className="surface-canvas"
                role="application"
                tabIndex={drink.served ? -1 : 0}
                aria-label="Drink surface. Drag in circles to stir. Arrow keys stir; space makes a ripple; R empties the cup."
              />
              {activeIngredient && (
                <div
                  className={`pour-stream stream-${activeIngredient.id}`}
                  style={
                    { '--pour-color': activeIngredient.color } as CSSProperties
                  }
                  aria-hidden="true"
                />
              )}
            </div>
          </div>
          <p className="surface-instruction" aria-live="polite">
            {drink.error
              ? 'The cup needs a moment.'
              : !drink.ready
                ? 'Warming your cup…'
                : drink.served
                  ? 'Made by you. Enjoy the moment.'
                  : activeIngredient
                    ? `Adding ${activeIngredient.label.toLowerCase()}…`
                    : total
                      ? 'Drag the surface. Stir it your way.'
                      : 'An empty cup. Every possibility.'}
          </p>
        </div>
        <section
          className="ingredient-shelf"
          aria-labelledby="make-heading"
          inert={focused}
        >
          <h1 id="make-heading">
            {drink.served ? (
              <>
                A cup of
                <br />
                <em>{name}.</em>
              </>
            ) : (
              <>
                Make it
                <br />
                <em>your way.</em>
              </>
            )}
          </h1>
          <p className="making-note">
            {drink.served ? (
              'A little more yours.'
            ) : (
              <>
                Hold an ingredient to pour.
                <br />
                Then stir the surface.
              </>
            )}
          </p>
          {!drink.served && (
            <div className="ingredient-list">
              {INGREDIENTS.map((i) => (
                <button
                  key={i.id}
                  className={`ingredient ${drink.pouring === i.id ? 'is-pouring' : ''}`}
                  disabled={
                    disabled ||
                    (i.id === 'sugar'
                      ? recipe.sugar >= 30
                      : total >= LIQUID_CAPACITY_ML)
                  }
                  aria-label={`Add ${i.label}`}
                  onPointerDown={(e) => {
                    if (e.button !== 0) return;
                    e.preventDefault();
                    e.currentTarget.setPointerCapture(e.pointerId);
                    drink.startPour(i.id);
                  }}
                  onPointerUp={drink.stopPour}
                  onPointerCancel={drink.stopPour}
                  onLostPointerCapture={drink.stopPour}
                  onClick={(e) => {
                    if (e.detail === 0)
                      drink.add(i.id, i.id === 'sugar' ? 2 : 5);
                  }}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <span
                    className="ingredient-swatch"
                    style={{ background: i.color }}
                  />
                  <span className="ingredient-name">
                    {i.label}
                    <small>
                      {i.id === 'sugar' ? '2 g each touch' : '5 ml each touch'}
                    </small>
                  </span>
                  <Plus size={15} />
                </button>
              ))}
            </div>
          )}
          {drink.served ? (
            <button
              className="quiet-button keep-mixing"
              onClick={drink.unserve}
            >
              Keep mixing <ArrowRight size={16} />
            </button>
          ) : (
            <button
              className="quiet-button undo"
              disabled={!drink.canUndo || !drink.ready || drink.preparing}
              onClick={drink.undo}
            >
              <RotateCcw size={13} /> Undo last addition
            </button>
          )}
        </section>
        <aside
          className="recipe-ticket"
          aria-label="Your cup recipe"
          inert={focused}
        >
          <div className="ticket-heading">
            <span>{drink.served ? 'Made your way' : 'Your cup'}</span>
            {drink.served ? <Check size={14} /> : <span>300 ml cup</span>}
          </div>
          <h2>{name}</h2>
          <p className="cup-quantity">
            <strong>{total}</strong> ml liquid{' '}
            <span>· {recipe.sugar} g added sugar</span>
          </p>
          <Composition recipe={recipe} />
          <dl className="recipe-lines">
            {INGREDIENTS.map((i) => (
              <div key={i.id} className={recipe[i.id] ? 'has-ingredient' : ''}>
                <dt>
                  <span style={{ background: i.color }} />
                  {i.label}
                </dt>
                <dd>
                  {recipe[i.id]} <span>{i.unit}</span>
                </dd>
              </div>
            ))}
          </dl>
          <p className="sweetness-note">{sweetnessLabel(recipe)}</p>
          <p className="recipe-context">
            {drink.selectedPreset === 'empty'
              ? 'Begin anywhere. Make a cup that is yours.'
              : drink.selectedPreset === 'kopi-o'
                ? 'O means no milk. Coffee, water and a little sweetness.'
                : drink.selectedPreset === 'kopi-c'
                  ? 'C calls for evaporated milk. Sugar is a separate choice.'
                  : drink.selectedPreset === 'teh'
                    ? 'Tea meets sweetened milk. A familiar pause in the day.'
                    : drink.selectedPreset === 'kopi'
                      ? 'Coffee softened with sweetened condensed milk. A kopitiam favourite.'
                      : 'Your proportions, your interpretation. That is how a familiar drink becomes personal.'}
          </p>
          {drink.error ? (
            <>
              <p role="alert">{drink.error}</p>
              <button className="serve-button" onClick={drink.retry}>
                Reload cup <RotateCcw size={16} />
              </button>
            </>
          ) : drink.served ? (
            <button
              className="serve-button"
              onClick={() => drink.choosePreset('empty')}
            >
              Make another <ArrowRight size={17} />
            </button>
          ) : (
            <button
              className="serve-button"
              disabled={disabled || total === 0}
              onClick={drink.serve}
            >
              {drink.preparing ? 'Preparing your cup…' : 'Serve this cup'}
              <ArrowRight size={17} />
            </button>
          )}
          {!drink.served && (
            <button
              className="empty-link"
              disabled={!drink.ready}
              onClick={() => drink.choosePreset('empty')}
            >
              Or begin with an empty cup
            </button>
          )}
        </aside>
      </div>
      <section
        className="preset-dock"
        aria-label="Premade drink carousel"
        inert={focused}
      >
        <div className="dock-heading">
          <span>Start with a familiar cup</span>
          <span className="dock-note">Every recipe is a starting point.</span>
          <div className="carousel-arrows">
            <button
              aria-label="Previous drinks"
              onClick={() =>
                carousel.current?.scrollBy({ left: -240, behavior: 'smooth' })
              }
            >
              <ChevronLeft size={16} />
            </button>
            <button
              aria-label="Next drinks"
              onClick={() =>
                carousel.current?.scrollBy({ left: 240, behavior: 'smooth' })
              }
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
        <div className="preset-carousel" ref={carousel}>
          {[
            ...DRINK_PRESETS,
            { id: 'empty', label: 'Empty cup', sequence: [] },
          ].map((p) => {
            const r = p.id === 'empty' ? EMPTY_RECIPE : recipeFromPreset(p);
            return (
              <button
                key={p.id}
                className={`preset ${drink.selectedPreset === p.id ? 'is-selected' : ''}`}
                aria-pressed={drink.selectedPreset === p.id}
                disabled={!drink.ready}
                onClick={() => drink.choosePreset(p.id)}
              >
                <MiniCup recipe={r} />
                <span className="preset-copy">
                  <span className="preset-title">{p.label}</span>
                  <small>{summaries[p.id] ?? 'Begin with your own pour'}</small>
                  <Composition recipe={r} small />
                </span>
                <span className="preset-action">
                  {drink.selectedPreset === p.id
                    ? 'Yours'
                    : p.id === 'empty'
                      ? 'Free mix'
                      : 'Try it'}
                </span>
              </button>
            );
          })}
        </div>
      </section>
      {focused && (
        <div className="focus-controls">
          {trayOpen && !drink.served && (
            <div className="focus-ingredients" aria-label="Pour ingredients">
              {INGREDIENTS.map((i) => (
                <button
                  key={i.id}
                  disabled={
                    disabled ||
                    (i.id === 'sugar' ? recipe.sugar >= 30 : total >= 300)
                  }
                  aria-label={`Pour ${i.label}`}
                  className={drink.pouring === i.id ? 'is-pouring' : ''}
                  onPointerDown={(e) => {
                    if (e.button !== 0) return;
                    e.preventDefault();
                    e.currentTarget.setPointerCapture(e.pointerId);
                    drink.startPour(i.id);
                  }}
                  onPointerUp={drink.stopPour}
                  onPointerCancel={drink.stopPour}
                  onLostPointerCapture={drink.stopPour}
                  onClick={(e) => {
                    if (e.detail === 0)
                      drink.add(i.id, i.id === 'sugar' ? 2 : 5);
                  }}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  <span style={{ background: i.color }} />
                  {i.label}
                  <small>
                    {recipe[i.id]} {i.unit}
                  </small>
                </button>
              ))}
            </div>
          )}
          <div className="focus-toolbar">
            <span className="focus-name">
              {name} <small>{total} ml</small>
            </span>
            {drink.served ? (
              <button onClick={drink.unserve}>
                Keep mixing <ArrowRight size={13} />
              </button>
            ) : (
              <>
                <button
                  aria-expanded={trayOpen}
                  onClick={() => {
                    drink.stopPour();
                    setTrayOpen(!trayOpen);
                  }}
                >
                  {trayOpen ? 'Hide ingredients' : 'Ingredients'}{' '}
                  <Plus size={13} />
                </button>
                <button
                  disabled={disabled || total === 0}
                  onClick={() => {
                    drink.serve();
                    setTrayOpen(false);
                  }}
                >
                  Serve <ArrowRight size={13} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
      <dialog
        ref={notes}
        aria-labelledby="notes-title"
        className="notes-sheet"
        onClose={() => setAbout(false)}
      >
        <button
          className="close-notes"
          autoFocus
          aria-label="Close notes"
          onClick={() => setAbout(false)}
        >
          <X size={20} />
        </button>
        <h2 id="notes-title">
          A whole language
          <br />
          <em>in a small cup.</em>
        </h2>
        <p>
          In the Singapore and Malaysia kopitiam tradition, a few words tell the
          person behind the counter how you like your coffee or tea. The same
          familiar ingredients become a different ritual, cup by cup.
        </p>
        <dl className="naming-guide">
          <div>
            <dt>Kopi / Teh</dt>
            <dd>Coffee / tea with sweetened condensed milk</dd>
          </div>
          <div>
            <dt>O</dt>
            <dd>Without milk</dd>
          </div>
          <div>
            <dt>C</dt>
            <dd>With evaporated milk</dd>
          </div>
          <div>
            <dt>Kosong</dt>
            <dd>No added sugar; never our name for a condensed-milk drink</dd>
          </div>
        </dl>
        <p className="notes-small">
          {RECIPE_NOTES.amounts} {RECIPE_NOTES.limits}
        </p>
        <p className="notes-sources">
          Naming references:{' '}
          {NAMING_SOURCES.map((s, i) => (
            <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
              {i ? ' · ' : ''}
              {s.title}
            </a>
          ))}
        </p>
      </dialog>
    </main>
  );
}
