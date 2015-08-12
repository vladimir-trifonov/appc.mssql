module.exports = {
	connectors: {
		'appc.mssql': {
			user: '', // Your user name.
			password: '', // Your password.
			server: '', // Your Azure server.
			port: 1433, // The port your server is using.
			database: '', // Your database.
			connectionTimeout: 15000, // Connection timeout in MS.
			requestTimeout: 15000, // Request timeout in MS.

			generateModelsFromSchema: true, // Generate models from your schema.

			// If running on Azure, you'll want the following, too:
			options: {
				encrypt: true
			}
			// Also with Azure, make sure you whitelist your current IP address (from your Azure dashboard)!
		}
	}
};