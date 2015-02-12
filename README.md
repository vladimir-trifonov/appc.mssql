# MSSQL Connector

This is an Arrow connector to Microsoft SQL Server (MSSQL).

> This software is pre-release and not yet ready for usage.  Please don't use this just yet while we're working through testing and finishing it up. Once it's ready, we'll make an announcement about it.

To install:

```bash
$ appc install connector/appc.mssql --save
```

Reference the connector in your model.

```javascript
var Account = Arrow.Model.extend('Account',{
	fields: {
		Name: { type: String, required: true, validator: /[a-zA-Z]{3,}/ }
	},
	connector: 'appc.mssql'
});
```

If you want to map a specific model to a specific table, use metadata.  For example, to map the `account` model to the table named `accounts`, set it such as:

```javascript
var Account = Arrow.Model.extend('account',{
	fields: {
		Name: { type: String, required: false, validator: /[a-zA-Z]{3,}/ }
	},
	connector: 'appc.mssql',
	metadata: {
		'appc.mssql': {
			table: 'accounts'
		}
	}
});
```

# Testing

The tests will automatically create their own table named "TEST_Post".

# License

This source code is licensed as part of the Appcelerator Enterprise Platform and subject to the End User License Agreement and Enterprise License and Ordering Agreement. Copyright (c) 2014-2015 by Appcelerator, Inc. All Rights Reserved. This source code is Proprietary and Confidential to Appcelerator, Inc.

