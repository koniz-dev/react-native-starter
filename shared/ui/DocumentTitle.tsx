/**
 * Sets the browser tab's title on the web; renders nothing on native.
 * Render it in a screen with the screen's own title.
 *
 * Native renders nothing on purpose: in an iOS build (not Expo Go),
 * expo-router's `Head` needs a hosted `origin` for Handoff and throws without
 * one. The web version is `DocumentTitle.web.tsx`.
 */
export const DocumentTitle: (props: { title: string }) => null = () => null;
