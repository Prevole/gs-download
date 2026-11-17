export default {
  branches: [
    "main"
  ],
  plugins: [
    ['@semantic-release/commit-analyzer', {
      preset: 'angular',
      releaseRules: [
        // Dependabot commits use "build(deps)", which the default Angular
        // rules ignore. Publish a patch release for dependency updates.
        { type: 'build', scope: 'deps', release: 'patch' },
        { type: 'ci', release: 'patch' },
      ],
    }],
    '@semantic-release/release-notes-generator',
    '@semantic-release/npm',
    '@semantic-release/github',
  ],
};
