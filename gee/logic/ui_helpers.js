/**
 * Kleine UI-Hilfsfunktionen für die GEE-App.
 */

/**
 * Zeigt ein UI-Widget.
 * @param {ui.Widget} widget
 */
function show(widget) {
  widget.style().set('shown', true);
}

/**
 * Versteckt ein UI-Widget.
 * @param {ui.Widget} widget
 */
function hide(widget) {
  widget.style().set('shown', false);
}

exports.show = show;
exports.hide = hide;
