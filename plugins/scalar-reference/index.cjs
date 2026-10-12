const path = require('node:path');
const officialPlugin = require('@scalar/docusaurus').default;

/** Keep the official Scalar integration's assets and configuration. Docusaurus's
 * public addRoute hook changes only the host component, not the API renderer. */
module.exports = function infrastructureReference(context, options) {
  const plugin = officialPlugin(context, options);
  return {
    ...plugin,
    // The route component owns its runtime. The official preBody script is
    // parser-blocking and would otherwise load on every documentation page.
    injectHtmlTags() { return {}; },
    async contentLoaded(args) {
      return plugin.contentLoaded({
        ...args,
        actions: {
          ...args.actions,
          addRoute(route) {
            args.actions.addRoute({
              ...route,
              component: path.resolve(__dirname, '../../src/components/ApiReferencePage/index.tsx'),
            });
          },
        },
      });
    },
  };
};
