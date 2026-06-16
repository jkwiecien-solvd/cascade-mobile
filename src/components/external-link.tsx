import { Href, Link } from 'expo-router';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { type ComponentProps } from 'react';

// `href` is a plain `string` (e.g. a PR URL coming from the API). Typed routes
// narrow `Href` to known internal paths plus the `${string}:${string}`
// external-path template, so an arbitrary runtime `string` is not provably
// assignable to `Href`. This component is explicitly for *external* URLs, so we
// accept a `string` and coerce it to `Href` at the single `Link` boundary.
type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: string };

export function ExternalLink({ href, ...rest }: Props) {
  return (
    <Link
      target="_blank"
      {...rest}
      href={href as Href}
      onPress={async (event) => {
        if (process.env.EXPO_OS !== 'web') {
          // Prevent the default behavior of linking to the default browser on native.
          event.preventDefault();
          // Open the link in an in-app browser.
          await openBrowserAsync(href, {
            presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
          });
        }
      }}
    />
  );
}
