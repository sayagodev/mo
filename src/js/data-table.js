/**
 * mo - Data Table behaviors
 *
 * <mo-data-table> upgrades a plain semantic table with shadcn-style
 * sorting, selection, filtering and client-side pagination. No state
 * machine and no re-rendering: the markup stays the source of truth and
 * the element only reorders or hides <tr> elements in place.
 *
 * - SORT: <th data-sortable><button>Email</button></th> cycles
 *   ascending → descending → none per click (bare headers get
 *   tabindex + Enter/Space). aria-sort mirrors the state; CSS draws
 *   the chevron. Rows sort by cell text — data-sort-value overrides,
 *   all-numeric columns compare numerically ("$1,200" works).
 *   Single-column sort; clearing restores the original DOM order.
 * - SELECT: <th data-select-all><input type="checkbox"> +
 *   <td data-select> checkboxes. The header checkbox reflects
 *   checked/indeterminate across the visible rows; toggling rows sets
 *   [data-selected] on the <tr> (tinted via table.css).
 * - FILTER: any <input data-table-filter> inside filters rows by text
 *   content, case-insensitive, and resets to page 1.
 * - PAGINATE: with a <footer data-table-pagination> present, tbody rows
 *   slice at data-page-size (default 10); [data-table-info] shows
 *   "N of M row(s) selected" (or "M row(s)" without a select column)
 *   and [data-table-prev]/[data-table-next] disable at the ends.
 *   A <mo-select> inside the footer drives data-page-size via its
 *   'mo-select-change' event (rows-per-page pattern).
 *
 * Emits 'mo-table-change' { sort, page, selected } on every change —
 * sort is { index, dir } | null, selected is the array of selected <tr>.
 *
 * Usage:
 * <mo-data-table>
 *   <input type="text" data-table-filter placeholder="Filter…" />
 *   <div class="table">
 *     <table>
 *       <thead>
 *         <tr>
 *           <th data-select-all><input type="checkbox" aria-label="Select all" /></th>
 *           <th data-sortable><button type="button">Email</button></th>
 *         </tr>
 *       </thead>
 *       <tbody>
 *         <tr>
 *           <td data-select><input type="checkbox" aria-label="Select row" /></td>
 *           <td>a@example.com</td>
 *         </tr>
 *       </tbody>
 *     </table>
 *   </div>
 *   <footer data-table-pagination>
 *     <span data-table-info></span>
 *     <span class="flex gap-2">
 *       <button type="button" class="outline small" data-table-prev>Previous</button>
 *       <button type="button" class="outline small" data-table-next>Next</button>
 *     </span>
 *   </footer>
 * </mo-data-table>
 */

import { MoBase } from './base.js';

/**
 * Data table upgrading a plain table with sort, filter, select and pagination.
 *
 * @tag mo-data-table
 * @attr {number} data-page-size - Rows per page when a [data-table-pagination] footer is present (default 10).
 * @fires {CustomEvent<{ sort: { index: number, dir: string } | null, page: number, selected: HTMLTableRowElement[] }>} mo-table-change - Sort, filter, selection or page changed.
 */
class OtDataTable extends MoBase {
  #sort = null; // { index, dir } | null
  #page = 1;
  #initialRows = [];

  init() {
    this.#initialRows = this.#rows();
    if (this.#initialRows.length === 0) return;

    // An author-written aria-sort declares the initial order.
    const preset = this.#headers().find((th) =>
      th.matches('[aria-sort="ascending"], [aria-sort="descending"]'));
    if (preset) {
      this.#sort = {
        index: this.#columnIndex(preset),
        dir: preset.getAttribute('aria-sort') === 'descending' ? 'desc' : 'asc',
      };
      this.#reorder();
    }

    // Bare sortable headers stay keyboard-reachable without stealing
    // columnheader semantics (the button variant needs no help).
    for (const th of this.#headers()) {
      if (th.matches('[data-sortable]') && !th.querySelector('button, a')) th.tabIndex = 0;
    }

    this.addEventListener('click', this);
    this.addEventListener('keydown', this);
    this.addEventListener('input', this);
    this.addEventListener('mo-select-change', this);

    // Rows per page is live: changing data-page-size re-renders from page 1
    // (drives the Rows per page select in the pagination footer).
    new MutationObserver(() => {
      this.#page = 1;
      this.#render();
      this.#emit();
    }).observe(this, { attributes: true, attributeFilter: ['data-page-size'] });

