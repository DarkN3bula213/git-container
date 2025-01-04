module.exports = {
	extends: ['@commitlint/config-conventional'],
	rules: {
		'type-enum': [
			2,
			'always',
			[
				'feat', // New feature
				'fix', // Bug fix
				'docs', // Documentation
				'style', // Code style changes
				'refactor', // Code refactoring
				'perf', // Performance improvements
				'test', // Adding tests
				'chore', // Maintenance
				'revert', // Reverting changes
				'ci' // CI/CD changes
			]
		],
		'type-case': [2, 'always', 'lower-case'],
		'type-empty': [2, 'never'],
		// 'subject-case': [2, 'always', 'lower-case'],
		// 'subject-empty': [2, 'never'],
		// 'subject-full-stop': [2, 'never', '.']
	}
};


