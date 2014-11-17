module.exports = {
	mssql: {
		user: 'your-user-name',
		password: 'your-password',
		server: 'your-server',
		port: 1433,
		database: 'your-database',
		// For Azure, you'll want the following, too:
		options: {
			encrypt: true
		}
		// Also with Azure, make sure you whitelist your current IP address!
	}
};