<?php
script('simplehabittracker', 'main');
style('simplehabittracker', 'style');
?>

<div id="sht-root" class="sht-root">
  <header class="sht-header">
    <div>
      <h2>Simple Habit Tracker</h2>
      <p>Trackez de petites habitudes et visualisez votre constance sur 7 jours.</p>
    </div>
    <span id="sht-status" class="sht-status"></span>
  </header>

  <section class="sht-card">
    <div class="sht-add-form">
      <input id="sht-new-input" type="text" placeholder="Nouvelle habitude (ex : boire de l'eau)" />
      <button id="sht-add-btn" class="sht-btn sht-btn--primary">Ajouter</button>
    </div>

    <div class="sht-table-wrapper">
      <table class="sht-table" aria-live="polite">
        <thead>
          <tr>
            <th>Habitude</th>
            <th>Aujourd'hui</th>
            <th>% sur 7 jours</th>
            <th></th>
          </tr>
        </thead>  
        <tbody id="sht-rows"></tbody>
      </table>
      <div id="sht-empty" class="sht-empty">
        Ajoutez votre premiere habitude pour commencer.
      </div>
    </div>
  </section>

  <div id="sht-modal" class="sht-modal" aria-hidden="true">
    <div
      class="sht-modal__panel"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sht-modal-title"
      aria-describedby="sht-modal-desc"
    >
      <h3 id="sht-modal-title" class="sht-modal__title"></h3>
      <p id="sht-modal-desc" class="sht-modal__desc"></p>
      <div id="sht-modal-input-wrap" class="sht-modal__input-wrap">
        <label class="sht-modal__label" for="sht-modal-input">Nom</label>
        <input id="sht-modal-input" class="sht-modal__input" type="text" />
      </div>
      <div class="sht-modal__actions">
        <button id="sht-modal-cancel" class="sht-btn sht-btn--ghost" type="button">Annuler</button>
        <button id="sht-modal-confirm" class="sht-btn sht-btn--primary" type="button">Confirmer</button>
      </div>
    </div>
  </div>
</div>
