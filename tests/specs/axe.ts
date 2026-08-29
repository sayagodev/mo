import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@axe-core/playwright/../@playwright/test';

const SHELL_RULES = ['region', 'landmark-one-main', 'page-has-heading-one'];

export async function axe(page: Page) {
  const results = await new AxeBuilder({ page }).disableRules(SHELL_RULES).analyze();
  return results.violations.map((v) => `${v.id}:${v.nodes.length}`);
}