    this.#render();
  }

  onclick(e) {
    // Selection first: checkboxes may live inside header cells too.
    if (e.target.matches('[data-select-all] input[type="checkbox"]')) {
      const pairs = this.#selectable(this.#shown());
      // All checked → clear; otherwise (some/none) → check everything.
      const check = !(pairs.length > 0 && pairs.every((p) => p.input.checked));
      for (const { row, input } of pairs) {
        input.checked = check;
        row.toggleAttribute('data-selected', check);
      }
      this.#render();
      this.#emit();
      return;
    }

    const rowBox = e.target.closest('td[data-select] input[type="checkbox"]');
    if (rowBox) {
      rowBox.closest('tr').toggleAttribute('data-selected', rowBox.checked);
      this.#render();
      this.#emit();
      return;
    }

    const prev = e.target.closest('[data-table-prev]');
    const next = e.target.closest('[data-table-next]');
    if (prev || next) {
      this.#page += prev ? -1 : 1;
      this.#render();
      this.#emit();
      return;
    }

    // Sort: ignore clicks on other controls sharing the header cell.
    const th = e.target.closest('th[data-sortable]');
    if (!th || e.target.closest('a[href], input, select, textarea, label')) return;
    this.#sortBy(th,
      th.getAttribute('aria-sort') === 'ascending' ? 'descending'
        : th.getAttribute('aria-sort') === 'descending' ? null : 'ascending');
  }

  onkeydown(e) {
    if ((e.key !== 'Enter' && e.key !== ' ') || !e.target.matches('th[data-sortable]')) return;
    e.preventDefault();
    e.target.click();
  }

  oninput(e) {
    if (!e.target.matches('[data-table-filter]')) return;
    this.#page = 1;
    this.#render();
    this.#emit();
  }

  // Rows per page: a mo-select in the pagination footer writes its value
  // back to data-page-size; the MutationObserver above re-renders.
  ['onmo-select-change'](e) {
    const select = e.target.closest?.('mo-select');
    const footer = this.querySelector('[data-table-pagination]');
    if (!select || !footer || !footer.contains(select)) return;
    this.setAttribute('data-page-size', e.detail?.value ?? select.getAttribute('data-value') ?? '');
  }

  // -- rendering pipeline: filter → paginate → sync chrome ----------------

  #render() {
    const rows = this.#rows();
    const query = (this.querySelector('[data-table-filter]')?.value ?? '').trim().toLowerCase();
    const matched = query
      ? rows.filter((row) => row.textContent.toLowerCase().includes(query))
      : rows;

    let shown = matched;
    const pageCount = Math.max(1, Math.ceil(matched.length / this.#pageSize));
    if (this.querySelector('[data-table-pagination]')) {
      this.#page = Math.min(Math.max(1, this.#page), pageCount);
      shown = matched.slice((this.#page - 1) * this.#pageSize, this.#page * this.#pageSize);
    }
    const visible = new Set(shown);
    for (const row of rows) row.hidden = !visible.has(row);

    // Header checkbox mirrors the visible page (TanStack-style).
    const pairs = this.#selectable(shown);
    const all = this.querySelector('[data-select-all] input[type="checkbox"]');
    if (all) {
      const checked = pairs.filter((p) => p.input.checked).length;
      all.checked = pairs.length > 0 && checked === pairs.length;
      all.indeterminate = checked > 0 && checked < pairs.length;
    }

    const info = this.querySelector('[data-table-info]');
    if (info) {
      info.textContent = pairs.length > 0
        ? `${pairs.filter((p) => p.input.checked).length} of ${matched.length} row(s) selected`
        : `${matched.length} row(s)`;
    }

    const prev = this.querySelector('[data-table-prev]');
    const next = this.querySelector('[data-table-next]');
    if (prev) prev.disabled = this.#page <= 1;
    if (next) next.disabled = this.#page >= pageCount;
  }

  #sortBy(th, dir) {
    for (const other of this.querySelectorAll('th[aria-sort]')) {
      if (other !== th) other.removeAttribute('aria-sort');
    }
    if (dir) th.setAttribute('aria-sort', dir);
    else th.removeAttribute('aria-sort');

    this.#sort = dir ? { index: this.#columnIndex(th), dir: dir === 'descending' ? 'desc' : 'asc' } : null;
    this.#reorder();
    this.#page = 1;
    this.#render();
    this.#emit();
  }

  // Sorting physically reorders tbody rows so filter/pagination inherit it.
  #reorder() {
    const tbody = this.#rows()[0]?.parentElement;
    if (!tbody) return;

    if (!this.#sort) {
      for (const row of this.#initialRows) tbody.append(row);
      return;
    }

    const values = new Map();
    let numeric = true;
    for (const row of this.#rows()) {
      const cell = row.cells[this.#sort.index];
      const raw = (cell?.getAttribute('data-sort-value') ?? cell?.textContent ?? '').trim();
      const num = raw.replace(/[^0-9.-]/g, '');
      // Only columns that fully resolve to numbers ("$1,200" counts) sort numerically.
      if (!raw || !/^-?\d+(\.\d+)?$/.test(num)) numeric = false;
      values.set(row, { raw, num: Number(num) });
    }

    const dir = this.#sort.dir === 'asc' ? 1 : -1;
    const sorted = [...this.#rows()].sort((a, b) => {
      const va = values.get(a);
      const vb = values.get(b);
      const cmp = numeric ? va.num - vb.num
        : va.raw.localeCompare(vb.raw, undefined, { sensitivity: 'base', numeric: true });
      return cmp * dir;
    });
    for (const row of sorted) tbody.append(row);
  }

  #emit() {
    this.emit('mo-table-change', {
      sort: this.#sort ? { ...this.#sort } : null,
      page: this.#page,
      selected: this.#rows().filter((row) => row.hasAttribute('data-selected')),
    });
  }

  // -- helpers -------------------------------------------------------------

  #headers() {
    return [...this.querySelectorAll('thead tr:first-child > th')];
  }

  #rows() {
    return [...(this.querySelector('tbody')?.querySelectorAll('tr') ?? [])];
  }

  #shown() {
    return this.#rows().filter((row) => !row.hidden);
  }

  #selectable(rows) {
    const pairs = [];
    for (const row of rows) {
      const input = row.querySelector(':scope td[data-select] input[type="checkbox"]');
      if (input) pairs.push({ row, input });
    }
    return pairs;
  }

  #columnIndex(th) {
    return [...th.parentElement.children].indexOf(th);
  }

  get #pageSize() {
    return Math.max(1, parseInt(this.getAttribute('data-page-size'), 10) || 10);
  }
}

customElements.define('mo-data-table', OtDataTable);
