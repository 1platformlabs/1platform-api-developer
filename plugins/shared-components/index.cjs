'use strict';

/**
 * Small shared components fall below webpack's default sharing threshold:
 * the icon registry appeared in three async chunks and the prompt wrapper in
 * twenty-one. Share those modules while preserving the lazy prompt renderer.
 */
module.exports = function sharedComponents() {
  return {
    name: 'shared-document-components',
    configureWebpack(_config, isServer) {
      if (isServer) return {};
      return {
        optimization: {
          splitChunks: {
            cacheGroups: {
              sharedIcons: {
                test: /[\\/]src[\\/]components[\\/]Icon[\\/]/,
                name: 'shared-icons',
                chunks: 'all',
                enforce: true,
                priority: 20,
                reuseExistingChunk: true,
              },
              sharedPromptWrapper: {
                test: /[\\/]src[\\/]components[\\/]PromptParaAgente[\\/]index\.tsx$/,
                name: 'shared-prompt-wrapper',
                chunks: 'all',
                enforce: true,
                priority: 20,
                reuseExistingChunk: true,
              },
            },
          },
        },
      };
    },
  };
};
