import type { EventLocation } from '../types';
import { STATUS_COLORS } from '../status';
import { escapeHtml } from './format';

const panel = document.getElementById('detail-panel') as HTMLElement;
let onClose: (() => void) | undefined;

function eventLink(url: string | null, label: string): string {
  return url
    ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${label} ↗</a>`
    : '<span class="muted">None scheduled</span>';
}

export function showDetails(location: EventLocation, closeHandler: () => void): void {
  onClose = closeHandler;
  const color = STATUS_COLORS[location.status];

  panel.innerHTML = `
    <button class="close-btn" type="button" aria-label="Close details">×</button>
    <span class="status-chip" style="--chip:${color}">${escapeHtml(location.status)}</span>
    <h2>${escapeHtml(location.name)}</h2>
    <p class="address">${escapeHtml(location.address)}</p>
    <div class="stats">
      <div><span class="stat-value">${location.avgCars.toLocaleString()}</span><span class="stat-label">avg cars</span></div>
      <div><span class="stat-value">${location.avgHonks.toLocaleString()}</span><span class="stat-label">avg honks</span></div>
    </div>
    <dl>
      <dt>Organizers</dt><dd>${escapeHtml(location.organizers)}</dd>
      <dt>Last event</dt><dd>${eventLink(location.lastEventUrl, 'View')}</dd>
      <dt>Next event</dt><dd>${eventLink(location.nextEventUrl, 'View')}</dd>
    </dl>
  `;
  panel.querySelector('.close-btn')!.addEventListener('click', hideDetails);
  panel.hidden = false;
}

export function hideDetails(): void {
  if (panel.hidden) return;
  panel.hidden = true;
  panel.innerHTML = '';
  onClose?.();
  onClose = undefined;
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') hideDetails();
});
