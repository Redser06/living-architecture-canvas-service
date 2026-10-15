// Chunk 7: src/runtime/ui-narrative.ts (<= 80 lines)
import { el, clearChildren } from './dom-utils';
import type { CanvasRuntimeState } from './store';

export function renderNarrativeHud(
  hudEl: HTMLElement,
  state: CanvasRuntimeState,
  onSelectScene: (idx: number) => void,
  onTogglePlay: () => void
): void {
  clearChildren(hudEl);
  const scenes = state.spec.scenes || [];
  const current = scenes[state.sceneIndex] || {
    title: 'System Overview',
    narrative: 'No narrative scene defined.',
  };

  const leftBox = el('div', { className: 'narrative-box' }, [
    el('div', { className: 'scene-kicker' }, [
      `SCENE 0${state.sceneIndex + 1} / 0${scenes.length} · ${current.title}`,
    ]),
    el('div', { className: 'scene-narrative' }, [current.narrative]),
  ]);

  const controls = el('div', { className: 'toolbar-group' }, [
    el(
      'button',
      {
        className: 'btn',
        onClick: () => onSelectScene((state.sceneIndex - 1 + scenes.length) % scenes.length),
      },
      ['← Prev']
    ),
    el(
      'button',
      {
        className: `btn ${state.playing ? 'active' : ''}`,
        onClick: onTogglePlay,
      },
      [state.playing ? '⏸ Pause' : '▶ Play']
    ),
    el(
      'button',
      {
        className: 'btn btn-accent',
        onClick: () => onSelectScene((state.sceneIndex + 1) % scenes.length),
      },
      ['Next Scene →']
    ),
  ]);

  hudEl.appendChild(leftBox);
  hudEl.appendChild(controls);
}
