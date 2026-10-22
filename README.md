# DEPRECATED

This code has been deprecated and is no longer maintained.

Please use the [Message Box Server](https://github.com/bitcoin-sv/message-box-server) instead.


## Node security maintenance (2026-10-22)

The historical automatic Cloud Run deployment workflow is retired. Re-enabling
deployment requires a documented current owner and a separately validated
release procedure. The retained build uses Node.js22.23.4, a frozen dependency
lock and the local Knex executable. Application protocols, migrations and
dependency versions are unchanged. CI qualifies the Linux image without cloud
credentials, service creation or database writes.

The unchanged historical unit suite reports12 passes and15 failures against
its current route implementation (including missing required message IDs in
old fixtures). Those failures are retained and are not a functional acceptance
claim. The Node maintenance CI checks frozen installation, documentation build,
syntax, Linux image construction and module loading. Restoring service would
require resolving and accepting the historical protocol tests separately.
