(() => {
  'use strict';

  const els = {
    root: document.getElementById('sht-root'),
    rows: document.getElementById('sht-rows'),
    empty: document.getElementById('sht-empty'),
    input: document.getElementById('sht-new-input'),
    addBtn: document.getElementById('sht-add-btn'),
    status: document.getElementById('sht-status'),
  };

  if (!els.root) {
    return;
  }

  const modal = {
    root: document.getElementById('sht-modal'),
    title: document.getElementById('sht-modal-title'),
    desc: document.getElementById('sht-modal-desc'),
    inputWrap: document.getElementById('sht-modal-input-wrap'),
    input: document.getElementById('sht-modal-input'),
    cancel: document.getElementById('sht-modal-cancel'),
    confirm: document.getElementById('sht-modal-confirm'),
  };

  const routes = {
    list: () => OC.generateUrl('/apps/simplehabittracker/habits'),
    create: () => OC.generateUrl('/apps/simplehabittracker/habits'),
    habit: (id) => OC.generateUrl(`/apps/simplehabittracker/habits/${id}`),
    toggle: (id) => OC.generateUrl(`/apps/simplehabittracker/habits/${id}/toggle`),
  };

  const state = {
    habits: [],
    loading: false,
  };

  const headers = {
    'Content-Type': 'application/json',
    requesttoken: OC.requestToken,
  };

  let statusTimer;
  const setStatus = (msg, isError = false) => {
    if (!els.status) return;
    els.status.textContent = msg;
    els.status.classList.toggle('sht-status--error', isError);
    clearTimeout(statusTimer);
    if (msg) {
      statusTimer = window.setTimeout(() => {
        els.status.textContent = '';
        els.status.classList.remove('sht-status--error');
      }, 4000);
    }
  };

  const openModal = (options = {}) => {
    if (!modal.root || !modal.confirm || !modal.cancel) {
      if (options.input) {
        const value = window.prompt(options.title || '', options.value || '');
        return Promise.resolve({ confirmed: value !== null, value: value ?? '' });
      }
      const ok = window.confirm(options.message || options.title || '');
      return Promise.resolve({ confirmed: ok });
    }

    const {
      title = '',
      message = '',
      confirmText = 'Confirmer',
      cancelText = 'Annuler',
      input = false,
      value = '',
      placeholder = '',
    } = options;

    if (modal.title) {
      modal.title.textContent = title;
    }

    if (modal.desc) {
      modal.desc.textContent = message;
      modal.desc.style.display = message ? 'block' : 'none';
    }

    if (modal.confirm) {
      modal.confirm.textContent = confirmText;
    }

    if (modal.cancel) {
      modal.cancel.textContent = cancelText;
    }

    if (modal.inputWrap && modal.input) {
      if (input) {
        modal.inputWrap.style.display = 'flex';
        modal.input.value = value;
        modal.input.placeholder = placeholder;
      } else {
        modal.inputWrap.style.display = 'none';
        modal.input.value = '';
      }
    }

    if (modal.confirm) {
      modal.confirm.disabled = false;
    }

    const previousActive = document.activeElement;
    modal.root.classList.add('is-open');
    modal.root.setAttribute('aria-hidden', 'false');
    document.body.classList.add('sht-modal-open');

    let inputListener;
    if (input && modal.input && modal.confirm) {
      const updateConfirmState = () => {
        modal.confirm.disabled = modal.input.value.trim().length === 0;
      };
      updateConfirmState();
      modal.input.addEventListener('input', updateConfirmState);
      inputListener = updateConfirmState;
      window.setTimeout(() => modal.input?.focus(), 0);
    } else if (modal.confirm) {
      window.setTimeout(() => modal.confirm.focus(), 0);
    }

    return new Promise((resolve) => {
      let done = false;

      const finish = (result) => {
        if (done) return;
        done = true;
        modal.root.classList.remove('is-open');
        modal.root.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('sht-modal-open');
        modal.confirm?.removeEventListener('click', onConfirm);
        modal.cancel?.removeEventListener('click', onCancel);
        modal.root?.removeEventListener('click', onOverlay);
        document.removeEventListener('keydown', onKeyDown);
        if (modal.input && inputListener) {
          modal.input.removeEventListener('input', inputListener);
          modal.input.removeEventListener('keydown', onInputKeyDown);
        }
        if (previousActive && previousActive.focus) {
          previousActive.focus();
        }
        resolve(result);
      };

      const onConfirm = () => {
        finish({ confirmed: true, value: modal.input?.value ?? '' });
      };

      const onCancel = () => finish({ confirmed: false });

      const onOverlay = (event) => {
        if (event.target === modal.root) {
          onCancel();
        }
      };

      const onKeyDown = (event) => {
        if (event.key === 'Escape') {
          onCancel();
        }
      };

      const onInputKeyDown = (event) => {
        if (event.key === 'Enter') {
          onConfirm();
        }
      };

      modal.confirm?.addEventListener('click', onConfirm);
      modal.cancel?.addEventListener('click', onCancel);
      modal.root?.addEventListener('click', onOverlay);
      document.addEventListener('keydown', onKeyDown);
      if (input && modal.input) {
        modal.input.addEventListener('keydown', onInputKeyDown);
      }
    });
  };

  const todayKey = () => (new Date()).toISOString().slice(0, 10);

  const lastDays = (count = 7) => {
    const days = [];
    const base = new Date();
    for (let i = count - 1; i >= 0; i -= 1) {
      const d = new Date(base);
      d.setDate(base.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    return days;
  };

  const fmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: '2-digit' });
  const weekdayFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' });
  const labelFor = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map((v) => parseInt(v, 10));
    const date = new Date(y, (m ?? 1) - 1, d ?? 1);
    return fmt.format(date);
  };
  const dayLetterFor = (dateStr) => {
    const [y, m, d] = dateStr.split('-').map((v) => parseInt(v, 10));
    const date = new Date(y, (m ?? 1) - 1, d ?? 1);
    const weekday = weekdayFmt.format(date).replace('.', '').trim();
    return weekday.charAt(0).toUpperCase();
  };

  const renderSpark = (history) => {
    const wrap = document.createElement('div');
    wrap.className = 'sht-spark';
    lastDays().forEach((date) => {
      const cell = document.createElement('span');
      const done = history && history[date];
      cell.className = `sht-spark__day${done ? ' is-done' : ''}`;
      cell.title = `${labelFor(date)} - ${done ? 'fait' : 'manque'}`;
      wrap.appendChild(cell);
    });
    return wrap;
  };

  const renderRows = () => {
    if (!els.rows) return;
    els.rows.innerHTML = '';
    const weekWindow = lastDays();
    const today = weekWindow[weekWindow.length - 1];
    state.habits.forEach((habit) => {
      const history = habit.history || {};
      const tr = document.createElement('tr');
      tr.dataset.habitId = String(habit.id);

      const nameTd = document.createElement('td');
      const nameBtn = document.createElement('button');
      nameBtn.type = 'button';
      nameBtn.className = 'sht-name-btn';
      nameBtn.textContent = habit.name;
      nameBtn.title = 'Renommer cette habitude';
      nameBtn.addEventListener('click', () => renameHabit(habit));

      nameTd.appendChild(nameBtn);
      nameTd.appendChild(renderSpark(history));

      const todayTd = document.createElement('td');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'sht-checkbox';
      checkbox.setAttribute('aria-label', "Marquer l'habitude comme faite");
      checkbox.checked = Boolean(history[today]);
      checkbox.addEventListener('change', (event) => {
        const done = event.target.checked;
        checkbox.disabled = true;
        toggleHabit(habit.id, done).finally(() => {
          checkbox.disabled = false;
        });
      });
      todayTd.appendChild(checkbox);

      const percentTd = document.createElement('td');
      const doneCount = weekWindow.reduce((acc, key) => acc + (history[key] ? 1 : 0), 0);
      const percent = Math.round((doneCount / weekWindow.length) * 100);
      const pctLabel = document.createElement('div');
      pctLabel.className = 'sht-percent';
      pctLabel.textContent = `${percent}%`;

      const mini = document.createElement('div');
      mini.className = 'sht-mini';
      weekWindow.forEach((date) => {
        const day = document.createElement('span');
        day.className = 'sht-mini__day';
        day.title = labelFor(date);

        const label = document.createElement('span');
        label.className = 'sht-mini__label';
        label.textContent = dayLetterFor(date);
        day.appendChild(label);

        const bar = document.createElement('span');
        bar.className = `sht-mini__bar${history[date] ? ' is-done' : ''}`;
        day.appendChild(bar);
        mini.appendChild(day);
      });
      percentTd.appendChild(pctLabel);
      percentTd.appendChild(mini);

      const actionsTd = document.createElement('td');
      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'sht-btn sht-btn--ghost';
      delBtn.textContent = 'Supprimer';
      delBtn.addEventListener('click', () => deleteHabit(habit.id));
      actionsTd.appendChild(delBtn);

      tr.appendChild(nameTd);
      tr.appendChild(todayTd);
      tr.appendChild(percentTd);
      tr.appendChild(actionsTd);

      els.rows.appendChild(tr);
    });

    if (els.empty) {
      els.empty.style.display = state.habits.length === 0 ? 'flex' : 'none';
    }
  };

  const applyHabit = (updated) => {
    const idx = state.habits.findIndex((h) => h.id === updated.id);
    if (idx === -1) {
      state.habits.unshift(updated);
    } else {
      state.habits[idx] = updated;
    }
    renderRows();
  };

  const removeHabit = (id) => {
    state.habits = state.habits.filter((h) => h.id !== id);
    renderRows();
  };

  const fetchHabits = async () => {
    state.loading = true;
    try {
      const res = await fetch(routes.list(), { headers });
      if (!res.ok) throw new Error('fetch_failed');
      const data = await res.json();
      state.habits = data.habits || [];
    } catch (error) {
      console.error(error);
      setStatus('Impossible de charger les habitudes', true);
    } finally {
      state.loading = false;
      renderRows();
    }
  };

  const addHabit = async () => {
    const name = (els.input?.value ?? '').trim();
    if (!name) {
      setStatus('Donnez un nom a votre habitude', true);
      return;
    }
    els.input.value = '';
    try {
      const res = await fetch(routes.create(), {
        method: 'POST',
        headers,
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error('create_failed');
      const data = await res.json();
      applyHabit(data.habit);
      setStatus('Habitude ajoutee');
    } catch (error) {
      console.error(error);
      setStatus('Ajout impossible', true);
    }
  };

  const renameHabit = async (habit) => {
    const result = await openModal({
      title: "Renommer l'habitude",
      message: 'Choisissez un nouveau nom.',
      confirmText: 'Enregistrer',
      cancelText: 'Annuler',
      input: true,
      value: habit.name,
      placeholder: "Nom de l'habitude",
    });
    if (!result.confirmed) {
      return;
    }
    const newName = result.value.trim();
    if (!newName || newName === habit.name) {
      return;
    }
    try {
      const res = await fetch(routes.habit(habit.id), {
        method: 'PUT',
        headers,
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) throw new Error('rename_failed');
      const data = await res.json();
      applyHabit(data.habit);
      setStatus('Habitude mise a jour');
    } catch (error) {
      console.error(error);
      setStatus('Impossible de renommer', true);
    }
  };

  const toggleHabit = async (id, done) => {
    try {
      const res = await fetch(routes.toggle(id), {
        method: 'POST',
        headers,
        body: JSON.stringify({ date: todayKey(), done }),
      });
      if (!res.ok) throw new Error('toggle_failed');
      const data = await res.json();
      applyHabit(data.habit);
    } catch (error) {
      console.error(error);
      setStatus('Mise a jour impossible', true);
      await fetchHabits();
    }
  };

  const deleteHabit = async (id) => {
    const result = await openModal({
      title: 'Supprimer cette habitude ?',
      message: 'Cette action est definitive.',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
    });
    if (!result.confirmed) {
      return;
    }
    try {
      const res = await fetch(routes.habit(id), {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) throw new Error('delete_failed');
      removeHabit(id);
      setStatus('Habitude supprimee');
    } catch (error) {
      console.error(error);
      setStatus('Suppression impossible', true);
    }
  };

  els.addBtn?.addEventListener('click', addHabit);
  els.input?.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
      addHabit();
    }
  });

  fetchHabits();
})();
