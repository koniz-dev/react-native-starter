/**
 * A stand-in for DocumentTitle (shared/ui/DocumentTitle.tsx), which renders
 * nothing on native, so a test can read the title a screen sets. Mock the
 * module with it, then read the titles with documentTitles():
 *
 *   jest.mock('@/shared/ui/DocumentTitle', () =>
 *     jest.requireActual('@/testing/documentTitle')
 *   );
 */
import { createElement } from 'react';
import { screen } from '@testing-library/react-native';

export function DocumentTitle({ title }: { title: string }) {
  // A host element: the test renderer keeps only host elements.
  return createElement('DocumentTitle', { title });
}

/** The titles of the rendered DocumentTitles, screens under others included. */
export function documentTitles(): string[] {
  return screen.container
    .queryAll(node => node.type === 'DocumentTitle')
    .map(node => String(node.props.title));
}
