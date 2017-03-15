var should = require('should')
var Arrow = require('arrow')
var common = require('./common')
var server = common.server
var connector = server.getConnector('appc.mssql')

describe('Connector Capabilities', Arrow.Connector.generateTests(connector, module))
