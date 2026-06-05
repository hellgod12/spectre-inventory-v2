# TODO (SPECTRE UI consistency mobile)

- [ ] Audit mobile-specific responsive CSS rules in `style.css` and `www/style.css`.
- [ ] Create backups of `style.css` and `www/style.css`.
- [ ] Override/remove `@media (hover: none) and (pointer: coarse)` visual adjustments (padding/icon/font-size/metrics spacing) to restore desktop values.
- [ ] Remove rules that force `.spectre-kpi-grid` and `.spectre-kpi-grid2` to `grid-template-columns: 1fr` on `@media(max-width:420px)` and `@media(max-width:600px)`.
- [ ] Ensure changes are applied identically to both `style.css` and `www/style.css`.
- [ ] Preserve navigation structure: keep `@media(max-width:900px)` behavior (sidebar hidden, bottom nav shown).
- [ ] Testing: open member/dashboard/penjualan/barang/pengeluaran pages on desktop mobile emulation + Capacitor preview; verify no horizontal overflow.

