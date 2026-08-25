import n8nNodesBase from 'eslint-plugin-n8n-nodes-base';

export default [
  {
    files: ['dist/**/*.js'],
    plugins: {
      'n8n-nodes-base': n8nNodesBase,
    },
    rules: {
      'no-console': 'error',
      'n8n-nodes-base/community-package-json-name-still-default': 'off',
      'n8n-nodes-base/community-package-json-author-email-still-default': 'off',
      'n8n-nodes-base/community-package-json-author-name-still-default': 'off',
    },
  },
];
