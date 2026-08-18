(() => {
  const state = { gameId: '113', gameName: 'Macro Snake' };

  const $ = (selector) => document.querySelector(selector);
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[c]));
  const number = (value) => new Intl.NumberFormat('es-ES').format(Number(value || 0));

  async function cargarRanking() {
    const list = $('#originalesRanking');
    if (!list) return;
    list.innerHTML = '<div class="mr-empty">Cargando clasificación…</div>';

    try {
      const response = await fetch(`/api/originales-ranking?action=leaderboard&gameId=${encodeURIComponent(state.gameId)}&limit=20`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'No disponible');

      const top = Array.isArray(data.top) ? data.top : [];
      $('#originalesPlayers').textContent = number(top.length);
      if (!top.length) {
        list.innerHTML = '<div class="mr-empty">Todavía no hay récords. Sé el primero.</div>';
        return;
      }

      list.innerHTML = top.map((item) => `
        <div class="mr-row">
          <div class="mr-position">${item.posicion <= 3 ? ['🥇','🥈','🥉'][item.posicion - 1] : `#${item.posicion}`}</div>
          <div class="mr-user">
            <strong>${escapeHtml(item.username)}</strong>
            <small>Nivel ${number(item.level)}</small>
          </div>
          <div class="mr-score">${number(item.score)}</div>
        </div>
      `).join('');
    } catch (error) {
      list.innerHTML = `<div class="mr-empty">No se pudo cargar la clasificación.</div>`;
      console.error(error);
    }
  }

  function iniciar() {
    $('#originalesGameName').textContent = state.gameName;
    $('#originalesGameId').textContent = state.gameId;
    $('#abrirMacroSnake')?.addEventListener('click', () => {
      window.location.href = '/html/juegos/macro-snake.html';
    });
    cargarRanking();
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', iniciar) : iniciar();
})();
